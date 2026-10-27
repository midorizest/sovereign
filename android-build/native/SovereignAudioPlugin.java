package com.themidoriway.sovereign;

import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges Sovereign's sound sessions to Android. The app calls start() when a
 * session plays, update() when it pauses or resumes, and stop() when it ends.
 * Buttons on the media notification, lock screen and headset come back to
 * the app as "action" events: play, pause or stop.
 */
@CapacitorPlugin(name = "SovereignAudio")
public class SovereignAudioPlugin extends Plugin {
    static SovereignAudioPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    static void emit(String action) {
        SovereignAudioPlugin p = instance;
        if (p == null) return;
        JSObject data = new JSObject();
        data.put("action", action);
        p.notifyListeners("action", data, true);
    }

    @PluginMethod
    public void start(PluginCall call) {
        String title = call.getString("title", "Sovereign");
        String text = call.getString("text", "");
        boolean playing = !Boolean.FALSE.equals(call.getBoolean("playing", true));
        SovereignAudioService svc = SovereignAudioService.current;
        if (svc != null) {
            svc.apply(title, text, playing);
            call.resolve();
            return;
        }
        Context ctx = getContext();
        Intent i = new Intent(ctx, SovereignAudioService.class);
        i.putExtra("title", title);
        i.putExtra("text", text);
        i.putExtra("playing", playing);
        try {
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
            else ctx.startService(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Background audio could not start: " + e.getMessage());
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        SovereignAudioService svc = SovereignAudioService.current;
        if (svc != null) {
            svc.apply(call.getString("title", "Sovereign"), call.getString("text", ""),
                    !Boolean.FALSE.equals(call.getBoolean("playing", true)));
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        ctx.stopService(new Intent(ctx, SovereignAudioService.class));
        call.resolve();
    }
}
