package com.themidoriway.sovereign;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * A foreground media-playback service. While a Sovereign sound session plays,
 * it keeps the app in the foreground priority class, so Android doesn't
 * freeze or throttle it when the screen is off or another app is open. It
 * shows a media notification with Pause/Play and Stop, and a MediaSession so
 * lock-screen and headset buttons work. The audio itself is still generated
 * by the app's sound engine.
 */
public class SovereignAudioService extends Service {
    static SovereignAudioService current;

    static final String CHANNEL = "sovereign-playback";
    static final int NOTIFICATION_ID = 7301;
    static final String ACT_PLAY = "com.themidoriway.sovereign.audio.PLAY";
    static final String ACT_PAUSE = "com.themidoriway.sovereign.audio.PAUSE";
    static final String ACT_STOP = "com.themidoriway.sovereign.audio.STOP";

    private MediaSession session;
    private PowerManager.WakeLock wakeLock;
    private String title = "Sovereign";
    private String text = "";
    private boolean playing = true;

    @Override
    public void onCreate() {
        super.onCreate();
        current = this;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Sound sessions", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Keeps a Sovereign sound session playing in the background");
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        session = new MediaSession(this, "Sovereign");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { SovereignAudioPlugin.emit("play"); }
            @Override public void onPause() { SovereignAudioPlugin.emit("pause"); }
            @Override public void onStop() { SovereignAudioPlugin.emit("stop"); }
        });
        session.setActive(true);
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Sovereign:audio");
            wakeLock.setReferenceCounted(false);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACT_PLAY.equals(action)) {
            SovereignAudioPlugin.emit("play");
        } else if (ACT_PAUSE.equals(action)) {
            SovereignAudioPlugin.emit("pause");
        } else if (ACT_STOP.equals(action)) {
            SovereignAudioPlugin.emit("stop");
            show();
            stopSelf();
            return START_NOT_STICKY;
        } else if (intent != null) {
            if (intent.hasExtra("title")) title = intent.getStringExtra("title");
            if (intent.hasExtra("text")) text = intent.getStringExtra("text");
            playing = intent.getBooleanExtra("playing", true);
        }
        show();
        return START_NOT_STICKY;
    }

    void apply(String newTitle, String newText, boolean isPlaying) {
        title = newTitle;
        text = newText;
        playing = isPlaying;
        show();
    }

    private void show() {
        long actions = PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_STOP;
        session.setPlaybackState(new PlaybackState.Builder()
                .setActions(actions)
                .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                        PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f)
                .build());
        session.setMetadata(new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, text)
                .build());

        if (wakeLock != null) {
            if (playing) wakeLock.acquire(2L * 60 * 60 * 1000);
            else if (wakeLock.isHeld()) wakeLock.release();
        }

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = open != null ? PendingIntent.getActivity(this, 0, open, piFlags) : null;
        PendingIntent toggle = PendingIntent.getService(this, 1,
                new Intent(this, SovereignAudioService.class).setAction(playing ? ACT_PAUSE : ACT_PLAY), piFlags);
        PendingIntent stop = PendingIntent.getService(this, 2,
                new Intent(this, SovereignAudioService.class).setAction(ACT_STOP), piFlags);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL)
                : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_sovereign)
                .setContentTitle(title)
                .setContentText(text)
                .setOngoing(playing)
                .setShowWhen(false)
                .setOnlyAlertOnce(true)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setColor(0xFFC9A961)
                .setDeleteIntent(stop)
                .addAction(new Notification.Action.Builder(
                        playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        playing ? "Pause" : "Play", toggle).build())
                .addAction(new Notification.Action.Builder(
                        android.R.drawable.ic_menu_close_clear_cancel, "Stop", stop).build())
                .setStyle(new Notification.MediaStyle()
                        .setMediaSession(session.getSessionToken())
                        .setShowActionsInCompactView(0, 1));
        if (content != null) b.setContentIntent(content);
        Notification n = b.build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION_ID, n);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Swiping Sovereign away from recent apps ends the session.
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        current = null;
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (session != null) {
            session.setActive(false);
            session.release();
        }
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
