import 'dart:convert';

/// 统一字段映射服务
/// 提供学生和教师集合字段的统一映射，确保NFC关联功能使用一致的字段名
class UnifiedFieldMapper {
  
  /// 基本信息字段映射
  /// 将不同集合的字段名映射到统一的字段名
  static const Map<String, Map<String, String>> fieldMappings = {
    'student': {
      'student_name': 'name',
      'student_id': 'user_id',
      'cardNumber': 'cardNumber',
      'issuedDate': 'nfc_issued_date',
      'expiryDate': 'nfc_expiry_date',
      'cardStatus': 'nfc_status',
      'cardType': 'nfc_type',
      'last_swipe_time': 'nfc_last_used',
      'swipe_count_today': 'nfc_usage_count',
    },
    'teacher': {
      'name': 'name',
      'user_id': 'user_id',
      'cardNumber': 'cardNumber',
      'nfc_card_issued_date': 'nfc_issued_date',
      'nfc_card_expiry_date': 'nfc_expiry_date',
      'last_swipe_time': 'nfc_last_used',
      'swipe_count_today': 'nfc_usage_count',
    },
  };
  
  /// 获取统一字段名
  /// [originalField] 原始字段名
  /// [collectionType] 集合类型 ('student' 或 'teacher')
  /// 返回统一后的字段名
  static String getUnifiedFieldName(String originalField, String collectionType) {
    final mapping = fieldMappings[collectionType];
    if (mapping != null && mapping.containsKey(originalField)) {
      return mapping[originalField]!;
    }
    return originalField;
  }
  
  /// 获取用户显示名称
  /// [data] 用户数据
  /// [collectionType] 集合类型
  /// 返回用于显示的用户名称
  static String getUserDisplayName(Map<String, dynamic> data, String collectionType) {
    if (collectionType == 'student') {
      return data['student_name'] ?? data['name'] ?? '未知学生';
    } else if (collectionType == 'teacher') {
      return data['name'] ?? '未知教师';
    }
    return '未知用户';
  }
  
  /// 获取统一的NFC关联数据
  /// [nfcTagId] NFC标签ID
  /// [collectionType] 集合类型 ('student' 或 'teacher')
  /// 返回用于NFC关联的统一数据格式
  static Map<String, dynamic> getUnifiedNfcData(String nfcTagId, String collectionType) {
    final now = DateTime.now().toIso8601String();
    
    if (collectionType == 'student') {
      return {
        'cardNumber': nfcTagId,
        'nfc_associated_at': now,
        'nfc_last_used': now,
        'nfc_usage_count': 0,
      };
    } else if (collectionType == 'teacher') {
      return {
        'cardNumber': nfcTagId,
        'nfc_associated_at': now,
        'nfc_last_used': now,
        'nfc_usage_count': 0,
      };
    }
    
    // 默认返回通用格式
    return {
      'nfc_tag_id': nfcTagId,
      'nfc_associated_at': now,
      'nfc_last_used': now,
      'nfc_usage_count': 0,
    };
  }
  
  /// 更新NFC使用统计
  /// [currentData] 当前数据
  /// 返回更新后的NFC使用统计
  static Map<String, dynamic> updateNfcUsageStats(Map<String, dynamic> currentData) {
    final now = DateTime.now().toIso8601String();
    final currentCount = currentData['nfc_usage_count'] ?? 0;
    
    return {
      'nfc_last_used': now,
      'nfc_usage_count': currentCount + 1,
    };
  }
  
  /// 检查NFC字段是否完整
  /// [data] 用户数据
  /// [collectionType] 集合类型
  /// 返回NFC字段完整性检查结果
  static Map<String, bool> checkNfcFieldsCompleteness(Map<String, dynamic> data, String collectionType) {
    final requiredFields = ['cardNumber', 'nfc_associated_at'];
    final optionalFields = ['nfc_last_used', 'nfc_usage_count', 'nfc_tag_id'];
    
    Map<String, bool> result = {};
    
    // 检查必填字段
    for (String field in requiredFields) {
      result[field] = data.containsKey(field) && data[field] != null && data[field].toString().isNotEmpty;
    }
    
    // 检查可选字段
    for (String field in optionalFields) {
      result[field] = data.containsKey(field) && data[field] != null;
    }
    
    return result;
  }
  
  /// 获取NFC状态摘要
  /// [data] 用户数据
  /// 返回NFC状态摘要信息
  static Map<String, dynamic> getNfcStatusSummary(Map<String, dynamic> data) {
    final hasNfcTag = data.containsKey('cardNumber') && data['cardNumber'] != null && data['cardNumber'].toString().isNotEmpty;
    final associatedAt = data['nfc_associated_at'];
    final lastUsed = data['nfc_last_used'];
    final usageCount = data['nfc_usage_count'] ?? 0;
    
    return {
      'has_nfc': hasNfcTag,
      'associated_at': associatedAt,
      'last_used': lastUsed,
      'usage_count': usageCount,
      'status': hasNfcTag ? 'active' : 'inactive',
    };
  }
  
  /// 格式化NFC数据用于显示
  /// [data] 用户数据
  /// 返回格式化的NFC数据显示
  static Map<String, String> formatNfcDataForDisplay(Map<String, dynamic> data) {
    Map<String, String> formatted = {};
    
    if (data.containsKey('cardNumber') && data['cardNumber'] != null) {
      formatted['NFC卡号'] = data['cardNumber'].toString();
    }
    
    if (data.containsKey('nfc_associated_at') && data['nfc_associated_at'] != null) {
      try {
        final date = DateTime.parse(data['nfc_associated_at']);
        formatted['关联时间'] = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } catch (e) {
        formatted['关联时间'] = data['nfc_associated_at'].toString();
      }
    }
    
    if (data.containsKey('nfc_last_used') && data['nfc_last_used'] != null) {
      try {
        final date = DateTime.parse(data['nfc_last_used']);
        formatted['最后使用'] = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } catch (e) {
        formatted['最后使用'] = data['nfc_last_used'].toString();
      }
    }
    
    if (data.containsKey('nfc_usage_count') && data['nfc_usage_count'] != null) {
      formatted['使用次数'] = data['nfc_usage_count'].toString();
    }
    
    return formatted;
  }
  
  /// 验证NFC数据格式
  /// [data] 要验证的数据
  /// 返回验证结果
  static Map<String, dynamic> validateNfcData(Map<String, dynamic> data) {
    Map<String, dynamic> result = {
      'isValid': true,
      'errors': <String>[],
      'warnings': <String>[],
    };
    
    // 验证NFC卡号
    if (data.containsKey('cardNumber')) {
      final cardNumber = data['cardNumber'];
      if (cardNumber == null || cardNumber.toString().isEmpty) {
        result['errors'].add('NFC卡号不能为空');
        result['isValid'] = false;
      }
    }
    
    // 验证关联时间
    if (data.containsKey('nfc_associated_at')) {
      final associatedAt = data['nfc_associated_at'];
      if (associatedAt != null) {
        try {
          DateTime.parse(associatedAt);
        } catch (e) {
          result['errors'].add('NFC关联时间格式不正确');
          result['isValid'] = false;
        }
      }
    }
    
    // 验证使用次数
    if (data.containsKey('nfc_usage_count')) {
      final usageCount = data['nfc_usage_count'];
      if (usageCount != null && (usageCount is! int || usageCount < 0)) {
        result['warnings'].add('NFC使用次数应该是非负整数');
      }
    }
    
    return result;
  }
}
