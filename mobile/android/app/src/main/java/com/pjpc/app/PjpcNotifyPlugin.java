package com.pjpc.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.util.concurrent.TimeUnit;

/**
 * PJPC 通知插件。
 *
 * 不接 Firebase（不用 Google 账号、不花钱）：换成
 *   ① App 在前台时网页自己轮询，有新通知就调 show() 弹一条；
 *   ② 靠 WorkManager 每 15 分钟在后台拉一次 /api/notifications，有新的就弹。
 * 代价是最坏延迟 15 分钟；要秒级才需要 FCM 或常驻服务。
 *
 * 登录成功后网页把 PocketBase token 交给这里存进 SharedPreferences，
 * 后台拉取就用它当 Authorization —— 不存密码，退出登录要调 clear()。
 */
@CapacitorPlugin(
        name = "PjpcNotify",
        permissions = {
                @Permission(alias = "notifications", strings = { "android.permission.POST_NOTIFICATIONS" })
        }
)
public class PjpcNotifyPlugin extends Plugin {

    static final String PREFS = "pjpc_notify";
    static final String KEY_TOKEN = "token";
    static final String KEY_SEEN = "seen_ids";
    static final String CHANNEL_ID = "pjpc_default";
    static final String API = "https://pjpcapp.com/api/notifications?limit=5";

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "PJPC 通知", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("待办、批改、费用到期等提醒");
        nm.createNotificationChannel(ch);
    }

    /** 供插件和 Worker 共用 */
    static void showNotification(Context ctx, String title, String body, String link, int id) {
        ensureChannel(ctx);
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(
                link != null && !link.isEmpty()
                        ? (link.startsWith("http") ? link : "https://pjpcapp.com" + link)
                        : "https://pjpcapp.com"));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(ctx, id, intent, flags);

        Notification n = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title == null || title.isEmpty() ? "PJPC" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body == null ? "" : body))
                .setAutoCancel(true)
                .setContentIntent(pi)
                // 锁屏上不显示正文：这台手机躺着的时候别人也能看见
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .build();

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(id, n);
    }

    @PluginMethod
    public void permission(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < 33
                || ContextCompat.checkSelfPermission(getContext(), "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33
                && ContextCompat.checkSelfPermission(getContext(), "android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("notifications", call, "onPermissionResult");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("granted", true);
        call.resolve(ret);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void onPermissionResult(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", Build.VERSION.SDK_INT < 33
                || ContextCompat.checkSelfPermission(getContext(), "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED);
        call.resolve(ret);
    }

    /** 网页登录后把 PocketBase token 交过来，后台才拉得到通知 */
    @PluginMethod
    public void setToken(PluginCall call) {
        String token = call.getString("token", "");
        SharedPreferences sp = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (token == null || token.isEmpty()) {
            sp.edit().remove(KEY_TOKEN).apply();
            call.resolve();
            return;
        }
        sp.edit().putString(KEY_TOKEN, token).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        SharedPreferences sp = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().remove(KEY_TOKEN).remove(KEY_SEEN).apply();
        WorkManager.getInstance(getContext()).cancelUniqueWork("pjpc-notify-poll");
        call.resolve();
    }

    /** 立刻弹一条（网页前台用） */
    @PluginMethod
    public void show(PluginCall call) {
        String title = call.getString("title", "PJPC");
        String body = call.getString("body", "");
        String link = call.getString("link", "");
        int id = call.getInt("id", (int) (System.currentTimeMillis() % 100000));
        new Handler(Looper.getMainLooper()).post(() -> showNotification(getContext(), title, body, link, id));
        call.resolve();
    }

    /** 打开后台轮询（15 分钟一次，安卓系统的最短周期） */
    @PluginMethod
    public void enableBackground(PluginCall call) {
        SharedPreferences sp = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (sp.getString(KEY_TOKEN, "").isEmpty()) {
            call.reject("还没登录，没有 token");
            return;
        }
        Constraints c = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(PjpcNotifyWorker.class, 15, TimeUnit.MINUTES)
                .setConstraints(c)
                .build();
        WorkManager.getInstance(getContext())
                .enqueueUniquePeriodicWork("pjpc-notify-poll", ExistingPeriodicWorkPolicy.UPDATE, req);
        call.resolve();
    }

    @PluginMethod
    public void disableBackground(PluginCall call) {
        WorkManager.getInstance(getContext()).cancelUniqueWork("pjpc-notify-poll");
        call.resolve();
    }
}
