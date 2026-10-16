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
 * Виджет рабочего стола: БЖУ за сегодня (и остаток калорий на крупных размерах).
 * Раскладка зависит от размера:
 *   S — маленький: три строки БЖУ с полосками;
 *   W — широкий низкий: БЖУ в одну строку + «+»;
 *   M — средний: остаток калорий + БЖУ колонками с остатком;
 *   L — большой: калории с полосой + подробные строки БЖУ.
 * Данные пишет приложение (BjuNativePlugin.updateWidget) в SharedPreferences.
 */
public class BjuWidget extends AppWidgetProvider {

    static final String PREFS = "bju_widget";
    private static final int S = 0, W = 1, M = 2, L = 3;

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

    static int pick(float w, float h) {
        if (w >= 250 && h >= 165) return L;
        if (w >= 200 && h >= 120) return M;
        if (w >= 200) return W;
        return S;
    }

    static void render(Context ctx, AppWidgetManager mgr, int id) {
        Data d = new Data(ctx);
        if (Build.VERSION.SDK_INT >= 31) {
            // Система сама выбирает раскладку при изменении размера (ключ — минимальный размер в dp)
            Map<SizeF, RemoteViews> map = new HashMap<>();
            map.put(new SizeF(40f, 40f), build(ctx, S, d));
            map.put(new SizeF(200f, 40f), build(ctx, W, d));
            map.put(new SizeF(200f, 120f), build(ctx, M, d));
            map.put(new SizeF(250f, 165f), build(ctx, L, d));
            mgr.updateAppWidget(id, new RemoteViews(map));
        } else {
            Bundle o = mgr.getAppWidgetOptions(id);
            int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 180);
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

    static RemoteViews build(Context ctx, int kind, Data d) {
        int layout = kind == S ? R.layout.bju_widget_s : kind == W ? R.layout.bju_widget_w : kind == M ? R.layout.bju_widget_m : R.layout.bju_widget;
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout);
        // фон: цвет карточки приложения (с оттенком акцента, если он включён) + тонкая рамка
        v.setInt(R.id.bju_w_bg, "setColorFilter", d.bg);
        v.setInt(R.id.bju_w_bg, "setImageAlpha", d.dark ? 0xF2 : 0xF7);
        v.setImageViewResource(R.id.bju_w_stroke, d.dark ? R.drawable.bju_widget_stroke_dark : R.drawable.bju_widget_stroke_light);

        for (int i = 0; i < 3; i++) {
            float e = d.eaten[i], g = d.goal[i];
            boolean over = g > 0 && e > g;
            v.setTextViewText(LBL[i], kind == W || kind == S ? SHORT[i] : labelFull(i));
            v.setTextColor(LBL[i], d.color[i]);
            String val = kind == L || kind == S ? round(e) + " / " + round(g) + " г" : round(e) + " / " + round(g);
            v.setTextViewText(VAL[i], val);
            v.setTextColor(VAL[i], over && i > 0 ? d.danger : d.tx);
            v.setProgressBar(BAR[i], 1000, g > 0 ? (int) Math.min(1000, Math.max(0, e) * 1000 / g) : 0, false);
            if (Build.VERSION.SDK_INT >= 31) {
                v.setColorStateList(BAR[i], "setProgressTintList", ColorStateList.valueOf(over && i > 0 ? d.danger : d.color[i]));
            }
            if (kind == M || kind == L) {
                v.setTextViewText(REST[i], g <= 0 ? "" : over ? "сверх " + round(e - g) : "ещё " + round(g - e));
                v.setTextColor(REST[i], over && i > 0 ? d.danger : d.mu);
            }
        }

        int left = d.kcalGoal - d.kcal;
        if (kind == M) {
            v.setTextViewText(R.id.bju_w_left, d.kcalGoal <= 0 ? "БЖУ" : left >= 0 ? "Осталось " + left + " ккал" : "Перебор " + (-left) + " ккал");
            v.setTextColor(R.id.bju_w_left, left < 0 ? d.danger : d.tx);
        }
        if (kind == L) {
            v.setTextViewText(R.id.bju_w_label, (left >= 0 ? "Осталось" : "Перебор") + " · съедено " + d.kcal + " из " + d.kcalGoal);
            v.setTextColor(R.id.bju_w_label, d.mu);
            v.setTextViewText(R.id.bju_w_left, d.kcalGoal <= 0 ? "—" : Math.abs(left) + " ккал");
            v.setTextColor(R.id.bju_w_left, left < 0 ? d.danger : d.tx);
            v.setProgressBar(R.id.bju_w_bar, 1000, d.kcalGoal > 0 ? Math.min(1000, Math.max(0, d.kcal) * 1000 / d.kcalGoal) : 0, false);
            if (Build.VERSION.SDK_INT >= 31) {
                v.setColorStateList(R.id.bju_w_bar, "setProgressTintList", ColorStateList.valueOf(left < 0 ? d.danger : d.accent));
            }
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        v.setOnClickPendingIntent(R.id.bju_w_root, PendingIntent.getActivity(ctx, 1, open, flags));
        if (kind != S) {
            v.setInt(R.id.bju_w_add_bg, "setColorFilter", d.accent);
            Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse("bju://add?m=auto"), ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            v.setOnClickPendingIntent(R.id.bju_w_add, PendingIntent.getActivity(ctx, 2, add, flags));
        }
        return v;
    }

    private static String labelFull(int i) {
        return i == 0 ? "Белки" : i == 1 ? "Жиры" : "Углеводы";
    }

    private static String round(float x) {
        return String.valueOf(Math.round(x));
    }
}
