package com.pjpc.app;

import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * PJPC 原生 NFC 读卡插件。
 *
 * 为什么自己写而不用现成插件：系统里认的是卡片 UID（nfc_cards.card_uid），
 * Android 的 Reader Mode 直接给 UID，比 Web NFC 的 NDEF 更可靠（很多卡根本没有 NDEF 记录），
 * 而且 WebView 里没有 NDEFReader，浏览器那套在 App 里根本跑不起来。
 *
 * 网页侧：window.Capacitor.Plugins.PjpcNfc.start() 之后监听 'nfcTag' 事件拿 uid。
 */
@CapacitorPlugin(name = "PjpcNfc")
public class PjpcNfcPlugin extends Plugin {

    private NfcAdapter adapter;
    private boolean reading = false;

    @Override
    public void load() {
        adapter = NfcAdapter.getDefaultAdapter(getContext());
    }

    private static String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hardware = adapter != null;
        boolean enabled = hardware && adapter.isEnabled();
        ret.put("available", enabled);
        ret.put("hardware", hardware);
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (adapter == null) {
            call.reject("这台设备没有 NFC");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("NFC 没打开，请到系统设置里打开 NFC");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (reading) {
                call.resolve();
                return;
            }
            try {
                Bundle opts = new Bundle();
                opts.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250);
                adapter.enableReaderMode(
                        getActivity(),
                        (Tag tag) -> {
                            JSObject ev = new JSObject();
                            ev.put("uid", hex(tag.getId()));
                            ev.put("at", System.currentTimeMillis());
                            notifyListeners("nfcTag", ev);
                        },
                        NfcAdapter.FLAG_READER_NFC_A
                                | NfcAdapter.FLAG_READER_NFC_B
                                | NfcAdapter.FLAG_READER_NFC_F
                                | NfcAdapter.FLAG_READER_NFC_V
                                | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
                                | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
                        opts
                );
                reading = true;
                call.resolve();
            } catch (Exception e) {
                call.reject("开启 NFC 失败：" + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (adapter != null && reading) {
                try {
                    adapter.disableReaderMode(getActivity());
                } catch (Exception ignored) {
                }
            }
            reading = false;
            call.resolve();
        });
    }

    /** 页面切走 / App 进后台时一定要关掉，否则 NFC 一直占着 */
    @Override
    protected void handleOnPause() {
        if (adapter != null && reading) {
            getActivity().runOnUiThread(() -> {
                try {
                    adapter.disableReaderMode(getActivity());
                } catch (Exception ignored) {
                }
                reading = false;
            });
        }
        super.handleOnPause();
    }
}
