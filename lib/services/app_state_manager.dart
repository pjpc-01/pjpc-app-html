import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 应用状态管理服务 - 防止NFC扫描时应用重启
class AppStateManager {
  static final AppStateManager _instance = AppStateManager._internal();
  factory AppStateManager() => _instance;
  AppStateManager._internal();
  
  static AppStateManager get instance => _instance;
  
  bool _isNfcOperationActive = false;
  bool _isAppInBackground = false;
  Timer? _keepAliveTimer;
  
  /// 开始NFC操作
  void startNfcOperation() {
    _isNfcOperationActive = true;
    _preventAppBackgrounding();
  }
  
  /// 结束NFC操作
  void endNfcOperation() {
    _isNfcOperationActive = false;
    _stopPreventingBackgrounding();
  }
  
  /// 防止应用进入后台
  void _preventAppBackgrounding() {
    // 不要改变系统UI模式，这可能导致问题
    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    // 启动保活定时器
    _keepAliveTimer?.cancel();
    _keepAliveTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_isNfcOperationActive) {
        // 发送保活信号
        _sendKeepAliveSignal();
      } else {
        timer.cancel();
      }
    });
  }
  
  /// 停止防止后台化
  void _stopPreventingBackgrounding() {
    _keepAliveTimer?.cancel();
    _keepAliveTimer = null;
    
    // 不要改变系统UI模式
    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  }
  
  /// 发送保活信号
  void _sendKeepAliveSignal() {
    // 这里可以添加保活逻辑
    // 例如：发送心跳包、更新UI等
  }
  
  /// 检查是否在NFC操作中
  bool get isNfcOperationActive => _isNfcOperationActive;
  
  /// 清理资源
  void dispose() {
    _keepAliveTimer?.cancel();
    _isNfcOperationActive = false;
  }
}

/// NFC扫描状态管理Widget
class NFCScanStateManager extends StatefulWidget {
  final Widget child;
  final VoidCallback? onScanStart;
  final VoidCallback? onScanEnd;
  
  const NFCScanStateManager({
    super.key,
    required this.child,
    this.onScanStart,
    this.onScanEnd,
  });
  
  @override
  State<NFCScanStateManager> createState() => _NFCScanStateManagerState();
}

class _NFCScanStateManagerState extends State<NFCScanStateManager>
    with WidgetsBindingObserver {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    switch (state) {
      case AppLifecycleState.resumed:
        break;
      case AppLifecycleState.paused:
        if (AppStateManager.instance.isNfcOperationActive) {
          // 可以在这里添加特殊处理
        }
        break;
      case AppLifecycleState.detached:
        break;
      case AppLifecycleState.inactive:
        break;
      case AppLifecycleState.hidden:
        break;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

/// NFC操作包装器
class NFCOperationWrapper {
  static Future<T> execute<T>(
    Future<T> Function() operation, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    try {
      // 开始NFC操作
      AppStateManager.instance.startNfcOperation();
      
      // 执行操作
      final result = await operation().timeout(timeout);
      
      return result;
    } finally {
      // 结束NFC操作
      AppStateManager.instance.endNfcOperation();
    }
  }
}
