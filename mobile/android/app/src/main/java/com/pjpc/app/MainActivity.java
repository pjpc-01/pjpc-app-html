package com.pjpc.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 自建原生插件：NFC 读卡 + 通知（不接 Firebase，用 WorkManager 轮询）
        registerPlugin(PjpcNfcPlugin.class);
        registerPlugin(PjpcNotifyPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
