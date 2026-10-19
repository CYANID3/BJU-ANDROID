package kg.bju.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Виджет рабочего стола: БЖУ за сегодня. Одиннадцать раскладок под размер (ширина 1–4 × высота 1–2 ячейки):
 *   T1 1×1 — кольцо калорий;                         N2 2×1 — остаток калорий + Б / Ж / У строкой;
 *   W3 3×1 — колонки «Осталось», Б, Ж, У с полосками;  W4 4×1 — то же + «＋»;
 *   T2 1×2 — кольцо + Б / Ж / У;                      S  2×2 — кольцо + Б / Ж / У + полоски;
 *   M  3×2 и низкий 4×2 — шапка с «＋», кольцо, строки Б / Ж / У;  L высокий 4×2 — то же крупнее;
 *   T2x / Sx / Lx — увеличенные варианты, если лаунчер растянул виджет выше двух строк.
 * Кольцо рисуется картинкой: размер числа считается от свободного места внутри, поэтому цифры не касаются кольца.
 * Цвета — из приложения: светлая и тёмная палитры сразу. При теме «Как в системе» на Android 12+ виджет
 * переключается вместе с телефоном сам (цвета «день / ночь» в RemoteViews), на старых — при каждом обновлении.
 * Данные пишет приложение (BjuNativePlugin.updateWidget) в SharedPreferences. В полночь виджет обновляется сам.
 */
public class BjuWidget extends AppWidgetProvider {

