package com.nexus.app;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * NEXUS — Arka plan servisi köprüsü.
 *
 * Ayarlardan "Arka Plan Otomasyonu" açıldığında web katmanı start() çağırır;
 * NexusKeepAliveService ön plan bildirimiyle yerel otomasyonları uyurken de çalıştırır.
 * Kullanıcı kapatınca stop() servisi durdurur. Varsayılan kapalıdır (pil tercihi kullanıcıda).
 */
@CapacitorPlugin(name = "NexusKeepAlive")
public class NexusKeepAlivePlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String lang = call.getString("lang", "tr");
        set(lang == null ? "tr" : lang, true, call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        set("tr", false, call);
    }

    private void set(String lang, boolean on, PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), NexusKeepAliveService.class);
            intent.putExtra("lang", lang);
            if (on) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(intent);
                } else {
                    getContext().startService(intent);
                }
            } else {
                getContext().stopService(intent);
            }
            JSObject ret = new JSObject();
            ret.put("running", on);
            call.resolve(ret);
        } catch (Exception e) {
            // Android 12+ ön plan servisi kısıtı: yalnız uygulama ön plandayken
            // başlatılabilir; WebView'den çağrıldığı için normalde tetiklenmez.
            call.reject("keepalive_failed", e.getMessage());
        }
    }
}
