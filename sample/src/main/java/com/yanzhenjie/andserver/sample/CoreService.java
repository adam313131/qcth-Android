/*
 * Copyright © 2018 Zhenjie Yan.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.yanzhenjie.andserver.sample;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.yanzhenjie.andserver.AndServer;
import com.yanzhenjie.andserver.Server;
import com.yanzhenjie.andserver.sample.util.NetUtils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.util.concurrent.TimeUnit;

/**
 * Created by Zhenjie Yan on 2018/6/9.
 */
public class CoreService extends Service {

    private static final String CHANNEL_ID = "server_channel";
    private static final int NOTIFICATION_ID = 1;

    private Server mServer;

    @Override
    public void onCreate() {
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, createNotification());
        startServer();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopServer();
        super.onDestroy();
    }

    private void startServer() {
        if (mServer != null && mServer.isRunning()) {
            notifyServerStart(); // Server is already running, just notify the UI.
            return;
        }

        try {
            mServer = AndServer.webServer(this)
                .inetAddress(InetAddress.getByName("0.0.0.0"))
                .port(0) // 0 means auto-assign a port.
                .timeout(10, TimeUnit.SECONDS)
                .listener(new Server.ServerListener() {
                    @Override
                    public void onStarted() {
                        notifyServerStart(); // Notify when newly started.
                    }

                    @Override
                    public void onStopped() {
                        ServerManager.onServerStop(CoreService.this);
                    }

                    @Override
                    public void onException(Exception e) {
                        e.printStackTrace();
                        ServerManager.onServerError(CoreService.this, e.getMessage());
                    }
                })
                .build();
            mServer.startup();
        } catch (Exception e) {
            e.printStackTrace();
            ServerManager.onServerError(this, "Server startup failed: " + e.getMessage());
        }
    }

    private void notifyServerStart() {
        if (mServer == null || !mServer.isRunning()) {
            return;
        }
        final int port = mServer.getPort();
        new Thread(() -> {
            String publicIp = getPublicIP();
            InetAddress localAddress = NetUtils.getLocalIPAddress();
            String localIp = (localAddress == null) ? "127.0.0.1" : localAddress.getHostAddress();
            boolean isPublicIPv6 = publicIp != null && publicIp.contains(":");
            ServerManager.onServerStart(CoreService.this, localIp, publicIp, isPublicIPv6, port);
        }).start();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "提后二22";
            String description = "你要逃避青年人的私欲，同那清心呼求主的人，竭力追求公义、信、爱、和平。";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("提后二22")
            .setContentText("你要逃避青年人的私欲，同那清心呼求主的人，竭力追求公义、信、爱、和平。")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .build();
    }

    private void stopServer() {
        if (mServer != null) {
            mServer.shutdown();
        }
    }

    private String getPublicIP() {
        try {
            URL url = new URL("https://api64.ipify.org");
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setConnectTimeout(5000);
            urlConnection.setReadTimeout(5000);
            try (BufferedReader in = new BufferedReader(new InputStreamReader(urlConnection.getInputStream()))) {
                return in.readLine();
            } finally {
                urlConnection.disconnect();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}