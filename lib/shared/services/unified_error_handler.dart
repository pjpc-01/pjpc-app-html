import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'dart:async';

/// 统一错误处理服务 - 增强版
class UnifiedErrorHandler {
  static final UnifiedErrorHandler _instance = UnifiedErrorHandler._internal();
  factory UnifiedErrorHandler() => _instance;
  UnifiedErrorHandler._internal();
  
  static UnifiedErrorHandler get instance => _instance;
  
  // 错误日志记录
  final List<ErrorLog> _errorLogs = [];
  
  /// 处理错误的主要方法
  static void handleError(
    BuildContext context,
    dynamic error,
    String operation, {
    VoidCallback? onRetry,
    VoidCallback? onCancel,
    bool showSnackBar = true,
    bool showDialog = false,
    String? customMessage,
  }) {
    final handler = UnifiedErrorHandler.instance;
    final errorInfo = handler._analyzeError(error, operation, customMessage: customMessage);
    
    // 记录错误日志
    handler._logError(errorInfo);
    
    // 显示错误信息
    if (showDialog) {
      handler._showErrorDialog(context, errorInfo, onRetry, onCancel);
    } else if (showSnackBar) {
      handler._showErrorSnackBar(context, errorInfo, onRetry);
    }
    
    // 触觉反馈
    HapticFeedback.lightImpact();
  }
  
  /// 分析错误类型和原因
  ErrorInfo _analyzeError(dynamic error, String operation, {String? customMessage}) {
    final errorString = error.toString().toLowerCase();
    
    // 网络错误
    if (error is SocketException) {
      return ErrorInfo(
        type: ErrorType.network,
        title: '网络连接失败',
        message: '请检查网络设置后重试',
        operation: operation,
        severity: ErrorSeverity.high,
        canRetry: true,
      );
    }
    
    if (error is HttpException) {
      return ErrorInfo(
        type: ErrorType.network,
        title: '网络请求失败',
        message: '服务器响应异常，请稍后重试',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: true,
      );
    }
    
    if (error is TimeoutException) {
      return ErrorInfo(
        type: ErrorType.network,
        title: '请求超时',
        message: '网络连接超时，请检查网络后重试',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: true,
      );
    }
    
    // PocketBase特定错误
    if (errorString.contains('invalid_credentials')) {
      return ErrorInfo(
        type: ErrorType.authentication,
        title: '登录失败',
        message: '用户名或密码错误，请检查后重试',
        operation: operation,
        severity: ErrorSeverity.high,
        canRetry: true,
      );
    }
    
    if (errorString.contains('record_not_found')) {
      return ErrorInfo(
        type: ErrorType.data,
        title: '数据未找到',
        message: '请求的数据不存在，可能已被删除',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: false,
      );
    }
    
    if (errorString.contains('validation_failed')) {
      return ErrorInfo(
        type: ErrorType.validation,
        title: '数据验证失败',
        message: '输入的数据格式不正确，请检查后重试',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: false,
      );
    }
    
    if (errorString.contains('permission_denied')) {
      return ErrorInfo(
        type: ErrorType.permission,
        title: '权限不足',
        message: '您没有执行此操作的权限，请联系管理员',
        operation: operation,
        severity: ErrorSeverity.high,
        canRetry: false,
      );
    }
    
    if (errorString.contains('rate_limit_exceeded')) {
      return ErrorInfo(
        type: ErrorType.rateLimit,
        title: '请求过于频繁',
        message: '操作过于频繁，请稍后再试',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: true,
      );
    }
    
    // 文件系统错误
    if (error is FileSystemException) {
      return ErrorInfo(
        type: ErrorType.fileSystem,
        title: '文件操作失败',
        message: '文件操作异常，请检查存储权限',
        operation: operation,
        severity: ErrorSeverity.medium,
        canRetry: true,
      );
    }
    
    // 默认错误
    return ErrorInfo(
      type: ErrorType.unknown,
      title: '操作失败',
      message: customMessage ?? '发生未知错误，请重试',
      operation: operation,
      severity: ErrorSeverity.medium,
      canRetry: true,
    );
  }
  
  /// 记录错误日志
  void _logError(ErrorInfo errorInfo) {
    final log = ErrorLog(
      timestamp: DateTime.now(),
      errorInfo: errorInfo,
    );
    
    _errorLogs.add(log);
    
    // 保持日志数量在合理范围内
    if (_errorLogs.length > 100) {
      _errorLogs.removeAt(0);
    }
    
    // 输出到控制台（生产环境可以发送到远程日志服务）
  }
  
  /// 显示错误SnackBar
  void _showErrorSnackBar(BuildContext context, ErrorInfo errorInfo, VoidCallback? onRetry) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              errorInfo.type.icon,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    errorInfo.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    errorInfo.message,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: errorInfo.severity.color,
        duration: Duration(
          seconds: errorInfo.severity == ErrorSeverity.high ? 5 : 3,
        ),
        action: onRetry != null && errorInfo.canRetry
            ? SnackBarAction(
                label: '重试',
                textColor: Colors.white,
                onPressed: onRetry,
              )
            : null,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
  
