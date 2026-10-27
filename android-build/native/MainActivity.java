package com.themidoriway.sovereign;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SovereignAudioPlugin.class);
        super.onCreate(savedInstanceState);
        // Keep the web view's renderer at full priority even when Sovereign
        // isn't on screen, so a sound session isn't cut off in the background.
        if (Build.VERSION.SDK_INT >= 26 && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }
    }
}
