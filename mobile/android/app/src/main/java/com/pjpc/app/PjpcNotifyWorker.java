package com.pjpc.app;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

/**
 * 后台拉通知（15 分钟一次）。
 *
 * 不接 Firebase 的代价就在这里：靠系统调度，最坏延迟 15 分钟。
 * 拉 /api/notifications，拿未读的、没弹过的，逐条弹系统通知；已弹过的 id 存进 SharedPreferences。
 */
public class PjpcNotifyWorker extends Worker {

    public PjpcNotifyWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        SharedPreferences sp = getApplicationContext().getSharedPreferences(PjpcNotifyPlugin.PREFS, Context.MODE_PRIVATE);
        String token = sp.getString(PjpcNotifyPlugin.KEY_TOKEN, "");
        if (token == null || token.isEmpty()) return Result.success();

        try {
            URL url = new URL(PjpcNotifyPlugin.API);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", token);
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);

            int code = conn.getResponseCode();
            if (code != 200) {
                conn.disconnect();
                // token 过期（401）：别一直白跑，等网页下次登录再交新 token
                return code == 401 ? Result.success() : Result.retry();
            }

            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
            }
            conn.disconnect();

            JSONObject root = new JSONObject(sb.toString());
            JSONArray items = root.optJSONArray("items");
            if (items == null) return Result.success();

            Set<String> seen = new HashSet<>(sp.getStringSet(PjpcNotifyPlugin.KEY_SEEN, new HashSet<>()));
            Set<String> fresh = new HashSet<>(seen);
            int shown = 0;

            for (int i = 0; i < items.length(); i++) {
                JSONObject it = items.optJSONObject(i);
                if (it == null) continue;
                String id = it.optString("id", "");
                boolean read = it.optBoolean("read", false);
                if (id.isEmpty() || read || seen.contains(id)) continue;

                PjpcNotifyPlugin.showNotification(
                        getApplicationContext(),
                        it.optString("title", "PJPC"),
                        it.optString("body", ""),
                        it.optString("link", ""),
                        Math.abs(id.hashCode())
                );
                fresh.add(id);
                shown++;
                if (shown >= 5) break; // 一次最多弹 5 条，别刷屏
            }

            // 只留最近 200 个 id，避免无限长大
            if (fresh.size() > 200) {
                Set<String> trimmed = new HashSet<>();
                int skip = fresh.size() - 200;
                for (String s : fresh) {
                    if (skip-- > 0) continue;
                    trimmed.add(s);
                }
                fresh = trimmed;
            }
            sp.edit().putStringSet(PjpcNotifyPlugin.KEY_SEEN, fresh).apply();
            return Result.success();
        } catch (Exception e) {
            return Result.retry();
        }
    }
}
