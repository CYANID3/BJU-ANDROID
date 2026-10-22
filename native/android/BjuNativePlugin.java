package kg.bju.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.UriPermission;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.OpenableColumns;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsAnimation;
import android.view.WindowInsetsController;
import android.webkit.WebView;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

/**
 * Нативная часть приложения БЖУ.
 *  - Системные отступы (статус-бар, навигация, клавиатура) передаются в JS событием "insets"
 *    в CSS-пикселях. WebView сам их не применяет — раскладкой управляет страница, поэтому
 *    при открытии клавиатуры окно не «прыгает», а лист плавно поднимается вслед за ней.
 *  - Файл данных через системный выбор файла (Storage Access Framework) с постоянным доступом:
 *    выбранный файл остаётся основным после перезапуска приложения.
 *  - Цвет и стиль системных панелей под тему приложения.
 */
@CapacitorPlugin(name = "BjuNative")
public class BjuNativePlugin extends Plugin {

    private static final String MIME = "application/json";
    private JSObject lastInsets = null;
    private boolean imeAnimating = false;

    // ---------- Insets / клавиатура ----------

    @Override
    public void load() {
        final Activity activity = getActivity();
        activity.runOnUiThread(() -> setupInsets(activity));
    }

    @SuppressWarnings("deprecation")
    private void setupInsets(Activity activity) {
        Window window = activity.getWindow();
        WebView webView = getBridge().getWebView();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false);
            final int barsMask = WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout();
            // Высота клавиатуры передаётся на каждом кадре её анимации ("live"), поэтому лист
            // движется вместе с клавиатурой, а не догоняет её после окончания анимации.
            webView.setWindowInsetsAnimationCallback(
                new WindowInsetsAnimation.Callback(WindowInsetsAnimation.Callback.DISPATCH_MODE_STOP) {
                    @Override
                    public void onPrepare(WindowInsetsAnimation animation) {
                        if ((animation.getTypeMask() & WindowInsets.Type.ime()) != 0) imeAnimating = true;
                    }

                    @Override
                    public WindowInsetsAnimation.Bounds onStart(WindowInsetsAnimation animation, WindowInsetsAnimation.Bounds bounds) {
                        return bounds;
                    }

                    @Override
                    public WindowInsets onProgress(WindowInsets insets, List<WindowInsetsAnimation> running) {
                        if (imeAnimating) {
                            Insets bars = insets.getInsets(barsMask);
                            Insets ime = insets.getInsets(WindowInsets.Type.ime());
                            sendInsets(bars.top, bars.bottom, bars.left, bars.right, Math.max(0, ime.bottom - bars.bottom), "live");
                        }
                        return insets;
                    }

                    @Override
                    public void onEnd(WindowInsetsAnimation animation) {
                        if ((animation.getTypeMask() & WindowInsets.Type.ime()) == 0) return;
                        imeAnimating = false;
                        WindowInsets r = webView.getRootWindowInsets();
                        if (r != null) {
                            Insets bars = r.getInsets(barsMask);
                            Insets ime = r.getInsets(WindowInsets.Type.ime());
                            sendInsets(bars.top, bars.bottom, bars.left, bars.right, Math.max(0, ime.bottom - bars.bottom), "end");
                        }
                        // после того как клавиатура убралась, WebView на некоторых телефонах не рисует новый кадр, пока его
                        // не коснутся (часть экрана остаётся «пустой»): просим перерисоваться сразу и ещё раз чуть позже
                        webView.postInvalidate();
                        webView.postDelayed(webView::postInvalidate, 150);
                    }
                }
            );
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                // во время анимации клавиатуры значения идут из onProgress/onEnd
                if (!imeAnimating) {
                    Insets bars = insets.getInsets(barsMask);
                    Insets ime = insets.getInsets(WindowInsets.Type.ime());
                    sendInsets(bars.top, bars.bottom, bars.left, bars.right, Math.max(0, ime.bottom - bars.bottom), "set");
                }
                return WindowInsets.CONSUMED;
            });
        } else {
            View decor = window.getDecorView();
            decor.setSystemUiVisibility(
                decor.getSystemUiVisibility() |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
            webView.setOnApplyWindowInsetsListener((v, insets) -> {
                int bottomBar = insets.getStableInsetBottom();
                int ime = Math.max(0, insets.getSystemWindowInsetBottom() - bottomBar);
                sendInsets(
                    insets.getSystemWindowInsetTop(),
                    bottomBar,
                    insets.getSystemWindowInsetLeft(),
                    insets.getSystemWindowInsetRight(),
                    ime,
                    "set"
                );
                return insets.consumeSystemWindowInsets();
            });
        }
        webView.requestApplyInsets();
    }

    /** mode: "live" — кадр анимации клавиатуры, "end" — её конец, "set" — изменение без анимации. */
    private void sendInsets(int top, int bottom, int left, int right, int ime, String mode) {
        float d = getContext().getResources().getDisplayMetrics().density;
        JSObject o = new JSObject();
        o.put("top", top / d);
        o.put("bottom", bottom / d);
        o.put("left", left / d);
        o.put("right", right / d);
        o.put("keyboard", ime / d);
        o.put("mode", mode);
        o.put("duration", "set".equals(mode) ? 250 : 0);
        lastInsets = o;
        notifyListeners("insets", o, !"live".equals(mode));
    }

    @PluginMethod
    public void getInsets(PluginCall call) {
        call.resolve(lastInsets != null ? lastInsets : new JSObject());
    }

    // ---------- Системные панели ----------

    @PluginMethod
    @SuppressWarnings("deprecation")
    public void setBars(PluginCall call) {
        final String color = call.getString("color", "#14171c");
        final boolean light = Boolean.TRUE.equals(call.getBoolean("light", false));
        getActivity().runOnUiThread(() -> {
            Window w = getActivity().getWindow();
            try {
                int c = Color.parseColor(color);
                w.getDecorView().setBackgroundColor(c);
                View parent = (View) getBridge().getWebView().getParent();
                if (parent != null) parent.setBackgroundColor(c);
                getBridge().getWebView().setBackgroundColor(c);
            } catch (IllegalArgumentException ignored) {}
            if (Build.VERSION.SDK_INT >= 30) {
                WindowInsetsController ic = w.getInsetsController();
                if (ic != null) {
                    int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    ic.setSystemBarsAppearance(light ? mask : 0, mask);
                }
            } else {
                View decor = w.getDecorView();
                int f = decor.getSystemUiVisibility();
                int mask = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | (Build.VERSION.SDK_INT >= 26 ? View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR : 0);
                decor.setSystemUiVisibility(light ? (f | mask) : (f & ~mask));
            }
            call.resolve();
        });
    }

    // ---------- Виброотклик ----------

    /**
     * Системный виброотклик Android. type: key — нажатие клавиши, confirm — сохранение, long — удаление,
     * tick — листание и переключатели, threshold — порог жеста, reject — ошибка ввода.
     * strength: light — более тихие отклики, normal — стандартные, strong — короткая «тяжёлая» вибрация (Android 10+).
     * Возвращает ok=false, если система отклик не выполнила (тогда страница вибрирует обычным способом).
     */
    @PluginMethod
    public void feedback(PluginCall call) {
        final String type = call.getString("type", "tick");
        final String strength = call.getString("strength", "normal");
        getActivity().runOnUiThread(() -> {
            boolean ok = false;
            try {
                if ("strong".equals(strength) && Build.VERSION.SDK_INT >= 29) {
                    Vibrator vib = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
                    if (vib != null && vib.hasVibrator()) {
                        boolean light = "key".equals(type) || "tick".equals(type);
                        vib.vibrate(VibrationEffect.createPredefined(light ? VibrationEffect.EFFECT_CLICK : VibrationEffect.EFFECT_HEAVY_CLICK));
                        ok = true;
                    }
                }
                if (!ok) {
                    View v = getBridge().getWebView();
                    ok = v != null && v.performHapticFeedback(hapticConstant(type, "light".equals(strength)));
                }
            } catch (Exception ignored) {}
            JSObject r = new JSObject();
            r.put("ok", ok);
            call.resolve(r);
        });
    }

    private static int hapticConstant(String type, boolean light) {
        final int sdk = Build.VERSION.SDK_INT;
        switch (type) {
            case "key":
                return light ? HapticFeedbackConstants.CLOCK_TICK : HapticFeedbackConstants.KEYBOARD_TAP;
            case "confirm":
                return sdk >= 30 && !light ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.CONTEXT_CLICK;
            case "long":
                return light ? HapticFeedbackConstants.CONTEXT_CLICK : HapticFeedbackConstants.LONG_PRESS;
            case "threshold":
                return sdk >= 30 && !light ? HapticFeedbackConstants.GESTURE_START : HapticFeedbackConstants.CLOCK_TICK;
            case "reject":
                return sdk >= 30 ? HapticFeedbackConstants.REJECT : HapticFeedbackConstants.LONG_PRESS;
            default:
                return light ? HapticFeedbackConstants.CLOCK_TICK : HapticFeedbackConstants.VIRTUAL_KEY;
        }
    }

    // ---------- Виджет рабочего стола ----------

    /**
     * Ярлык «Вес» в меню долгого нажатия на иконку приложения — только когда отслеживание веса включено.
     * Остальные ярлыки (приёмы пищи) статические, из res/xml/bju_shortcuts.xml. Если «Вес» закреплён на рабочем
     * столе, а вес выключили — ярлык становится неактивным с пояснением.
     */
    @PluginMethod
    public void setShortcuts(PluginCall call) {
        if (Build.VERSION.SDK_INT < 25) { call.resolve(); return; }
        try {
            Context ctx = getContext();
            ShortcutManager sm = ctx.getSystemService(ShortcutManager.class);
            if (sm == null) { call.resolve(); return; }
            List<String> ids = Collections.singletonList("weight");
            if (Boolean.TRUE.equals(call.getBoolean("weight", false))) {
                Intent it = new Intent(Intent.ACTION_VIEW, Uri.parse("bju://weight"), ctx, MainActivity.class);
                ShortcutInfo si = new ShortcutInfo.Builder(ctx, "weight")
                    .setShortLabel(ctx.getString(R.string.bju_sc_weight))
                    .setLongLabel(ctx.getString(R.string.bju_sc_weight_long))
                    .setIcon(Icon.createWithResource(ctx, R.drawable.bju_sc_weight))
                    .setIntent(it).setRank(0).build();
                sm.enableShortcuts(ids);
                sm.setDynamicShortcuts(Collections.singletonList(si));
            } else {
                sm.removeAllDynamicShortcuts();
                sm.disableShortcuts(ids, "Отслеживание веса выключено в настройках");
            }
        } catch (Exception ignored) { }
        call.resolve();
    }

    // Системная тема (тёмная / светлая). Активность не пересоздаётся при её смене (uiMode в configChanges у Capacitor),
    // и WebView не всегда обновляет prefers-color-scheme без перезапуска — поэтому сообщаем странице сами
    private boolean sysDark(Configuration c) {
        return c != null && (c.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
    }

    @PluginMethod
    public void sysTheme(PluginCall call) {
        JSObject r = new JSObject();
        r.put("dark", sysDark(getContext().getResources().getConfiguration()));
        call.resolve(r);
    }

    private Boolean lastDark = null;

    private void pushSysTheme(Configuration c) {
        boolean d = sysDark(c);
        if (lastDark != null && lastDark == d) return;
        lastDark = d;
        JSObject r = new JSObject();
        r.put("dark", d);
        notifyListeners("sysTheme", r);
    }

    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        pushSysTheme(newConfig);
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        pushSysTheme(getContext().getResources().getConfiguration());
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        SharedPreferences.Editor e = getContext().getSharedPreferences(BjuWidget.PREFS, Context.MODE_PRIVATE).edit();
        e.putString("date", call.getString("date", ""));
        e.putInt("eaten", call.getInt("eaten", 0));
        e.putInt("goal", call.getInt("goal", 0));
        for (String k : new String[] { "p", "f", "c", "gp", "gf", "gc" }) {
            Float v = call.getFloat(k, 0f);
            e.putFloat(k, v != null ? v : 0f);
        }
        // тема («auto» — как в системе) и обе палитры приложения: виджет сам выбирает светлую или тёмную
        String th = call.getString("theme", "auto");
        e.putString("theme", "light".equals(th) || "dark".equals(th) ? th : "auto");
        for (String[] pk : new String[][] { { "light", "l_" }, { "dark", "d_" } }) {
            JSObject pal = call.getObject(pk[0]);
            if (pal == null) continue;
            for (String k : new String[] { "bg", "tx", "mu", "trk", "ac", "on" }) {
                String c = pal.getString(k);
                try {
                    if (c != null && !c.isEmpty()) e.putInt(pk[1] + k, Color.parseColor(c));
                } catch (IllegalArgumentException ignored) {}
            }
        }
        e.apply();
        BjuWidget.renderAll(getContext());
        call.resolve();
    }

    // ---------- Файл данных (SAF) ----------

    @PluginMethod
    public void createFile(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(MIME);
        i.putExtra(Intent.EXTRA_TITLE, call.getString("name", "bju-data.json"));
        startActivityForResult(call, i, "onFilePicked");
    }

    @PluginMethod
    public void openFile(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        // .json часто приходит как application/octet-stream или text/plain — показываем всё
        i.setType("*/*");
        startActivityForResult(call, i, "onFilePicked");
    }

    @ActivityCallback
    private void onFilePicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Отменено", "CANCELLED");
            return;
        }
        Uri uri = data.getData();
        ContentResolver cr = getContext().getContentResolver();
        boolean writable = true;
        try {
            cr.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        } catch (SecurityException e) {
            writable = false;
            try {
                cr.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (SecurityException ignored) {}
        }
        JSObject o = new JSObject();
        o.put("uri", uri.toString());
        o.put("name", displayName(uri));
        o.put("writable", writable);
        call.resolve(o);
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        String u = call.getString("uri");
        if (u == null) {
            call.reject("Нет uri");
            return;
        }
        try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(u))) {
            if (in == null) throw new Exception("Файл недоступен");
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] b = new byte[16384];
            int n;
            while ((n = in.read(b)) > 0) buf.write(b, 0, n);
            JSObject o = new JSObject();
            o.put("data", new String(buf.toByteArray(), StandardCharsets.UTF_8));
            call.resolve(o);
        } catch (SecurityException e) {
            call.reject("Нет доступа к файлу", "NO_ACCESS", e);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "Ошибка чтения", "READ_FAILED", e);
        }
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String u = call.getString("uri");
        String data = call.getString("data", "");
        if (u == null) {
            call.reject("Нет uri");
            return;
        }
        Uri uri = Uri.parse(u);
        byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
        Exception last = null;
        // "wt" — запись с обрезкой; некоторые провайдеры (облака) поддерживают только "w"
        for (String mode : new String[] { "wt", "rwt", "w" }) {
            // режим "w" у части провайдеров не обрезает файл: если новые данные короче, в конце остался бы хвост старых
            // и файл перестал бы читаться. Добиваем пробелами до прежнего размера — JSON с пробелами в конце читается
            byte[] w = bytes;
            if ("w".equals(mode)) {
                long old = fileSize(uri);
                if (old > bytes.length && old < 64L * 1024 * 1024) {
                    w = java.util.Arrays.copyOf(bytes, (int) old);
                    java.util.Arrays.fill(w, bytes.length, w.length, (byte) ' ');
                }
            }
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, mode)) {
                if (out == null) throw new Exception("Файл недоступен");
                out.write(w);
                out.flush();
                call.resolve();
                return;
            } catch (SecurityException e) {
                call.reject("Нет доступа к файлу", "NO_ACCESS", e);
                return;
            } catch (Exception e) {
                last = e;
            }
        }
        call.reject(last != null && last.getMessage() != null ? last.getMessage() : "Ошибка записи", "WRITE_FAILED", last);
    }

    /** Есть ли ещё постоянный доступ к файлу (после перезапуска / обновления приложения). */
    @PluginMethod
    public void checkFile(PluginCall call) {
        String u = call.getString("uri");
        JSObject o = new JSObject();
        boolean read = false, write = false;
        if (u != null) {
            for (UriPermission p : getContext().getContentResolver().getPersistedUriPermissions()) {
                if (p.getUri().toString().equals(u)) {
                    read = p.isReadPermission();
                    write = p.isWritePermission();
                }
            }
        }
        o.put("read", read);
        o.put("write", write);
        o.put("name", read && u != null ? displayName(Uri.parse(u)) : "");
        call.resolve(o);
    }

    @PluginMethod
    public void releaseFile(PluginCall call) {
        String u = call.getString("uri");
        if (u != null) {
            try {
                getContext()
                    .getContentResolver()
                    .releasePersistableUriPermission(Uri.parse(u), Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }

    private long fileSize(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.SIZE }, null, null, null)) {
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception ignored) {}
        return -1;
    }

    private String displayName(Uri uri) {
        try (Cursor c = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String n = c.getString(0);
                if (n != null) return n;
            }
        } catch (Exception ignored) {}
        String s = uri.getLastPathSegment();
        return s != null ? s : "bju-data.json";
    }
}
