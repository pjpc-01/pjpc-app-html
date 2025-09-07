import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class NetworkService extends ChangeNotifier {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();
  
  static NetworkService get instance => _instance;
  
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  
  bool _isConnected = true;
  List<ConnectivityResult> _connectionStatus = [ConnectivityResult.wifi];
  DateTime? _lastConnectionCheck;
  
  // Getters
  bool get isConnected => _isConnected;
  List<ConnectivityResult> get connectionStatus => _connectionStatus;
  DateTime? get lastConnectionCheck => _lastConnectionCheck;
  
  /// 开始监听网络状态
  void startListening() {
    _subscription = _connectivity.onConnectivityChanged.listen(
      _updateConnectionStatus,
      onError: (error) {
        print('❌ 网络状态监听错误: $error');
      },
    );
    print('✅ 网络状态监听已启动');
  }
  
  /// 停止监听网络状态
  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    print('✅ 网络状态监听已停止');
  }
  
  /// 更新连接状态
  void _updateConnectionStatus(List<ConnectivityResult> result) {
    _connectionStatus = result;
    _lastConnectionCheck = DateTime.now();
    
    final wasConnected = _isConnected;
    _isConnected = result.any((status) => 
      status == ConnectivityResult.mobile || 
      status == ConnectivityResult.wifi ||
      status == ConnectivityResult.ethernet
    );
    
    // 如果连接状态发生变化，通知监听者
    if (wasConnected != _isConnected) {
      notifyListeners();
      
      if (_isConnected) {
        print('✅ 网络已连接: ${_getConnectionTypeString()}');
        _onConnectionRestored();
      } else {
        print('❌ 网络已断开');
        _onConnectionLost();
      }
    }
  }
  
  /// 手动检查网络连接
  Future<bool> checkConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _updateConnectionStatus(result);
      return _isConnected;
    } catch (e) {
      print('❌ 检查网络连接失败: $e');
      return false;
    }
  }
  
  /// 获取连接类型字符串
  String _getConnectionTypeString() {
    if (_connectionStatus.contains(ConnectivityResult.wifi)) {
      return 'WiFi';
    } else if (_connectionStatus.contains(ConnectivityResult.mobile)) {
      return '移动数据';
    } else if (_connectionStatus.contains(ConnectivityResult.ethernet)) {
      return '以太网';
    } else {
      return '未知';
    }
  }
  
  /// 获取连接类型
  String get connectionType => _getConnectionTypeString();
  
  /// 网络连接恢复时的回调
  void _onConnectionRestored() {
    // 可以在这里触发数据刷新等操作
    // 例如：通知所有Provider刷新数据
  }
  
  /// 网络连接丢失时的回调
  void _onConnectionLost() {
    // 可以在这里显示离线提示等操作
  }
  
  /// 等待网络连接
  Future<void> waitForConnection({Duration timeout = const Duration(seconds: 30)}) async {
    if (_isConnected) return;
    
    final completer = Completer<void>();
    late StreamSubscription subscription;
    
    subscription = _connectivity.onConnectivityChanged.listen((result) {
      if (result.any((status) => 
        status == ConnectivityResult.mobile || 
        status == ConnectivityResult.wifi ||
        status == ConnectivityResult.ethernet
      )) {
        subscription.cancel();
        completer.complete();
      }
    });
    
    // 设置超时
    Timer(timeout, () {
      if (!completer.isCompleted) {
        subscription.cancel();
        completer.completeError(TimeoutException('等待网络连接超时', timeout));
      }
    });
    
    return completer.future;
  }
  
  /// 检查是否为WiFi连接
  bool get isWiFi => _connectionStatus.contains(ConnectivityResult.wifi);
  
  /// 检查是否为移动数据连接
  bool get isMobile => _connectionStatus.contains(ConnectivityResult.mobile);
  
  /// 检查是否为以太网连接
  bool get isEthernet => _connectionStatus.contains(ConnectivityResult.ethernet);
  
  /// 获取网络质量（基于连接类型）
  String get networkQuality {
    if (isWiFi) return '优秀';
    if (isEthernet) return '优秀';
    if (isMobile) return '良好';
    return '未知';
  }
  
  @override
  void dispose() {
    stopListening();
    super.dispose();
  }
}

/// 网络状态Widget
class NetworkStatusWidget extends StatelessWidget {
  final Widget child;
  final Widget? offlineWidget;
  
  const NetworkStatusWidget({
    super.key,
    required this.child,
    this.offlineWidget,
  });
  
  @override
  Widget build(BuildContext context) {
    return Consumer<NetworkService>(
      builder: (context, networkService, child) {
        if (!networkService.isConnected) {
          return offlineWidget ?? _buildOfflineWidget(context);
        }
        return this.child;
      },
    );
  }
  
  Widget _buildOfflineWidget(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              '网络连接已断开',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '请检查网络设置后重试',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () async {
                await NetworkService.instance.checkConnection();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }
}
