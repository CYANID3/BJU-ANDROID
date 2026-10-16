package kg.bju.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Виджет рабочего стола: БЖУ за сегодня. Восемь раскладок под размер (ширина 1–4 × высота 1–2 ячейки):
 *   T1 1×1 — три строки «Б / Ж / У + съедено»;        T2 1×2 — три блока: съедено, полоска, «из нормы»;
 *   N2 2×1 — три колонки: съедено + полоска;          S  2×2 — остаток калорий + три строки «съедено / норма»;
 *   W3 3×1 — колонки «съедено/норма» + полоски;        M  3×2 и низкий 4×2 — калории, «+», колонки с остатком;
 *   W4 4×1 — то же + кнопка «+»;                       L  высокий 4×2 — калории с полосой + подробные строки.
 * Данные пишет приложение (BjuNativePlugin.updateWidget) в SharedPreferences.
 */
public class BjuWidget extends AppWidgetProvider {

    static final String PREFS = "bju_widget";
    private static final int T1 = 0, N2 = 1, W3 = 2, W4 = 3, T2 = 4, S = 5, M = 6, L = 7;
    private static final int[] LAYOUT = {
        R.layout.bju_widget_t1, R.layout.bju_widget_n2, R.layout.bju_widget_w3, R.layout.bju_widget_w4,
        R.layout.bju_widget_t2, R.layout.bju_widget_s, R.layout.bju_widget_m, R.layout.bju_widget,
        R.layout.bju_widget_t2x, R.layout.bju_widget_sx, R.layout.bju_widget_lx
    };
    // увеличенные варианты (если лаунчер позволил растянуть выше двух строк) ведут себя как обычные
    private static final int[] BASE = { 0, 1, 2, 3, 4, 5, 6, 7, 4, 5, 7 };
    // минимальный размер (dp), с которого включается раскладка
    private static final float[][] MIN = { { 40, 40 }, { 95, 40 }, { 210, 40 }, { 270, 40 }, { 40, 115 }, { 95, 115 }, { 240, 115 }, { 250, 165 }, { 40, 240 }, { 95, 240 }, { 250, 240 } };

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) render(ctx, mgr, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle options) {
        render(ctx, mgr, id);
    }

    static void renderAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, BjuWidget.class));
        if (ids != null) for (int id : ids) render(ctx, mgr, id);
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

    /** Данные за сегодня. Если сохранены за другой день — показывается пустой день. */
    static final class Data {
        final boolean dark;
        final int accent, bg, tx, mu, danger = 0xFFEF6B6B;
        final int kcal, kcalGoal;
        final float[] eaten = new float[3], goal = new float[3];
        final int[] color = new int[3];

        Data(Context ctx) {
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            boolean fresh = today.equals(p.getString("date", ""));
            dark = p.getBoolean("dark", true);
            accent = p.getInt("accent", 0xFF22A565);
            bg = p.getInt("bg", dark ? 0xFF1A1E25 : 0xFFFFFFFF);
            tx = dark ? 0xFFEEF1F5 : 0xFF161A22;
            mu = dark ? 0xFF8F98A8 : 0xFF6A7282;
            kcalGoal = p.getInt("goal", 0);
            kcal = fresh ? p.getInt("eaten", 0) : 0;
            String[] k = { "p", "f", "c" };
            for (int i = 0; i < 3; i++) {
                eaten[i] = fresh ? p.getFloat(k[i], 0f) : 0f;
                goal[i] = p.getFloat("g" + k[i], 0f);
            }
            color[0] = dark ? 0xFF3CC77F : 0xFF22A565;
            color[1] = dark ? 0xFFF2B33D : 0xFFE89A17;
            color[2] = dark ? 0xFF5B9CF0 : 0xFF3A7FF0;
        }
    }

    private static final int[] LBL = { R.id.bju_p_lbl, R.id.bju_f_lbl, R.id.bju_c_lbl };
    private static final int[] VAL = { R.id.bju_p_val, R.id.bju_f_val, R.id.bju_c_val };
    private static final int[] BAR = { R.id.bju_p_bar, R.id.bju_f_bar, R.id.bju_c_bar };
    private static final int[] REST = { R.id.bju_p_rest, R.id.bju_f_rest, R.id.bju_c_rest };
    private static final String[] SHORT = { "Б", "Ж", "У" };
    private static final String[] FULL = { "Белки", "Жиры", "Углеводы" };

    static RemoteViews build(Context ctx, int layoutKind, Data d) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), LAYOUT[layoutKind]);
        int kind = BASE[layoutKind];
        // фон: цвет карточки приложения (с оттенком акцента, если он включён) + тонкая рамка
        v.setInt(R.id.bju_w_bg, "setColorFilter", d.bg);
        v.setInt(R.id.bju_w_bg, "setImageAlpha", d.dark ? 0xF2 : 0xF7);
        v.setImageViewResource(R.id.bju_w_stroke, d.dark ? R.drawable.bju_widget_stroke_dark : R.drawable.bju_widget_stroke_light);

        boolean hasBar = kind != T1, hasRest = kind == T2 || kind == M || kind == L, hasAdd = kind == W4 || kind == M || kind == L;
        for (int i = 0; i < 3; i++) {
            float e = d.eaten[i], g = d.goal[i];
            boolean over = g > 0 && e > g, warn = over && i > 0; // перебор белка — не ошибка
            v.setTextViewText(LBL[i], kind == M || kind == L ? FULL[i] : SHORT[i]);
            v.setTextColor(LBL[i], d.color[i]);
            String val;
            if (kind == T1 || kind == N2 || kind == T2) val = r(e);
            else if (kind == W3 || kind == W4) val = r(e) + "/" + r(g);
            else if (kind == M) val = r(e) + " / " + r(g);
            else val = r(e) + " / " + r(g) + " г";
            v.setTextViewText(VAL[i], val);
            v.setTextColor(VAL[i], warn ? d.danger : d.tx);
            if (hasBar) {
                v.setProgressBar(BAR[i], 1000, g > 0 ? (int) Math.min(1000, Math.max(0, e) * 1000 / g) : 0, false);
                if (Build.VERSION.SDK_INT >= 31) v.setColorStateList(BAR[i], "setProgressTintList", ColorStateList.valueOf(warn ? d.danger : d.color[i]));
            }
            if (hasRest) {
                String rest = g <= 0 ? "" : kind == T2 ? "из " + r(g) : over ? "сверх " + r(e - g) : "ещё " + r(g - e);
                v.setTextViewText(REST[i], rest);
                v.setTextColor(REST[i], warn && kind != T2 ? d.danger : d.mu);
            }
        }

        int left = d.kcalGoal - d.kcal;
        if (kind == S || kind == M) {
            String t = d.kcalGoal <= 0 ? "БЖУ" : kind == S ? (left >= 0 ? "Ещё " + left + " ккал" : "Сверх " + (-left) + " ккал")
                : left >= 0 ? "Осталось " + left + " ккал" : "Перебор " + (-left) + " ккал";
            v.setTextViewText(R.id.bju_w_left, t);
            v.setTextColor(R.id.bju_w_left, left < 0 ? d.danger : d.tx);
        }
        if (kind == L) {
            v.setTextViewText(R.id.bju_w_label, (left >= 0 ? "Осталось" : "Перебор") + " · съедено " + d.kcal);
            v.setTextColor(R.id.bju_w_label, d.mu);
            v.setTextViewText(R.id.bju_w_left, d.kcalGoal <= 0 ? "—" : Math.abs(left) + " ккал");
            v.setTextColor(R.id.bju_w_left, left < 0 ? d.danger : d.tx);
            v.setProgressBar(R.id.bju_w_bar, 1000, d.kcalGoal > 0 ? Math.min(1000, Math.max(0, d.kcal) * 1000 / d.kcalGoal) : 0, false);
            if (Build.VERSION.SDK_INT >= 31) v.setColorStateList(R.id.bju_w_bar, "setProgressTintList", ColorStateList.valueOf(left < 0 ? d.danger : d.accent));
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.bju_w_root, PendingIntent.getActivity(ctx, 1, open, flags));
        if (hasAdd) {
            v.setInt(R.id.bju_w_add_bg, "setColorFilter", d.accent);
            Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse("bju://add?m=auto"), ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            v.setOnClickPendingIntent(R.id.bju_w_add, PendingIntent.getActivity(ctx, 2, add, flags));
        }
        return v;
    }

    private static String r(float x) {
        return String.valueOf(Math.round(x));
    }
}
