import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// 崩溃预防服务 - 防止应用崩溃
class CrashPreventionService {
  static final CrashPreventionService _instance = CrashPreventionService._internal();
  factory CrashPreventionService() => _instance;
  CrashPreventionService._internal();
  
  static CrashPreventionService get instance => _instance;
  
  bool _isInitialized = false;
  Timer? _memoryMonitorTimer;
  int _crashCount = 0;
  DateTime? _lastCrashTime;
  
  /// 初始化崩溃预防服务
  void initialize() {
    if (_isInitialized) return;
    
    _isInitialized = true;
    
    // 设置全局错误处理
    FlutterError.onError = (FlutterErrorDetails details) {
      _handleFlutterError(details);
    };
    
    // 设置异步错误处理
    PlatformDispatcher.instance.onError = (error, stack) {
      _handleAsyncError(error, stack);
      return true;
    };
    
    // 启动内存监控
    _startMemoryMonitoring();
    
    print('✅ 崩溃预防服务已初始化');
  }
  
  /// 处理Flutter错误
  void _handleFlutterError(FlutterErrorDetails details) {
    print('🚨 Flutter错误: ${details.exception}');
    print('📍 位置: ${details.library}');
    print('📋 堆栈: ${details.stack}');
    
    _recordCrash();
    
    // 在调试模式下显示错误
    if (kDebugMode) {
      FlutterError.presentError(details);
    }
  }
  
  /// 处理异步错误
  bool _handleAsyncError(Object error, StackTrace stack) {
    print('🚨 异步错误: $error');
    print('📋 堆栈: $stack');
    
    _recordCrash();
    return true;
  }
  
  /// 记录崩溃
  void _recordCrash() {
    _crashCount++;
    _lastCrashTime = DateTime.now();
    
    // 如果崩溃过于频繁，采取保护措施
    if (_crashCount > 5) {
      _takeProtectiveMeasures();
    }
  }
  
  /// 采取保护措施
  void _takeProtectiveMeasures() {
    print('🚨 检测到频繁崩溃，采取保护措施');
    
    // 清理内存
    _cleanupMemory();
    
    // 重置崩溃计数
    _crashCount = 0;
  }
  
  /// 清理内存
  void _cleanupMemory() {
    try {
      // 强制垃圾回收
      // 注意：在Flutter中，垃圾回收是自动的，这里只是示例
      print('🧹 执行内存清理');
      
      // 可以在这里添加其他清理逻辑
      // 例如：清理缓存、取消订阅等
      
    } catch (e) {
      print('❌ 内存清理失败: $e');
    }
  }
  
  /// 启动内存监控
  void _startMemoryMonitoring() {
    _memoryMonitorTimer = Timer.periodic(Duration(minutes: 1), (timer) {
      _checkMemoryUsage();
    });
  }
  
  /// 检查内存使用情况
  void _checkMemoryUsage() {
    try {
      // 这里可以添加内存使用检查逻辑
      // 例如：检查内存使用是否过高
      
      // 如果内存使用过高，执行清理
      if (_shouldCleanupMemory()) {
        _cleanupMemory();
      }
      
    } catch (e) {
      print('❌ 内存检查失败: $e');
    }
  }
  
  /// 判断是否需要清理内存
  bool _shouldCleanupMemory() {
    // 这里可以添加内存使用判断逻辑
    // 例如：检查内存使用率是否超过阈值
    
    // 简单示例：如果崩溃次数过多，执行清理
    return _crashCount > 3;
  }
  
  /// 安全执行操作
  Future<T?> safeExecute<T>(
    Future<T> Function() operation, {
    String? operationName,
    T? defaultValue,
    bool logErrors = true,
  }) async {
    try {
      return await operation();
    } catch (e) {
      if (logErrors) {
        print('❌ 安全执行失败${operationName != null ? ' ($operationName)' : ''}: $e');
      }
      
      _recordCrash();
      return defaultValue;
    }
  }
  
  /// 安全执行同步操作
  T? safeExecuteSync<T>(
    T Function() operation, {
    String? operationName,
    T? defaultValue,
    bool logErrors = true,
  }) {
    try {
      return operation();
    } catch (e) {
      if (logErrors) {
        print('❌ 安全执行失败${operationName != null ? ' ($operationName)' : ''}: $e');
      }
      
      _recordCrash();
      return defaultValue;
    }
  }
  
  /// 获取崩溃统计
  Map<String, dynamic> getCrashStats() {
    return {
      'crash_count': _crashCount,
      'last_crash_time': _lastCrashTime?.toIso8601String(),
      'is_initialized': _isInitialized,
    };
  }
  
  /// 重置崩溃统计
  void resetCrashStats() {
    _crashCount = 0;
    _lastCrashTime = null;
  }
  
  /// 销毁服务
  void dispose() {
    _memoryMonitorTimer?.cancel();
    _memoryMonitorTimer = null;
    _isInitialized = false;
    
    print('✅ 崩溃预防服务已销毁');
  }
}

/// 安全执行装饰器
class SafeExecutor {
  static Future<T?> execute<T>(
    Future<T> Function() operation, {
    String? operationName,
    T? defaultValue,
  }) async {
    return await CrashPreventionService.instance.safeExecute(
      operation,
      operationName: operationName,
      defaultValue: defaultValue,
    );
  }
  
  static T? executeSync<T>(
    T Function() operation, {
    String? operationName,
    T? defaultValue,
  }) {
    return CrashPreventionService.instance.safeExecuteSync(
      operation,
      operationName: operationName,
      defaultValue: defaultValue,
    );
  }
}