  /// 显示错误对话框
  void _showErrorDialog(
    BuildContext context,
    ErrorInfo errorInfo,
    VoidCallback? onRetry,
    VoidCallback? onCancel,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: errorInfo.severity.color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                errorInfo.type.icon,
                color: errorInfo.severity.color,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                errorInfo.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              errorInfo.message,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: const Color(0xFF6B7280),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '操作: ${errorInfo.operation}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (onCancel != null)
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                onCancel();
              },
              child: const Text('取消'),
            ),
          if (onRetry != null && errorInfo.canRetry)
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onRetry();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: errorInfo.severity.color,
                foregroundColor: Colors.white,
              ),
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
  
  /// 获取错误统计
  List<ErrorLog> getErrorLogs() => List.unmodifiable(_errorLogs);
  
  /// 清除错误日志
  void clearErrorLogs() => _errorLogs.clear();
  
  /// 获取错误统计信息
  ErrorStatistics getErrorStatistics() {
    final now = DateTime.now();
    final last24Hours = now.subtract(const Duration(hours: 24));
    
    final recentErrors = _errorLogs.where(
      (log) => log.timestamp.isAfter(last24Hours),
    ).toList();
    
    final errorCounts = <ErrorType, int>{};
    for (final log in recentErrors) {
      errorCounts[log.errorInfo.type] = (errorCounts[log.errorInfo.type] ?? 0) + 1;
    }
    
    return ErrorStatistics(
      totalErrors: recentErrors.length,
      errorCounts: errorCounts,
      mostCommonError: errorCounts.isNotEmpty
          ? errorCounts.entries.reduce((a, b) => a.value > b.value ? a : b).key
          : null,
    );
  }
}

/// 错误信息类
class ErrorInfo {
  final ErrorType type;
  final String title;
  final String message;
  final String operation;
  final ErrorSeverity severity;
  final bool canRetry;
  
  const ErrorInfo({
    required this.type,
    required this.title,
    required this.message,
    required this.operation,
    required this.severity,
    required this.canRetry,
  });
}

/// 错误日志类
class ErrorLog {
  final DateTime timestamp;
  final ErrorInfo errorInfo;
  
  const ErrorLog({
    required this.timestamp,
    required this.errorInfo,
  });
}

/// 错误统计类
class ErrorStatistics {
  final int totalErrors;
  final Map<ErrorType, int> errorCounts;
  final ErrorType? mostCommonError;
  
  const ErrorStatistics({
    required this.totalErrors,
    required this.errorCounts,
    this.mostCommonError,
  });
}

/// 错误类型枚举
enum ErrorType {
  network,
  authentication,
  permission,
  validation,
  data,
  fileSystem,
  rateLimit,
  unknown;
  
  IconData get icon {
    switch (this) {
      case ErrorType.network:
        return Icons.wifi_off_rounded;
      case ErrorType.authentication:
        return Icons.lock_outline_rounded;
      case ErrorType.permission:
        return Icons.block_rounded;
      case ErrorType.validation:
        return Icons.warning_rounded;
      case ErrorType.data:
        return Icons.data_object_rounded;
      case ErrorType.fileSystem:
        return Icons.folder_off_rounded;
      case ErrorType.rateLimit:
        return Icons.speed_rounded;
      case ErrorType.unknown:
        return Icons.help_outline_rounded;
    }
  }
  
  String get displayName {
    switch (this) {
      case ErrorType.network:
        return '网络错误';
      case ErrorType.authentication:
        return '认证错误';
      case ErrorType.permission:
        return '权限错误';
      case ErrorType.validation:
        return '验证错误';
      case ErrorType.data:
        return '数据错误';
      case ErrorType.fileSystem:
        return '文件系统错误';
      case ErrorType.rateLimit:
        return '频率限制';
      case ErrorType.unknown:
        return '未知错误';
    }
  }
}

/// 错误严重程度枚举
enum ErrorSeverity {
  low,
  medium,
  high,
  critical;
  
  Color get color {
    switch (this) {
      case ErrorSeverity.low:
        return const Color(0xFF10B981); // 绿色
      case ErrorSeverity.medium:
        return const Color(0xFFF59E0B); // 橙色
      case ErrorSeverity.high:
        return const Color(0xFFEF4444); // 红色
      case ErrorSeverity.critical:
        return const Color(0xFF7C2D12); // 深红色
    }
  }
  
  String get displayName {
    switch (this) {
      case ErrorSeverity.low:
        return '低';
      case ErrorSeverity.medium:
        return '中';
      case ErrorSeverity.high:
        return '高';
      case ErrorSeverity.critical:
        return '严重';
    }
  }
}
