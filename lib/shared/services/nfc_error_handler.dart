/// NFC错误处理服务 - 提供友好的错误信息和处理建议
class NFCErrorHandler {
  static final NFCErrorHandler _instance = NFCErrorHandler._internal();
  factory NFCErrorHandler() => _instance;
  NFCErrorHandler._internal();
  
  static NFCErrorHandler get instance => _instance;
  
  /// 处理NFC扫描错误并返回友好的错误信息
  NFCErrorInfo handleError(dynamic error, {String? context}) {
    String errorMessage = error.toString().toLowerCase();
    
    // 超时错误
    if (errorMessage.contains('timeout') || errorMessage.contains('超时')) {
      return NFCErrorInfo(
        title: '扫描超时',
        message: 'NFC扫描超时，请确保卡片靠近设备并重试',
        suggestion: '将NFC卡片贴近设备背面，保持稳定',
        errorType: NFCErrorType.timeout,
        canRetry: true,
      );
    }
    
    // 取消错误
    if (errorMessage.contains('cancelled') || errorMessage.contains('取消')) {
      return NFCErrorInfo(
        title: '扫描已取消',
        message: '用户取消了NFC扫描操作',
        suggestion: '点击扫描按钮重新开始',
        errorType: NFCErrorType.cancelled,
        canRetry: true,
      );
    }
    
    // NFC不可用错误
    if (errorMessage.contains('nfc功能不可用') || 
        errorMessage.contains('nfc unavailable') ||
        errorMessage.contains('nfc not available')) {
      return NFCErrorInfo(
        title: 'NFC功能不可用',
        message: '设备NFC功能未开启或不可用',
        suggestion: '请在设置中开启NFC功能',
        errorType: NFCErrorType.nfcUnavailable,
        canRetry: false,
        actionText: '打开设置',
      );
    }
    
    // 数据错误
    if (errorMessage.contains('没有找到有效数据') || 
        errorMessage.contains('no valid data') ||
        errorMessage.contains('empty')) {
      return NFCErrorInfo(
        title: '数据读取失败',
        message: '无法从NFC卡片中读取有效数据',
        suggestion: '请确保使用正确的NFC卡片',
        errorType: NFCErrorType.dataError,
        canRetry: true,
      );
    }
    
    // 用户未找到错误
    if (errorMessage.contains('未找到对应的') || 
        errorMessage.contains('not found') ||
        errorMessage.contains('找不到')) {
      return NFCErrorInfo(
        title: '用户未找到',
        message: '未找到与此NFC卡片关联的用户',
        suggestion: '请检查NFC卡片是否正确分配',
        errorType: NFCErrorType.userNotFound,
        canRetry: true,
        actionText: '联系管理员',
      );
    }
    
    // 网络错误
    if (errorMessage.contains('network') || 
        errorMessage.contains('网络') ||
        errorMessage.contains('connection') ||
        errorMessage.contains('连接')) {
      return NFCErrorInfo(
        title: '网络连接失败',
        message: '无法连接到服务器，请检查网络连接',
        suggestion: '请确保设备已连接到网络',
        errorType: NFCErrorType.networkError,
        canRetry: true,
      );
    }
    
    // 权限错误
    if (errorMessage.contains('permission') || 
        errorMessage.contains('权限') ||
        errorMessage.contains('denied')) {
      return NFCErrorInfo(
        title: '权限不足',
        message: '没有足够的权限执行此操作',
        suggestion: '请联系管理员获取相应权限',
        errorType: NFCErrorType.permissionError,
        canRetry: false,
        actionText: '联系管理员',
      );
    }
    
    // 设备错误
    if (errorMessage.contains('device') || 
        errorMessage.contains('设备') ||
        errorMessage.contains('hardware')) {
      return NFCErrorInfo(
        title: '设备错误',
        message: '设备NFC硬件出现问题',
        suggestion: '请重启设备或联系技术支持',
        errorType: NFCErrorType.deviceError,
        canRetry: true,
      );
    }
    
    // 扫描间隔错误
    if (errorMessage.contains('扫描间隔太短') || 
        errorMessage.contains('scan interval')) {
      return NFCErrorInfo(
        title: '扫描过于频繁',
        message: '请稍等片刻后再进行扫描',
        suggestion: '等待1秒后重试',
        errorType: NFCErrorType.scanInterval,
        canRetry: true,
        retryDelay: 1000,
      );
    }
    
    // 正在扫描错误
    if (errorMessage.contains('正在扫描中') || 
        errorMessage.contains('scanning')) {
      return NFCErrorInfo(
        title: '正在扫描中',
        message: '请等待当前扫描完成',
        suggestion: '请稍候片刻',
        errorType: NFCErrorType.scanningInProgress,
        canRetry: false,
      );
    }
    
    // 默认错误
    return NFCErrorInfo(
      title: '扫描失败',
      message: 'NFC扫描过程中发生未知错误',
      suggestion: '请重试或联系技术支持',
      errorType: NFCErrorType.unknown,
      canRetry: true,
    );
  }
  
  /// 获取错误类型的图标
  String getErrorIcon(NFCErrorType errorType) {
    switch (errorType) {
      case NFCErrorType.timeout:
        return '⏱️';
      case NFCErrorType.cancelled:
        return '❌';
      case NFCErrorType.nfcUnavailable:
        return '📱';
      case NFCErrorType.dataError:
        return '💳';
      case NFCErrorType.userNotFound:
        return '👤';
      case NFCErrorType.networkError:
        return '🌐';
      case NFCErrorType.permissionError:
        return '🔒';
      case NFCErrorType.deviceError:
        return '🔧';
      case NFCErrorType.scanInterval:
        return '⏰';
      case NFCErrorType.scanningInProgress:
        return '🔄';
      case NFCErrorType.unknown:
        return '❓';
    }
  }
  
  /// 获取错误类型的颜色
  int getErrorColor(NFCErrorType errorType) {
    switch (errorType) {
      case NFCErrorType.timeout:
        return 0xFFF59E0B; // 橙色
      case NFCErrorType.cancelled:
        return 0xFF6B7280; // 灰色
      case NFCErrorType.nfcUnavailable:
        return 0xFFEF4444; // 红色
      case NFCErrorType.dataError:
        return 0xFFF59E0B; // 橙色
      case NFCErrorType.userNotFound:
        return 0xFF3B82F6; // 蓝色
      case NFCErrorType.networkError:
        return 0xFFEF4444; // 红色
      case NFCErrorType.permissionError:
        return 0xFFEF4444; // 红色
      case NFCErrorType.deviceError:
        return 0xFFEF4444; // 红色
      case NFCErrorType.scanInterval:
        return 0xFFF59E0B; // 橙色
      case NFCErrorType.scanningInProgress:
        return 0xFF3B82F6; // 蓝色
      case NFCErrorType.unknown:
        return 0xFF6B7280; // 灰色
    }
  }
}

/// NFC错误信息
class NFCErrorInfo {
  final String title;
  final String message;
  final String suggestion;
  final NFCErrorType errorType;
  final bool canRetry;
  final String? actionText;
  final int? retryDelay;
  
  const NFCErrorInfo({
    required this.title,
    required this.message,
    required this.suggestion,
    required this.errorType,
    required this.canRetry,
    this.actionText,
    this.retryDelay,
  });
}

/// NFC错误类型
enum NFCErrorType {
  timeout,
  cancelled,
  nfcUnavailable,
  dataError,
  userNotFound,
  networkError,
  permissionError,
  deviceError,
  scanInterval,
  scanningInProgress,
  unknown,
}
