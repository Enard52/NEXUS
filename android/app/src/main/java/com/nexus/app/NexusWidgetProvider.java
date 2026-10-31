package com.nexus.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import java.text.DateFormat;
import java.util.Date;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.widget.RemoteViews;

/**
 * NEXUS — Ana ekran widget'ı.
 *
 * Gösterilen bilgi UYGULAMANIN SON KAYDETTİĞİ anlık görüntüdür (NexusWidgetPlugin.update): cihazlar widget'tan
 * canlı sorgulanmaz. Anlık görüntü yoksa (uygulama hiç açılmadı ya da cihaz eşlenmedi) uydurma veri gösterilmez;
 * "NEXUS'u aç" yazar. Dokunmak uygulamayı açar.
 */
public class NexusWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "nexus_widget";
    static final String KEY = "snapshot";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, build(context));
        }
    }

    /** Tüm widget örneklerini son anlık görüntüyle yeniler. */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, NexusWidgetProvider.class));
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.nexus_widget);
        String title = context.getString(R.string.widget_empty_title);
        String body = context.getString(R.string.widget_empty_body);
        String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
        if (raw != null) {
            try {
                JSONObject snap = new JSONObject(raw);
                JSONArray devices = snap.optJSONArray("devices");
                int total = devices == null ? 0 : devices.length();
                if (total > 0) {
                    int on = 0;
                    StringBuilder lines = new StringBuilder();
                    for (int i = 0; i < total; i++) {
                        JSONObject d = devices.optJSONObject(i);
                        if (d == null) continue;
                        boolean isOn = d.optBoolean("on", false);
                        if (isOn) on++;
                        if (i < 3) {
                            if (lines.length() > 0) lines.append('\n');
                            lines.append(isOn ? "● " : "○ ").append(d.optString("name", "?"));
                        }
                    }
                    title = context.getString(R.string.widget_title, on, total);
                    long ts = snap.optLong("ts", 0L);
                    String when = ts > 0
                        ? context.getString(R.string.widget_updated, DateFormat.getTimeInstance(DateFormat.SHORT).format(new Date(ts)))
                        : "";
                    body = lines + (when.isEmpty() ? "" : "\n" + when);
                }
            } catch (JSONException ignored) {
                // Bozuk kayıt: boş duruma düşer, uydurma değer gösterilmez.
            }
        }
        views.setTextViewText(R.id.nexus_widget_title, title);
        views.setTextViewText(R.id.nexus_widget_body, body);
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            PendingIntent pi = PendingIntent.getActivity(
                context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.nexus_widget_root, pi);
        }
        return views;
    }
}
