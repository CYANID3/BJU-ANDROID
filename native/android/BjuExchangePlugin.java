package kg.bju.app;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.provider.Settings;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;
import java.lang.reflect.Method;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.Map;

/**
 * Обмен продуктами с телефоном рядом: Google Nearby Connections (поиск по Bluetooth, передача по Wi‑Fi напрямую, без интернета).
 * Оба телефона одновременно и видны (advertising), и ищут (discovery). Подключение подтверждают оба — по одинаковому коду из 4 цифр.
 * Сообщение (текст JSON) режется на части по 24 000 байт; каждая часть — payload BYTES с заголовком:
 *   [0] 'M', [1..4] номер сообщения, [5..8] номер части, [9..12] всего частей, [13..16] длина сообщения в байтах.
 * События в JS: found, lost, initiated, connected, rejected, disconnected, message, progress.
 * Интерфейс целиком в приложении; системные окна — только разрешение «Устройства поблизости» и «Включить Bluetooth?».
 */
@CapacitorPlugin(
    name = "BjuExchange",
    permissions = {
        @Permission(alias = "bt", strings = { Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_ADVERTISE, Manifest.permission.BLUETOOTH_CONNECT }),
        @Permission(alias = "wifi", strings = { Manifest.permission.NEARBY_WIFI_DEVICES }),
        // местоположение: Nearby Connections на части телефонов с Android 13+ всё равно требует его для поиска (ошибка 8034 —
        // MISSING_PERMISSION_ACCESS_COARSE_LOCATION), хотя по документации хватает «Устройств поблизости». Само местоположение не читается
        @Permission(alias = "locc", strings = { Manifest.permission.ACCESS_COARSE_LOCATION }),
        @Permission(alias = "locf", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
    }
)
public class BjuExchangePlugin extends Plugin {

    private static final String SERVICE_ID = "kg.bju.app.exchange";
    private static final Strategy STRATEGY = Strategy.P2P_POINT_TO_POINT;
    private static final int CHUNK = 24000;

    private ConnectionsClient client;
    private String myName = "";
    private int msgSeq = 1;
    // сборка входящих сообщений: ключ — endpoint + номер сообщения
    private final Map<String, byte[][]> parts = new ConcurrentHashMap<>();
    private final Map<String, Integer> partsGot = new ConcurrentHashMap<>();
    private final Map<String, Integer> partsLen = new ConcurrentHashMap<>();
    // исходящие части: id payload → [endpoint, байт]; для прогресса отправки
    private final Map<Long, Object[]> outgoing = new ConcurrentHashMap<>();
    private final Map<String, long[]> outTotals = new ConcurrentHashMap<>();

    private ConnectionsClient cc() {
        if (client == null) client = Nearby.getConnectionsClient(getContext());
        return client;
    }

    // Разрешения — как в документации Nearby Connections (developers.google.com/nearby/connections/android/get-started):
    //   Android 9 и ниже (API ≤ 28) — ACCESS_COARSE_LOCATION;
    //   Android 10–12 (API 29–31)   — ACCESS_FINE_LOCATION, то есть ТОЧНОЕ: с «Приблизительно» поиск отклоняется с кодом 8034;
    //   Android 12+ (API ≥ 31)      — BLUETOOTH_SCAN / ADVERTISE / CONNECT, Android 13+ — NEARBY_WIFI_DEVICES;
    //   Android 12L+ (API ≥ 32)     — местоположение не нужно. Если Сервисы Google Play всё же отклонят поиск с 8034,
    //   страница попросит местоположение отдельно (requestPrecise) — только тогда, когда без него не работает.
    private String[] neededAliases() {
        List<String> a = new ArrayList<>();
        int v = Build.VERSION.SDK_INT;
        if (v >= 31) a.add("bt");
        if (v >= 33) a.add("wifi");
        if (v <= 28) a.add("locc");
        else if (v <= 31) { a.add("locc"); a.add("locf"); }
        return a.toArray(new String[0]);
    }

    private boolean permsGranted() {
        for (String al : neededAliases()) if (getPermissionState(al) != PermissionState.GRANTED) return false;
        return true;
    }

    // геолокация в системе включена (без неё поиск не начинается — та же ошибка 8034)
    private boolean locOn() {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) return true;
            if (Build.VERSION.SDK_INT >= 28) return lm.isLocationEnabled();
            return lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Exception e) { return true; }
    }

    private boolean btOn() {
        try {
            BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter a = m != null ? m.getAdapter() : null;
            return a != null && a.isEnabled();
        } catch (Exception e) { return false; }
    }

    private boolean btExists() {
        try {
            BluetoothManager m = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            return m != null && m.getAdapter() != null;
        } catch (Exception e) { return false; }
    }

    private boolean wifiOn() {
        try {
            WifiManager w = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            return w != null && w.isWifiEnabled();
        } catch (Exception e) { return true; }
    }

    // состояние: разрешения (granted / prompt / denied — отказано «больше не спрашивать»), Bluetooth, Wi‑Fi, имя телефона
    @PluginMethod
    public void state(PluginCall call) {
        JSObject o = new JSObject();
        String perm = "granted";
        for (String al : neededAliases()) {
            PermissionState s = getPermissionState(al);
            if (s == PermissionState.DENIED) { perm = "denied"; break; }
            if (s != PermissionState.GRANTED) perm = "prompt";
        }
        o.put("perm", perm);
        o.put("bt", btOn());
        o.put("btExists", btExists());
        o.put("wifi", wifiOn());
        o.put("loc", locOn());
        // подробности для экрана ошибки: что именно разрешено (точное местоположение отдельно от приблизительного)
        o.put("coarse", getPermissionState("locc") == PermissionState.GRANTED);
        o.put("fine", getPermissionState("locf") == PermissionState.GRANTED);
        o.put("nearby", Build.VERSION.SDK_INT < 31 || getPermissionState("bt") == PermissionState.GRANTED);
        o.put("gms", gmsVersion());
        o.put("model", deviceName());
        o.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(o);
    }

    private String deviceName() {
        String n = null;
        try { n = Settings.Global.getString(getContext().getContentResolver(), "device_name"); } catch (Exception ignored) { }
        if (n == null || n.trim().isEmpty()) {
            String man = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER, mod = Build.MODEL == null ? "" : Build.MODEL;
            n = mod.toLowerCase().startsWith(man.toLowerCase()) ? mod : (man.isEmpty() ? mod : Character.toUpperCase(man.charAt(0)) + man.substring(1) + " " + mod);
        }
        return n.trim();
    }

    // версия Сервисов Google Play (Nearby Connections работает внутри них): для подсказки «обновите Сервисы Google Play»
    private String gmsVersion() {
        try { return getContext().getPackageManager().getPackageInfo("com.google.android.gms", 0).versionName; } catch (Exception e) { return ""; }
    }

    // попросить местоположение с точным (Android 12+ покажет «Изменить на точное», если приблизительное уже есть).
    // Нужно на Android 10–12 и как запасной путь, если Сервисы Google Play отклонили поиск с 8034
    @PluginMethod
    public void requestPrecise(PluginCall call) {
        requestPermissionForAliases(new String[] { "locc", "locf" }, call, "onPerms");
    }

    @PluginMethod
    public void requestPerms(PluginCall call) {
        if (permsGranted()) { JSObject o = new JSObject(); o.put("granted", true); call.resolve(o); return; }
        requestPermissionForAliases(neededAliases(), call, "onPerms");
    }

    @PermissionCallback
    private void onPerms(PluginCall call) {
        JSObject o = new JSObject();
        o.put("granted", permsGranted());
        call.resolve(o);
    }

    @PluginMethod
    public void enableBt(PluginCall call) {
        if (btOn()) { JSObject o = new JSObject(); o.put("enabled", true); call.resolve(o); return; }
        try {
            startActivityForResult(call, new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), "onBt");
        } catch (Exception e) {
            call.reject("Не удалось открыть включение Bluetooth", "BT");
        }
    }

    @ActivityCallback
    private void onBt(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject o = new JSObject();
        o.put("enabled", btOn());
        call.resolve(o);
    }

    @PluginMethod
    public void openLocation(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("Не удалось открыть настройки геолокации", "SETTINGS"); }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("Не удалось открыть настройки", "SETTINGS"); }
    }

    // начать: быть видимым и искать одновременно. name — короткая строка с именем, цветом, моделью и числом продуктов
    @PluginMethod
    public void start(PluginCall call) {
        myName = call.getString("name", "");
        if (!permsGranted()) { call.reject("Нет разрешения", "PERM"); return; }
        final ConnectionsClient c = cc();
        c.stopAdvertising(); c.stopDiscovery();
        c.startAdvertising(myName, SERVICE_ID, lifecycle, new AdvertisingOptions.Builder().setStrategy(STRATEGY).build())
            .addOnSuccessListener(v -> c.startDiscovery(SERVICE_ID, discovery, new DiscoveryOptions.Builder().setStrategy(STRATEGY).build())
                .addOnSuccessListener(w -> call.resolve())
                .addOnFailureListener(e -> call.reject(msg(e), String.valueOf(code(e)))))
            .addOnFailureListener(e -> call.reject(msg(e), String.valueOf(code(e))));
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            ConnectionsClient c = cc();
            c.stopAdvertising(); c.stopDiscovery(); c.stopAllEndpoints();
        } catch (Exception ignored) { }
        parts.clear(); partsGot.clear(); partsLen.clear(); outgoing.clear(); outTotals.clear();
        call.resolve();
    }

    // найденные стали неинтересны (идёт обмен): перестать быть видимым и искать, соединение остаётся
    @PluginMethod
    public void pause(PluginCall call) {
        try { cc().stopAdvertising(); cc().stopDiscovery(); } catch (Exception ignored) { }
        call.resolve();
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("Нет id"); return; }
        cc().requestConnection(myName, id, lifecycle)
            .addOnSuccessListener(v -> call.resolve())
            .addOnFailureListener(e -> call.reject(msg(e), String.valueOf(code(e))));
    }

    @PluginMethod
    public void accept(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("Нет id"); return; }
        cc().acceptConnection(id, payloads)
            .addOnSuccessListener(v -> call.resolve())
            .addOnFailureListener(e -> call.reject(msg(e), String.valueOf(code(e))));
    }

    @PluginMethod
    public void reject(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("Нет id"); return; }
        cc().rejectConnection(id).addOnSuccessListener(v -> call.resolve()).addOnFailureListener(e -> call.resolve());
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        String id = call.getString("id");
        if (id != null) try { cc().disconnectFromEndpoint(id); } catch (Exception ignored) { }
        call.resolve();
    }

    @PluginMethod
    public void send(PluginCall call) {
        String id = call.getString("id"), data = call.getString("data", "");
        if (id == null) { call.reject("Нет id"); return; }
        byte[] all = data.getBytes(StandardCharsets.UTF_8);
        int n = Math.max(1, (all.length + CHUNK - 1) / CHUNK), seq = msgSeq++;
        long[] tot = outTotals.get(id);
        if (tot == null) { tot = new long[] { 0, 0 }; outTotals.put(id, tot); }
        tot[1] += all.length;
        try {
            for (int i = 0; i < n; i++) {
                int from = i * CHUNK, len = Math.min(CHUNK, all.length - from);
                ByteBuffer b = ByteBuffer.allocate(17 + Math.max(0, len));
                b.put((byte) 'M').putInt(seq).putInt(i).putInt(n).putInt(all.length);
                if (len > 0) b.put(all, from, len);
                Payload p = Payload.fromBytes(b.array());
                outgoing.put(p.getId(), new Object[] { id, (long) Math.max(0, len) });
                cc().sendPayload(id, p);
            }
            call.resolve();
        } catch (Exception e) { call.reject(msg(e), "SEND"); }
    }

    private final EndpointDiscoveryCallback discovery = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(String endpointId, DiscoveredEndpointInfo info) {
            if (!SERVICE_ID.equals(info.getServiceId())) return;
            JSObject o = new JSObject();
            o.put("id", endpointId);
            o.put("name", info.getEndpointName());
            notifyListeners("found", o);
        }

        @Override
        public void onEndpointLost(String endpointId) {
            JSObject o = new JSObject();
            o.put("id", endpointId);
            notifyListeners("lost", o);
        }
    };

    private final ConnectionLifecycleCallback lifecycle = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(String endpointId, ConnectionInfo info) {
            JSObject o = new JSObject();
            o.put("id", endpointId);
            o.put("name", info.getEndpointName());
            o.put("code", authCode(info));
            o.put("incoming", info.isIncomingConnection());
            notifyListeners("initiated", o);
        }

        @Override
        public void onConnectionResult(String endpointId, ConnectionResolution result) {
            JSObject o = new JSObject();
            o.put("id", endpointId);
            int st = result.getStatus().getStatusCode();
            o.put("code", st);
            notifyListeners(st == ConnectionsStatusCodes.STATUS_OK ? "connected" : "rejected", o);
        }

        @Override
        public void onDisconnected(String endpointId) {
            dropParts(endpointId);
            JSObject o = new JSObject();
            o.put("id", endpointId);
            notifyListeners("disconnected", o);
        }
    };

    // недособранные сообщения от собеседника, который отключился, больше не нужны
    private void dropParts(String endpointId) {
        String pre = endpointId + "#";
        parts.keySet().removeIf(k -> k.startsWith(pre));
        partsGot.keySet().removeIf(k -> k.startsWith(pre));
        partsLen.keySet().removeIf(k -> k.startsWith(pre));
    }

    private final PayloadCallback payloads = new PayloadCallback() {
        @Override
        public void onPayloadReceived(String endpointId, Payload payload) {
            if (payload.getType() != Payload.Type.BYTES) return;
            byte[] raw = payload.asBytes();
            if (raw == null || raw.length < 17 || raw[0] != 'M') return;
            ByteBuffer b = ByteBuffer.wrap(raw);
            b.get();
            int seq = b.getInt(), i = b.getInt(), n = b.getInt(), len = b.getInt();
            if (n <= 0 || n > 4096 || i < 0 || i >= n || len < 0 || len > 64 * 1024 * 1024) return;
            String key = endpointId + "#" + seq;
            byte[][] arr = parts.get(key);
            if (arr == null) { arr = new byte[n][]; parts.put(key, arr); partsGot.put(key, 0); partsLen.put(key, len); }
            // части одного сообщения должны сходиться по числу и длине (иначе — испорченное сообщение, не падаем)
            Integer total = partsLen.get(key);
            if (total == null || arr.length != n || total != len) return; // сборку сбросили (стоп) или части не сходятся
            if (arr[i] == null) {
                arr[i] = new byte[raw.length - 17];
                System.arraycopy(raw, 17, arr[i], 0, raw.length - 17);
                partsGot.merge(key, 1, Integer::sum);
            }
            Integer gotN = partsGot.get(key);
            if (gotN == null) return;
            int got = gotN;
            JSObject pr = new JSObject();
            pr.put("id", endpointId); pr.put("dir", "in");
            long done = 0; for (byte[] x : arr) if (x != null) done += x.length;
            pr.put("done", done); pr.put("total", (long) len);
            notifyListeners("progress", pr);
            if (got == n) {
                ByteBuffer all = ByteBuffer.allocate(len);
                for (byte[] x : arr) if (all.remaining() >= x.length) all.put(x);
                parts.remove(key); partsGot.remove(key); partsLen.remove(key);
                JSObject o = new JSObject();
                o.put("id", endpointId);
                o.put("data", new String(all.array(), StandardCharsets.UTF_8));
                notifyListeners("message", o);
            }
        }

        @Override
        public void onPayloadTransferUpdate(String endpointId, PayloadTransferUpdate u) {
            Object[] out = outgoing.get(u.getPayloadId());
            if (out == null) return;
            int st = u.getStatus();
            if (st == PayloadTransferUpdate.Status.SUCCESS || st == PayloadTransferUpdate.Status.FAILURE || st == PayloadTransferUpdate.Status.CANCELED) {
                outgoing.remove(u.getPayloadId());
                long[] tot = outTotals.get((String) out[0]);
                if (tot == null) return;
                if (st == PayloadTransferUpdate.Status.SUCCESS) tot[0] += (Long) out[1];
                JSObject pr = new JSObject();
                pr.put("id", out[0]); pr.put("dir", "out"); pr.put("done", tot[0]); pr.put("total", tot[1]);
                pr.put("failed", st != PayloadTransferUpdate.Status.SUCCESS);
                notifyListeners("progress", pr);
            }
        }
    };

    // код из 4 цифр, одинаковый на обоих телефонах (в новых версиях библиотеки — getAuthenticationDigits)
    private static String authCode(ConnectionInfo info) {
        for (String m : new String[] { "getAuthenticationDigits", "getAuthenticationToken" }) {
            try {
                Method f = info.getClass().getMethod(m);
                Object r = f.invoke(info);
                if (r != null && !r.toString().isEmpty()) return r.toString();
            } catch (Exception ignored) { }
        }
        return "";
    }

    private static int code(Exception e) {
        return e instanceof ApiException ? ((ApiException) e).getStatusCode() : -1;
    }

    private static String msg(Exception e) {
        int c = code(e);
        if (c == ConnectionsStatusCodes.STATUS_ALREADY_ADVERTISING || c == ConnectionsStatusCodes.STATUS_ALREADY_DISCOVERING) return "Уже идёт";
        String m = e.getMessage() != null ? e.getMessage() : "Ошибка " + c;
        // имя кода от самой библиотеки (например MISSING_PERMISSION_ACCESS_FINE_LOCATION) — по нему страница понимает, чего не хватает
        if (c > 0 && !m.contains("_")) {
            try { m = m + " " + ConnectionsStatusCodes.getStatusCodeString(c); } catch (Exception ignored) { }
        }
        return m;
    }

    @Override
    protected void handleOnDestroy() {
        try { if (client != null) { client.stopAdvertising(); client.stopDiscovery(); client.stopAllEndpoints(); } } catch (Exception ignored) { }
    }
}
