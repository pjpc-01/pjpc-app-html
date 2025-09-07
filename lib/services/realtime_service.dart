import 'dart:async';
import 'package:pocketbase/pocketbase.dart';
import 'package:flutter/material.dart';
import 'pocketbase_service.dart';

class RealtimeService extends ChangeNotifier {
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;
  RealtimeService._internal();
  
  static RealtimeService get instance => _instance;
  
  final Map<String, StreamSubscription> _subscriptions = {};
  final Map<String, List<Function(Map<String, dynamic>)>> _listeners = {};
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  Timer? _reconnectTimer;
  
  // Getters
  bool get isConnected => _isConnected;
  List<String> get subscribedCollections => _subscriptions.keys.toList();
  
  /// 订阅集合的实时更新
  void subscribeToCollection(
    String collection, 
    Function(Map<String, dynamic>) onUpdate, {
    String? filter,
    bool autoReconnect = true,
  }) {
    try {
      // 添加监听器
      _listeners[collection] ??= [];
      _listeners[collection]!.add(onUpdate);
      
      // 如果已经订阅，直接返回
      if (_subscriptions.containsKey(collection)) {
        print('✅ 集合 $collection 已订阅，添加监听器');
        return;
      }
      
      // 创建订阅
      _createSubscription(collection);
      
    } catch (e) {
      print('❌ 订阅集合 $collection 失败: $e');
      _handleSubscriptionError(collection, e, autoReconnect);
    }
  }
  
  /// 创建订阅
  void _createSubscription(String collection) async {
    try {
      final subscription = await PocketBaseService.instance.pb
          .collection(collection)
          .subscribe('*', (e) {
        _handleRealtimeUpdate(collection, e);
      });
      
      _subscriptions[collection] = subscription as StreamSubscription;
      _isConnected = true;
      _reconnectAttempts = 0;
      
      print('✅ 已订阅集合: $collection');
      notifyListeners();
    } catch (e) {
      print('❌ 创建订阅失败: $e');
    }
  }
  
  /// 取消订阅集合
  void unsubscribeFromCollection(String collection) {
    try {
      // 取消订阅
      _subscriptions[collection]?.cancel();
      _subscriptions.remove(collection);
      
      // 清除监听器
      _listeners.remove(collection);
      
      print('✅ 已取消订阅集合: $collection');
      notifyListeners();
      
    } catch (e) {
      print('❌ 取消订阅集合 $collection 失败: $e');
    }
  }
  
  /// 取消所有订阅
  void unsubscribeAll() {
    try {
      for (final subscription in _subscriptions.values) {
        subscription.cancel();
      }
      _subscriptions.clear();
      _listeners.clear();
      _isConnected = false;
      
      print('✅ 已取消所有订阅');
      notifyListeners();
      
    } catch (e) {
      print('❌ 取消所有订阅失败: $e');
    }
  }
  
  /// 处理实时更新
  void _handleRealtimeUpdate(String collection, dynamic e) {
    try {
      final listeners = _listeners[collection];
      if (listeners != null) {
        for (final listener in listeners) {
          listener(e.record?.data ?? {});
        }
      }
      
      print('📡 收到 $collection 实时更新: ${e.action ?? 'unknown'}');
      
    } catch (e) {
      print('❌ 处理实时更新失败: $e');
    }
  }
  
  /// 处理订阅错误
  void _handleSubscriptionError(String collection, dynamic error, bool autoReconnect) {
    _isConnected = false;
    notifyListeners();
    
    if (autoReconnect && _reconnectAttempts < _maxReconnectAttempts) {
      _scheduleReconnect(collection);
    } else {
      print('❌ 订阅 $collection 失败，已达到最大重试次数');
    }
  }
  
  /// 安排重连
  void _scheduleReconnect(String collection) {
    _reconnectAttempts++;
    final delay = Duration(seconds: _reconnectAttempts * 2);
    
    print('🔄 将在 ${delay.inSeconds} 秒后重连 $collection (尝试 $_reconnectAttempts/$_maxReconnectAttempts)');
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      _reconnectToCollection(collection);
    });
  }
  
  /// 重连到集合
  void _reconnectToCollection(String collection) {
    try {
      final listeners = _listeners[collection];
      if (listeners != null && listeners.isNotEmpty) {
        subscribeToCollection(collection, listeners.first);
      }
    } catch (e) {
      print('❌ 重连到 $collection 失败: $e');
    }
  }
  
  /// 订阅学生数据更新
  void subscribeToStudents(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('students', onUpdate);
  }
  
  /// 订阅考勤数据更新
  void subscribeToAttendance(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('student_attendance', onUpdate);
  }
  
  /// 订阅发票数据更新
  void subscribeToInvoices(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('invoices', onUpdate);
  }
  
  /// 订阅支付数据更新
  void subscribeToPayments(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('payments', onUpdate);
  }
  
  /// 订阅费用项目更新
  void subscribeToFeeItems(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('fee_items', onUpdate);
  }
  
  /// 订阅学生费用更新
  void subscribeToStudentFees(Function(Map<String, dynamic>) onUpdate) {
    subscribeToCollection('student_fees', onUpdate);
  }
  
  /// 获取订阅状态
  Map<String, dynamic> getSubscriptionStatus() {
    return {
      'is_connected': _isConnected,
      'subscribed_collections': _subscriptions.keys.toList(),
      'total_listeners': _listeners.values.fold(0, (sum, list) => sum + list.length),
      'reconnect_attempts': _reconnectAttempts,
    };
  }
  
  /// 手动重连所有订阅
  Future<void> reconnectAll() async {
    print('🔄 开始重连所有订阅...');
    
    final collections = _listeners.keys.toList();
    unsubscribeAll();
    
    for (final collection in collections) {
      final listeners = _listeners[collection];
      if (listeners != null && listeners.isNotEmpty) {
        subscribeToCollection(collection, listeners.first);
      }
    }
    
    print('✅ 重连完成');
  }
  
  /// 检查连接状态
  Future<bool> checkConnection() async {
    try {
      // 这里可以添加连接检查逻辑
      return _isConnected;
    } catch (e) {
      print('❌ 检查连接状态失败: $e');
      return false;
    }
  }
  
  @override
  void dispose() {
    unsubscribeAll();
    _reconnectTimer?.cancel();
    super.dispose();
  }
}

/// 实时更新Widget
class RealtimeListener extends StatefulWidget {
  final String collection;
  final Function(Map<String, dynamic>) onUpdate;
  final Widget child;
  final bool autoSubscribe;
  
  const RealtimeListener({
    super.key,
    required this.collection,
    required this.onUpdate,
    required this.child,
    this.autoSubscribe = true,
  });
  
  @override
  State<RealtimeListener> createState() => _RealtimeListenerState();
}

class _RealtimeListenerState extends State<RealtimeListener> {
  @override
  void initState() {
    super.initState();
    if (widget.autoSubscribe) {
      RealtimeService.instance.subscribeToCollection(
        widget.collection,
        widget.onUpdate,
      );
    }
  }
  
  @override
  void dispose() {
    if (widget.autoSubscribe) {
      RealtimeService.instance.unsubscribeFromCollection(widget.collection);
    }
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
