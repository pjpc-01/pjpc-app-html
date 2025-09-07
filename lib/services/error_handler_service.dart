import 'package:flutter/material.dart';
import 'dart:io';
import 'dart:async';

class ErrorHandlerService {
  static void handleError(
    BuildContext context, 
    dynamic error, 
    String operation, {
    VoidCallback? onRetry,
    bool showSnackBar = true,
  }) {
    final message = getErrorMessage(error);
    final errorType = _getErrorType(error);
    
    // 记录错误日志
    _logError(error, operation, errorType);
    
    // 显示错误提示
    if (showSnackBar) {
      showErrorSnackBar(context, message, onRetry);
    }
  }
  
  /// 获取用户友好的错误消息
  static String getErrorMessage(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    // PocketBase特定错误
    if (errorString.contains('invalid_credentials')) {
      return '用户名或密码错误，请检查后重试';
    }
    if (errorString.contains('record_not_found')) {
      return '记录未找到，可能已被删除';
    }
    if (errorString.contains('validation_failed')) {
      return '数据验证失败，请检查输入信息';
    }
    if (errorString.contains('permission_denied')) {
      return '权限不足，请联系管理员';
    }
    if (errorString.contains('rate_limit_exceeded')) {
      return '请求过于频繁，请稍后再试';
    }
    if (errorString.contains('server_error')) {
      return '服务器错误，请稍后再试';
    }
    if (errorString.contains('unauthorized')) {
      return '登录已过期，请重新登录';
    }
    if (errorString.contains('forbidden')) {
      return '访问被拒绝，权限不足';
    }
    if (errorString.contains('not_found')) {
      return '请求的资源不存在';
    }
    if (errorString.contains('conflict')) {
      return '数据冲突，请刷新后重试';
    }
    
    // 网络错误
    if (error is SocketException) {
      return '网络连接失败，请检查网络设置';
    }
    if (error is HttpException) {
      return '网络请求失败，请检查网络连接';
    }
    if (error is TimeoutException) {
      return '请求超时，请检查网络连接';
    }
    if (error is HandshakeException) {
      return '网络连接异常，请重试';
    }
    if (errorString.contains('connection refused')) {
      return '无法连接到服务器，请检查网络';
    }
    if (errorString.contains('connection timeout')) {
      return '连接超时，请检查网络设置';
    }
    if (errorString.contains('no internet')) {
      return '无网络连接，请检查网络设置';
    }
    
    // 文件系统错误
    if (error is FileSystemException) {
      return '文件操作失败，请检查存储权限';
    }
    
    // 其他错误
    if (errorString.contains('format exception')) {
      return '数据格式错误，请重试';
    }
    if (errorString.contains('type error')) {
      return '数据类型错误，请联系技术支持';
    }
    if (errorString.contains('null check')) {
      return '数据异常，请刷新后重试';
    }
    
    // 默认错误消息
    return '操作失败，请重试';
  }
  
  /// 获取错误类型
  static ErrorType _getErrorType(dynamic error) {
    final errorString = error.toString().toLowerCase();
    
    if (errorString.contains('invalid_credentials') || 
        errorString.contains('unauthorized')) {
      return ErrorType.authentication;
    }
    if (errorString.contains('permission_denied') || 
        errorString.contains('forbidden')) {
      return ErrorType.permission;
    }
    if (error is SocketException || 
        error is HttpException || 
        error is TimeoutException) {
      return ErrorType.network;
    }
    if (errorString.contains('validation_failed')) {
      return ErrorType.validation;
    }
    if (errorString.contains('server_error')) {
      return ErrorType.server;
    }
    
    return ErrorType.unknown;
  }
  
  /// 记录错误日志
  static void _logError(dynamic error, String operation, ErrorType errorType) {
    final timestamp = DateTime.now().toIso8601String();
    // Error logged: $operation (${errorType.name}): $error
    
    // 这里可以添加更详细的日志记录
    // 例如：发送到崩溃报告服务
  }
  
  /// 显示错误SnackBar
  static void showErrorSnackBar(
    BuildContext context, 
    String message, 
    VoidCallback? onRetry,
  ) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              Icons.error_outline,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.error,
        duration: const Duration(seconds: 4),
        action: onRetry != null ? SnackBarAction(
          label: '重试',
          textColor: Colors.white,
          onPressed: onRetry,
        ) : null,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
  
  /// 显示错误对话框
  static void showErrorDialog(
    BuildContext context, 
    String title, 
    String message, {
    VoidCallback? onRetry,
    VoidCallback? onCancel,
  }) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.error_outline,
              color: Theme.of(context).colorScheme.error,
              size: 24,
            ),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message),
        actions: [
          if (onCancel != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onCancel();
              },
              child: const Text('取消'),
            ),
          if (onRetry != null)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onRetry();
              },
              child: const Text('重试'),
            ),
          if (onRetry == null && onCancel == null)
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('确定'),
            ),
        ],
      ),
    );
  }
  
  /// 显示网络错误提示
  static void showNetworkError(BuildContext context) {
    showErrorDialog(
      context,
      '网络连接失败',
      '请检查网络设置后重试',
      onRetry: () {
        // 可以添加重试逻辑
      },
    );
  }
  
  /// 显示认证错误提示
  static void showAuthError(BuildContext context) {
    showErrorDialog(
      context,
      '登录已过期',
      '请重新登录',
      onRetry: () {
        // 导航到登录页面
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      },
    );
  }
  
  /// 显示权限错误提示
  static void showPermissionError(BuildContext context) {
    showErrorDialog(
      context,
      '权限不足',
      '您没有执行此操作的权限，请联系管理员',
    );
  }
}

/// 错误类型枚举
enum ErrorType {
  authentication,
  permission,
  network,
  validation,
  server,
  unknown,
}

/// 错误处理扩展
extension ErrorTypeExtension on ErrorType {
  String get displayName {
    switch (this) {
      case ErrorType.authentication:
        return '认证错误';
      case ErrorType.permission:
        return '权限错误';
      case ErrorType.network:
        return '网络错误';
      case ErrorType.validation:
        return '验证错误';
      case ErrorType.server:
        return '服务器错误';
      case ErrorType.unknown:
        return '未知错误';
    }
  }
  
  IconData get icon {
    switch (this) {
      case ErrorType.authentication:
        return Icons.lock_outline;
      case ErrorType.permission:
        return Icons.block;
      case ErrorType.network:
        return Icons.wifi_off;
      case ErrorType.validation:
        return Icons.warning_outlined;
      case ErrorType.server:
        return Icons.error_outline;
      case ErrorType.unknown:
        return Icons.help_outline;
    }
  }
}
