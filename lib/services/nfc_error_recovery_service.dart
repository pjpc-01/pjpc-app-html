import 'dart:async';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:flutter/material.dart';

/// NFC错误恢复服务 - 处理NFC相关的错误和恢复
class NFCErrorRecoveryService {
  static final NFCErrorRecoveryService _instance = NFCErrorRecoveryService._internal();
  factory NFCErrorRecoveryService() => _instance;
  NFCErrorRecoveryService._internal();
  
  static NFCErrorRecoveryService get instance => _instance;
  
  Timer? _recoveryTimer;
  int _recoveryAttempts = 0;
  static const int _maxRecoveryAttempts = 3;
  
  /// 处理NFC错误并尝试恢复
  Future<NFCErrorRecoveryResult> handleNFCError(dynamic error) async {
    try {
      // 分析错误类型
      final errorType = _analyzeErrorType(error);
      
      switch (errorType) {
        case NFCErrorType.activityNotAttached:
          return await _handleActivityError();
        case NFCErrorType.nfcNotAvailable:
          return await _handleNfcNotAvailableError();
        case NFCErrorType.sessionTimeout:
          return await _handleSessionTimeoutError();
        case NFCErrorType.multipleTags:
          return await _handleMultipleTagsError();
        case NFCErrorType.readWriteError:
          return await _handleReadWriteError();
        case NFCErrorType.unknown:
        default:
          return await _handleUnknownError(error);
      }
    } catch (e) {
      return NFCErrorRecoveryResult.failed('错误恢复失败: $e');
    }
  }
  
  /// 分析错误类型
  NFCErrorType _analyzeErrorType(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    if (errorString.contains('not attached to activity') || 
        errorString.contains('activity')) {
      return NFCErrorType.activityNotAttached;
    } else if (errorString.contains('nfc not available') || 
               errorString.contains('nfc not supported')) {
      return NFCErrorType.nfcNotAvailable;
    } else if (errorString.contains('timeout') || 
               errorString.contains('session')) {
      return NFCErrorType.sessionTimeout;
    } else if (errorString.contains('multiple') || 
               errorString.contains('tags')) {
      return NFCErrorType.multipleTags;
    } else if (errorString.contains('read') || 
               errorString.contains('write') || 
               errorString.contains('ndef')) {
      return NFCErrorType.readWriteError;
    } else {
      return NFCErrorType.unknown;
    }
  }
  
  /// 处理Activity错误
  Future<NFCErrorRecoveryResult> _handleActivityError() async {
    if (_recoveryAttempts >= _maxRecoveryAttempts) {
      return NFCErrorRecoveryResult.failed(
        '应用状态异常，已达到最大恢复尝试次数。请重新启动应用。'
      );
    }
    
    _recoveryAttempts++;
    
    // 尝试恢复Activity状态
    try {
      await Future.delayed(Duration(seconds: _recoveryAttempts));
      
      // 检查NFC可用性
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability == NFCAvailability.available) {
        _recoveryAttempts = 0; // 重置计数器
        return NFCErrorRecoveryResult.recovered('Activity状态已恢复');
      }
    } catch (e) {
      // 继续尝试恢复
    }
    
    return NFCErrorRecoveryResult.retry(
      '正在尝试恢复Activity状态... (尝试 $_recoveryAttempts/$_maxRecoveryAttempts)',
      Duration(seconds: 2),
    );
  }
  
  /// 处理NFC不可用错误
  Future<NFCErrorRecoveryResult> _handleNfcNotAvailableError() async {
    return NFCErrorRecoveryResult.failed(
      'NFC功能不可用。请检查：\n'
      '1. 设备是否支持NFC\n'
      '2. NFC是否已开启\n'
      '3. 应用是否有NFC权限'
    );
  }
  
  /// 处理会话超时错误
  Future<NFCErrorRecoveryResult> _handleSessionTimeoutError() async {
    try {
      // 确保NFC会话被正确关闭
      await FlutterNfcKit.finish();
      await Future.delayed(Duration(milliseconds: 500));
      
      return NFCErrorRecoveryResult.recovered('NFC会话已重置');
    } catch (e) {
      return NFCErrorRecoveryResult.failed('无法重置NFC会话: $e');
    }
  }
  
  /// 处理多标签错误
  Future<NFCErrorRecoveryResult> _handleMultipleTagsError() async {
    return NFCErrorRecoveryResult.failed(
      '检测到多个NFC标签。请移除所有标签，然后重试。'
    );
  }
  
  /// 处理读写错误
  Future<NFCErrorRecoveryResult> _handleReadWriteError() async {
    try {
      // 尝试重置NFC会话
      await FlutterNfcKit.finish();
      await Future.delayed(Duration(milliseconds: 300));
      
      return NFCErrorRecoveryResult.recovered('NFC读写会话已重置');
    } catch (e) {
      return NFCErrorRecoveryResult.failed('无法重置NFC读写会话: $e');
    }
  }
  
  /// 处理未知错误
  Future<NFCErrorRecoveryResult> _handleUnknownError(dynamic error) async {
    return NFCErrorRecoveryResult.failed('未知NFC错误: $error');
  }
  
  /// 重置恢复尝试计数器
  void resetRecoveryAttempts() {
    _recoveryAttempts = 0;
  }
  
  /// 清理资源
  void dispose() {
    _recoveryTimer?.cancel();
    _recoveryAttempts = 0;
  }
}

/// NFC错误类型
enum NFCErrorType {
  activityNotAttached,
  nfcNotAvailable,
  sessionTimeout,
  multipleTags,
  readWriteError,
  unknown,
}

/// NFC错误恢复结果
class NFCErrorRecoveryResult {
  final bool isSuccess;
  final bool isRetry;
  final String message;
  final Duration? retryDelay;
  
  NFCErrorRecoveryResult._({
    required this.isSuccess,
    required this.isRetry,
    required this.message,
    this.retryDelay,
  });
  
  factory NFCErrorRecoveryResult.recovered(String message) {
    return NFCErrorRecoveryResult._(
      isSuccess: true,
      isRetry: false,
      message: message,
    );
  }
  
  factory NFCErrorRecoveryResult.failed(String message) {
    return NFCErrorRecoveryResult._(
      isSuccess: false,
      isRetry: false,
      message: message,
    );
  }
  
  factory NFCErrorRecoveryResult.retry(String message, Duration delay) {
    return NFCErrorRecoveryResult._(
      isSuccess: false,
      isRetry: true,
      message: message,
      retryDelay: delay,
    );
  }
}

/// NFC错误恢复Widget
class NFCErrorRecoveryWidget extends StatefulWidget {
  final Widget child;
  final Function(NFCErrorRecoveryResult) onRecoveryResult;
  
  const NFCErrorRecoveryWidget({
    super.key,
    required this.child,
    required this.onRecoveryResult,
  });
  
  @override
  State<NFCErrorRecoveryWidget> createState() => _NFCErrorRecoveryWidgetState();
}

class _NFCErrorRecoveryWidgetState extends State<NFCErrorRecoveryWidget> {
  @override
  void dispose() {
    NFCErrorRecoveryService.instance.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