    static final String PREFS = "bju_widget";
    static final String ACTION_MIDNIGHT = "kg.bju.app.WIDGET_MIDNIGHT";
    private static final int T1 = 0, N2 = 1, W3 = 2, W4 = 3, T2 = 4, S = 5, M = 6, L = 7;
    private static final int[] LAYOUT = {
        R.layout.bju_widget_t1, R.layout.bju_widget_n2, R.layout.bju_widget_w3, R.layout.bju_widget_w4,
        R.layout.bju_widget_t2, R.layout.bju_widget_s, R.layout.bju_widget_m, R.layout.bju_widget,
        R.layout.bju_widget_t2x, R.layout.bju_widget_sx, R.layout.bju_widget_lx
    };
    // увеличенные варианты ведут себя как обычные
    private static final int[] BASE = { 0, 1, 2, 3, 4, 5, 6, 7, 4, 5, 7 };
    // минимальный размер (dp), с которого включается раскладка
    private static final float[][] MIN = { { 40, 40 }, { 95, 40 }, { 210, 40 }, { 270, 40 }, { 40, 115 }, { 95, 115 }, { 240, 115 }, { 250, 165 }, { 40, 240 }, { 95, 240 }, { 250, 240 } };
    // кольцо: размер картинки (dp) и толщина линии; картинка масштабируется под место в разметке
    private static final int[] RING = { 72, 0, 0, 0, 104, 104, 92, 112, 132, 132, 150 };

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) render(ctx, mgr, id);
        scheduleMidnight(ctx);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle options) {
        render(ctx, mgr, id);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (ACTION_MIDNIGHT.equals(intent.getAction())) {
            renderAll(ctx);
            scheduleMidnight(ctx);
            return;
        }
        super.onReceive(ctx, intent);
    }

    @Override
    public void onDisabled(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(midnightIntent(ctx));
    }

    private static PendingIntent midnightIntent(Context ctx) {
        Intent i = new Intent(ctx, BjuWidget.class).setAction(ACTION_MIDNIGHT);
        return PendingIntent.getBroadcast(ctx, 3, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Новый день — пустой виджет сразу после полуночи (без точного будильника: система может сдвинуть на пару минут). */
    static void scheduleMidnight(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 5);
        c.set(Calendar.MILLISECOND, 0);
        am.set(AlarmManager.RTC, c.getTimeInMillis(), midnightIntent(ctx));
    }

    static void renderAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, BjuWidget.class));
        if (ids == null || ids.length == 0) return;
        for (int id : ids) render(ctx, mgr, id);
        scheduleMidnight(ctx);
    }

    /** Самая крупная раскладка, которая помещается в размер (для Android до 12). */
    static int pick(float w, float h) {
        int best = T1;
        float area = 0;
        for (int k = 0; k < MIN.length; k++) {
            if (w >= MIN[k][0] && h >= MIN[k][1] && MIN[k][0] * MIN[k][1] > area) {
                best = k;
                area = MIN[k][0] * MIN[k][1];
            }
        }
        return best;
    }

    static void render(Context ctx, AppWidgetManager mgr, int id) {
        Data d = new Data(ctx);
        if (Build.VERSION.SDK_INT >= 31) {
            // Android 12+: система сама переключает раскладки при изменении размера
            Map<SizeF, RemoteViews> map = new HashMap<>();
            for (int k = 0; k < MIN.length; k++) map.put(new SizeF(MIN[k][0], MIN[k][1]), build(ctx, k, d));
            mgr.updateAppWidget(id, new RemoteViews(map));
        } else {
            Bundle o = mgr.getAppWidgetOptions(id);
            int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
            int h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 110);
            mgr.updateAppWidget(id, build(ctx, pick(w, h), d));
        }
    }

    /** Цвета одной темы. */
    static final class Pal {
        final int bg, tx, mu, trk, ac, on, danger;
        final int[] macro;

        Pal(SharedPreferences p, String k, boolean dark) {
            bg = p.getInt(k + "bg", dark ? 0xFF282B31 : 0xFFFFFFFF);
            tx = p.getInt(k + "tx", dark ? 0xFFEEF2F7 : 0xFF151A21);
            mu = p.getInt(k + "mu", dark ? 0xFFA9ADB6 : 0xFF5F6877);
            trk = p.getInt(k + "trk", dark ? 0xFF3B3E45 : 0xFFE6E9EF);
            ac = p.getInt(k + "ac", dark ? 0xFF7C70F0 : 0xFF5B4FD6);
            on = p.getInt(k + "on", 0xFFFFFFFF);
            danger = dark ? 0xFFEF6B6B : 0xFFD64545;
            macro = dark ? new int[] { 0xFF3CC77F, 0xFFF2B33D, 0xFF5B9CF0 } : new int[] { 0xFF1E9E5E, 0xFFD98A0B, 0xFF2F74E0 };
        }
    }

    /** Данные за сегодня. Если сохранены за другой день — показывается пустой день. */
    static final class Data {
        final Pal day, night;
        final String theme;
        final int kcal, kcalGoal;
        final float[] eaten = new float[3], goal = new float[3];

        Data(Context ctx) {
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            boolean fresh = today.equals(p.getString("date", ""));
            day = new Pal(p, "l_", false);
            night = new Pal(p, "d_", true);
            theme = p.getString("theme", "auto");
            kcalGoal = p.getInt("goal", 0);
            kcal = fresh ? p.getInt("eaten", 0) : 0;
            String[] k = { "p", "f", "c" };
            for (int i = 0; i < 3; i++) {
                eaten[i] = fresh ? p.getFloat(k[i], 0f) : 0f;
                goal[i] = p.getFloat("g" + k[i], 0f);
            }
        }

        /** Палитры «днём» и «ночью»: при выбранной в приложении теме обе одинаковые. */
        Pal lightPal() { return "dark".equals(theme) ? night : day; }
        Pal darkPal() { return "light".equals(theme) ? day : night; }
        /** До Android 12 — одна палитра, по теме телефона на момент обновления. */
        Pal now(Context ctx) {
            boolean sysDark = (ctx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
            return sysDark ? darkPal() : lightPal();
        }
    }

    private static final int[] LBL = { R.id.bju_p_lbl, R.id.bju_f_lbl, R.id.bju_c_lbl };
    private static final int[] VAL = { R.id.bju_p_val, R.id.bju_f_val, R.id.bju_c_val };
    private static final int[] GOAL = { R.id.bju_p_goal, R.id.bju_f_goal, R.id.bju_c_goal };
    private static final int[] BAR = { R.id.bju_p_bar, R.id.bju_f_bar, R.id.bju_c_bar };

    interface ColorOf { int get(Pal p); }

    /** Цвет «день / ночь»: на Android 12+ система выбирает сама, раньше — по теме на момент обновления. */
    private static void color(RemoteViews v, int id, String method, Data d, Pal now, ColorOf f) {
        if (Build.VERSION.SDK_INT >= 31) v.setColorInt(id, method, f.get(d.lightPal()), f.get(d.darkPal()));
        else v.setInt(id, method, f.get(now));
    }

    private static void tint(RemoteViews v, int id, Data d, Pal now, ColorOf fg, ColorOf track) {
        if (Build.VERSION.SDK_INT >= 31) {
            v.setColorStateList(id, "setProgressTintList", ColorStateList.valueOf(fg.get(d.lightPal())), ColorStateList.valueOf(fg.get(d.darkPal())));
            v.setColorStateList(id, "setProgressBackgroundTintList", ColorStateList.valueOf(track.get(d.lightPal())), ColorStateList.valueOf(track.get(d.darkPal())));
        }
        // до Android 12 полоски — своего цвета из разметки (bju_progress_*.xml)
    }

    static RemoteViews build(Context ctx, int layoutKind, Data d) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), LAYOUT[layoutKind]);
        int kind = BASE[layoutKind];
        Pal now = d.now(ctx);
        float dens = ctx.getResources().getDisplayMetrics().density;
        int left = d.kcalGoal - d.kcal;
        boolean over = d.kcalGoal > 0 && left < 0;
        float frac = d.kcalGoal > 0 ? Math.max(0, d.kcal) / (float) d.kcalGoal : 0;

        // фон — цвет карточки приложения
        color(v, R.id.bju_w_bg, "setColorFilter", d, now, p -> p.bg);

        boolean hasRing = RING[layoutKind] > 0, hasKcal = kind == N2 || kind == W3 || kind == W4;
        boolean hasGoal = kind == W3 || kind == W4 || kind == M || kind == L, hasBar = kind != T1 && kind != N2 && kind != T2;
        boolean hasHead = kind == M || kind == L, hasAdd = kind == W4 || kind == M || kind == L, hasMacro = kind != T1;

        if (hasRing) {
            String num = d.kcalGoal <= 0 ? String.valueOf(Math.max(0, d.kcal)) : over ? "+" + (-left) : String.valueOf(left);
            String lab = d.kcalGoal <= 0 ? "ккал" : over ? "перебор" : "осталось";
            int size = RING[layoutKind];
            float stroke = size <= 80 ? 7 : 9;
            if (Build.VERSION.SDK_INT >= 31) {
                Icon a = Icon.createWithBitmap(ring(d.lightPal(), size, stroke, frac, over, num, lab, dens));
                Icon b = Icon.createWithBitmap(ring(d.darkPal(), size, stroke, frac, over, num, lab, dens));
                v.setIcon(R.id.bju_w_ring, "setImageIcon", a, b);
            } else {
                v.setImageViewBitmap(R.id.bju_w_ring, ring(now, size, stroke, frac, over, num, lab, dens));
            }
            v.setContentDescription(R.id.bju_w_ring, d.kcalGoal <= 0 ? "Съедено " + d.kcal + " ккал" : (over ? "Перебор " + (-left) : "Осталось " + left) + " ккал из " + d.kcalGoal);
        }

        if (hasKcal) {
            v.setTextViewText(R.id.bju_k_lbl, over ? "Перебор" : "Осталось");
            v.setTextViewText(R.id.bju_k_val, d.kcalGoal <= 0 ? "—" : String.valueOf(Math.abs(left)));
            color(v, R.id.bju_k_lbl, "setTextColor", d, now, p -> p.mu);
            color(v, R.id.bju_k_val, "setTextColor", d, now, p -> over ? p.danger : p.tx);
            color(v, R.id.bju_k_unit, "setTextColor", d, now, p -> p.mu);
            v.setProgressBar(R.id.bju_w_bar, 1000, (int) (Math.min(1, frac) * 1000), false);
            tint(v, R.id.bju_w_bar, d, now, p -> over ? p.danger : p.ac, p -> p.trk);
        }

        if (hasHead) {
            v.setTextViewText(R.id.bju_w_head, d.kcalGoal > 0 ? "Сегодня · съедено " + d.kcal + " из " + d.kcalGoal : "Сегодня · съедено " + d.kcal + " ккал");
            color(v, R.id.bju_w_head, "setTextColor", d, now, p -> p.mu);
        }

        if (hasMacro) {
            for (int i = 0; i < 3; i++) {
                final int k = i;
                float e = d.eaten[i], g = d.goal[i];
                boolean warn = g > 0 && e > g && i > 0; // перебор белка — не ошибка
                String val = kind == M || kind == L ? r1(e) : r(e);
                v.setTextViewText(VAL[i], val);
                color(v, LBL[i], "setTextColor", d, now, p -> p.macro[k]);
                color(v, VAL[i], "setTextColor", d, now, p -> warn ? p.danger : p.tx);
                if (hasGoal) {
                    v.setTextViewText(GOAL[i], (kind == M || kind == L ? " / " : "/") + r(g) + (kind == M || kind == L ? " г" : ""));
                    color(v, GOAL[i], "setTextColor", d, now, p -> p.mu);
                }
                if (hasBar) {
                    v.setProgressBar(BAR[i], 1000, g > 0 ? (int) Math.min(1000, Math.max(0, e) * 1000 / g) : 0, false);
                    tint(v, BAR[i], d, now, p -> warn ? p.danger : p.macro[k], p -> p.trk);
                }
            }
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.bju_w_root, PendingIntent.getActivity(ctx, 1, open, flags));
        if (hasAdd) {
            color(v, R.id.bju_w_add_bg, "setColorFilter", d, now, p -> p.ac);
            color(v, R.id.bju_w_add_ic, "setColorFilter", d, now, p -> p.on);
            // «＋» делает то же, что «＋» в нижней панели приложения (настройка «Кнопка «＋» в панели»)
            Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse("bju://fab"), ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            v.setOnClickPendingIntent(R.id.bju_w_add, PendingIntent.getActivity(ctx, 2, add, flags));
        }
        return v;
    }

    /**
     * Кольцо калорий с числом внутри. Размер шрифта — от свободного места внутри кольца (около 27% диаметра),
     * число при необходимости уменьшается, чтобы не доставать до линии; подпись — только если помещается.
     */
    static Bitmap ring(Pal p, int sizeDp, float strokeDp, float frac, boolean over, String num, String label, float dens) {
        int px = Math.max(24, Math.round(sizeDp * dens));
        float sw = strokeDp * dens;
        Bitmap b = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        Paint a = new Paint(Paint.ANTI_ALIAS_FLAG);
        a.setStyle(Paint.Style.STROKE);
        a.setStrokeWidth(sw);
        RectF r = new RectF(sw / 2, sw / 2, px - sw / 2, px - sw / 2);
        a.setColor(p.trk);
        c.drawArc(r, 0, 360, false, a);
        if (frac > 0) {
            a.setColor(over ? p.danger : p.ac);
            a.setStrokeCap(Paint.Cap.ROUND);
            c.drawArc(r, -90, Math.max(2f, 360f * Math.min(1f, frac)), false, a);
        }
        float inner = px - 2 * sw - 12 * dens, cx = px / 2f, cy = px / 2f;
        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
        t.setTextAlign(Paint.Align.CENTER);
        t.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        t.setColor(over ? p.danger : p.tx);
        float ts = Math.min(26 * dens, inner * 0.27f);
        t.setTextSize(ts);
        while (t.measureText(num) > inner * 0.84f && ts > 8 * dens) t.setTextSize(ts -= dens);
        boolean lab = inner >= 70 * dens && label != null && !label.isEmpty();
        if (lab) {
            Paint l = new Paint(Paint.ANTI_ALIAS_FLAG);
            l.setTextAlign(Paint.Align.CENTER);
            l.setColor(p.mu);
            l.setTextSize(Math.max(9 * dens, ts * 0.44f));
            c.drawText(num, cx, cy + ts * 0.22f, t);
            c.drawText(label, cx, cy + ts * 0.22f + l.getTextSize() * 1.45f, l);
        } else {
            c.drawText(num, cx, cy + ts * 0.36f, t);
        }
        return b;
    }

    private static String r(float x) {
        return String.valueOf(Math.round(x));
    }

    private static String r1(float x) {
        float v = Math.round(x * 10) / 10f;
        return (v == Math.rint(v) ? String.valueOf((int) v) : String.valueOf(v)).replace('.', ',');
    }
}
