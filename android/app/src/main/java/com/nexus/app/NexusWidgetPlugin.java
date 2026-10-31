package com.nexus.app;

import android.content.Context;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * NEXUS — Ana ekran widget'ı köprüsü. Web katmanı, uygulamanın bildiği gerçek cihaz durumunu
 * (ad + açık/kapalı) buraya yazar; widget yalnızca bu son anlık görüntüyü gösterir (NexusWidgetProvider).
 * Veri uydurulmaz: yazılmadıysa widget "NEXUS'u aç" der. clear() anlık görüntüyü siler (ör. çıkış yapınca).
 */
@CapacitorPlugin(name = "NexusWidget")
public class NexusWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        try {
            JSArray devices = call.getArray("devices");
            JSObject snap = new JSObject();
            snap.put("devices", devices == null ? new JSArray() : devices);
            snap.put("ts", System.currentTimeMillis());
            getContext()
                .getSharedPreferences(NexusWidgetProvider.PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(NexusWidgetProvider.KEY, snap.toString())
                .apply();
            NexusWidgetProvider.refreshAll(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("widget_update_failed", e.getMessage());
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getContext()
            .getSharedPreferences(NexusWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(NexusWidgetProvider.KEY)
            .apply();
        NexusWidgetProvider.refreshAll(getContext());
        call.resolve();
    }
}
