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
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Виджет рабочего стола: остаток калорий на сегодня и кнопка «+» (добавить в текущий приём пищи).
 * Данные пишет приложение (BjuNativePlugin.updateWidget) в SharedPreferences.
 * Если сохранённые данные не за сегодня (наступил новый день), виджет показывает пустой день.
 */
public class BjuWidget extends AppWidgetProvider {

    static final String PREFS = "bju_widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        render(ctx, mgr, ids);
    }

    static void renderAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, BjuWidget.class));
        if (ids != null && ids.length > 0) render(ctx, mgr, ids);
    }

    static void render(Context ctx, AppWidgetManager mgr, int[] ids) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        boolean fresh = today.equals(p.getString("date", ""));
        int goal = p.getInt("goal", 0);
        int eaten = fresh ? p.getInt("eaten", 0) : 0;
        String macros = fresh ? p.getString("macros", "") : "Сегодня записей пока нет";
        boolean dark = p.getBoolean("dark", true);
        int accent = p.getInt("accent", 0xFF22A565);
        int danger = 0xFFEF6B6B;
        int tx = dark ? 0xFFEEF1F5 : 0xFF161A22;
        int mu = dark ? 0xFF8F98A8 : 0xFF6A7282;
        int left = goal - eaten;

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent piOpen = PendingIntent.getActivity(ctx, 1, open, flags);
        Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse("bju://add?m=auto"), ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent piAdd = PendingIntent.getActivity(ctx, 2, add, flags);

        for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.bju_widget);
            v.setInt(R.id.bju_w_root, "setBackgroundResource", dark ? R.drawable.bju_widget_bg_dark : R.drawable.bju_widget_bg_light);
            if (goal <= 0) {
                v.setTextViewText(R.id.bju_w_label, "БЖУ");
                v.setTextViewText(R.id.bju_w_left, "—");
                v.setTextViewText(R.id.bju_w_sub, "Откройте приложение");
            } else {
                v.setTextViewText(R.id.bju_w_label, left >= 0 ? "Осталось сегодня" : "Перебор сегодня");
                v.setTextViewText(R.id.bju_w_left, Math.abs(left) + " ккал");
                v.setTextViewText(R.id.bju_w_sub, "Съедено " + eaten + " из " + goal + " ккал");
            }
            v.setTextColor(R.id.bju_w_label, mu);
            v.setTextColor(R.id.bju_w_left, left < 0 ? danger : tx);
            v.setTextColor(R.id.bju_w_sub, mu);
            v.setTextViewText(R.id.bju_w_macros, macros);
            v.setTextColor(R.id.bju_w_macros, mu);
            v.setProgressBar(R.id.bju_w_bar, 1000, goal > 0 ? Math.min(1000, Math.max(0, eaten) * 1000 / goal) : 0, false);
            if (Build.VERSION.SDK_INT >= 31) {
                v.setColorStateList(R.id.bju_w_bar, "setProgressTintList", ColorStateList.valueOf(left < 0 ? danger : accent));
            }
            v.setInt(R.id.bju_w_add_bg, "setColorFilter", accent);
            v.setOnClickPendingIntent(R.id.bju_w_root, piOpen);
            v.setOnClickPendingIntent(R.id.bju_w_add, piAdd);
            mgr.updateAppWidget(id, v);
        }
    }
}
