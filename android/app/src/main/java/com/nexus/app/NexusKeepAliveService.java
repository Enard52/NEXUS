package com.nexus.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/**
 * NEXUS AI — Background Keep-Alive Service
 *
 * Keeps local LAN automations and device connectivity alive even when
 * the phone screen is locked or in battery saver mode.
 *
 * 100% free, runs completely on-device without any cloud dependency.
 * Yalnızca kullanıcı Ayarlar'dan "Arka Plan Otomasyonu"nu açınca başlar
 * (NexusKeepAlivePlugin); bildirim metinleri açılışta seçilen dile göre gelir.
 */
public class NexusKeepAliveService extends Service {

    public static final String CHANNEL_ID = "nexus_keepalive_channel";
    public static final int NOTIFICATION_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel("tr");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String lang = intent != null ? intent.getStringExtra("lang") : null;
        final boolean en = "en".equals(lang);
        if (lang != null) createNotificationChannel(lang);

        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(en ? "NEXUS Local Automation Engine" : "NEXUS Yerel Otomasyon Motoru")
                .setContentText(en ? "Devices are listening on your local network" : "Cihazlar yerel ağda dinleniyor")
                .setSmallIcon(R.drawable.ic_stat_nexus)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        startForeground(NOTIFICATION_ID, notification);
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel(String lang) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean en = "en".equals(lang);
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    en ? "NEXUS Background Service" : "NEXUS Arka Plan Servisi",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription(en
                    ? "Keeps local automations running without interruption in the background."
                    : "Yerel otomasyonların arka planda kesintisiz çalışmasını sağlar.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
