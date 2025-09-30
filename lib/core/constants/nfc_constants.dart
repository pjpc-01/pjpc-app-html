/// NFC相关常量
class NFCConstants {
  // 操作模式
  static const String modeReplacement = 'replacement';
  static const String modeAssignment = 'assignment';
  static const String modeCheck = 'check';
  static const String modeManagement = 'management';
  
  // 用户类型
  static const String userTypeStudent = 'student';
  static const String userTypeTeacher = 'teacher';
  
  // 申请状态
  static const String statusPending = 'pending';
  static const String statusApproved = 'approved';
  static const String statusRejected = 'rejected';
  static const String statusAll = 'all';
  
  // NFC状态
  static const String nfcStatusAvailable = 'NFC功能正常';
  static const String nfcStatusUnavailable = 'NFC功能不可用';
  static const String nfcStatusChecking = '检查NFC状态...';
  
  // 错误消息
  static const String errorScanNfcFirst = '请先扫描NFC卡';
  static const String errorSelectUser = '请先选择用户';
  static const String errorOperationFailed = '操作失败';
  static const String errorNfcUnavailable = 'NFC功能不可用，请检查设备设置';
  
  // 成功消息
  static const String successReplacement = '补办成功';
  static const String successAssignment = '分配成功';
  static const String successOperation = '操作成功完成';
  
  // 动画配置
  static const Duration pulseAnimationDuration = Duration(seconds: 2);
  static const double pulseAnimationBegin = 0.8;
  static const double pulseAnimationEnd = 1.2;
  
  // 扫描配置
  static const Duration nfcScanTimeout = Duration(seconds: 8); // 减少超时时间
  static const Duration scanCooldown = Duration(seconds: 1); // 减少冷却时间
  static const Duration quickScanTimeout = Duration(seconds: 5); // 快速扫描超时
  static const int maxRetryAttempts = 3; // 最大重试次数
  static const Duration retryDelay = Duration(milliseconds: 500); // 重试延迟
  
  // 列表配置
  static const int defaultPerPage = 20;
  static const int maxPerPage = 100;
  
  // 颜色常量
  static const int primaryColor = 0xFF3B82F6;
  static const int successColor = 0xFF10B981;
  static const int errorColor = 0xFFEF4444;
  static const int warningColor = 0xFFF59E0B;
  static const int backgroundColor = 0xFFF8FAFC;
  static const int cardColor = 0xFFFFFFFF;
  
  // 尺寸常量
  static const double smallScreenHeight = 700;
  static const double smallScreenWidth = 360;
  static const double cardBorderRadius = 16.0;
  static const double buttonBorderRadius = 12.0;
  static const double defaultPadding = 16.0;
  static const double smallPadding = 12.0;
  static const double largePadding = 20.0;
}

