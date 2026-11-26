package com.pjpc.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * App 内更新：下载 APK → 校验签名是不是我们自己签的 → 直接弹系统安装界面。
 *
 * 用户只需要点一次「安装」，不用去浏览器下载、也不用自己去文件管理器找。
 * 安卓不允许完全静默安装（除非是企业 MDM 设备），这一次点击省不掉。
 *
 * 签名校验很重要：万一下载地址被人换成了别的包，安装前就拦下来 ——
 * 不然装上一个签了别人证书的同名 App，等于把整个系统交出去。
 */
@CapacitorPlugin(name = "PjpcUpdater")
public class PjpcUpdaterPlugin extends Plugin {

    // 我们自己的签名证书 SHA-256（小写、无冒号）
    private static final String EXPECTED_CERT_SHA256 =
            "1ffb4200be3d93fa3895b2f3c47f54313d61cec07e909a75b842a8247e675513";

    private final ExecutorService pool = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        boolean allowed = Build.VERSION.SDK_INT < 26
                || getContext().getPackageManager().canRequestPackageInstalls();
        ret.put("allowed", allowed);
        call.resolve(ret);
    }

    /** 打开「允许安装未知应用」的系统开关页 */
    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= 26) {
                i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
            } else {
                i = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("打不开设置：" + e.getMessage());
        }
    }

    @PluginMethod
    public void install(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || url.isEmpty()) {
            call.reject("没有下载地址");
            return;
        }

        if (Build.VERSION.SDK_INT >= 26
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
            call.reject("需要先允许本应用安装应用");
            return;
        }

        final Context ctx = getContext();
        final PluginCall pending = call;

        pool.execute(() -> {
            File apk = new File(ctx.getCacheDir(), "pjpc-update.apk");
            try {
                download(url, apk, pending);

                String got = certSha256(ctx, apk);
                if (!EXPECTED_CERT_SHA256.equalsIgnoreCase(got)) {
                    apk.delete();
                    pending.reject("下载到的安装包签名不对，已拦下，没有安装");
                    return;
                }

                Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", apk);
                Intent i = new Intent(Intent.ACTION_VIEW)
                        .setDataAndType(uri, "application/vnd.android.package-archive")
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                ctx.startActivity(i);

                JSObject ret = new JSObject();
                ret.put("started", true);
                ret.put("path", apk.getAbsolutePath());
                pending.resolve(ret);
            } catch (Exception e) {
                pending.reject("更新失败：" + e.getMessage());
            }
        });
    }

    private void download(String url, File out, PluginCall call) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setInstanceFollowRedirects(true);
        conn.setConnectTimeout(20000);
        conn.setReadTimeout(30000);
        conn.connect();

        int code = conn.getResponseCode();
        if (code < 200 || code >= 300) {
            conn.disconnect();
            throw new Exception("下载失败 HTTP " + code);
        }

        int total = conn.getContentLength();
        try (InputStream in = conn.getInputStream(); FileOutputStream fos = new FileOutputStream(out)) {
            byte[] buf = new byte[64 * 1024];
            long done = 0;
            int lastPct = -1;
            int n;
            while ((n = in.read(buf)) > 0) {
                fos.write(buf, 0, n);
                done += n;
                if (total > 0) {
                    int pct = (int) (done * 100 / total);
                    if (pct != lastPct) {
                        lastPct = pct;
                        JSObject p = new JSObject();
                        p.put("percent", pct);
                        notifyListeners("progress", p);
                    }
                }
            }
        } finally {
            conn.disconnect();
        }
    }

    /** 读 APK 文件的签名证书指纹（跟已安装 App 的签名比，判断是不是我们自己签的） */
    private static String certSha256(Context ctx, File apk) throws Exception {
        PackageManager pm = ctx.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28
                ? PackageManager.GET_SIGNING_CERTIFICATES
                : PackageManager.GET_SIGNATURES;
        PackageInfo info = pm.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (info == null) throw new Exception("安装包读不出来");

        Signature[] sigs;
        if (Build.VERSION.SDK_INT >= 28) {
            sigs = info.signingInfo == null ? new Signature[0] : info.signingInfo.getApkContentsSigners();
        } else {
            sigs = info.signatures == null ? new Signature[0] : info.signatures;
        }
        if (sigs.length == 0) throw new Exception("安装包没有签名");

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(sigs[0].toByteArray());
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
