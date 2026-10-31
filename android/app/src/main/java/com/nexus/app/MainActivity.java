package com.nexus.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(NexusKeepAlivePlugin.class);
        registerPlugin(NexusWidgetPlugin.class);
        // Cihaz sırları için Keystore şifreleme köprüsü (window.NexusSecure); WebView yoksa sessizce atlanır.
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new NexusSecureStore(), "NexusSecure");
        }
    }
}
