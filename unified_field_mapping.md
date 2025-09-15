# 🔄 统一字段映射服务

此服务提供学生和教师集合字段的统一映射，确保NFC关联功能使用一致的字段名。

## 📋 字段映射表

### 基本信息字段映射
```dart
class UnifiedFieldMapper {
  // 基本信息字段映射
  static const Map<String, String> basicFields = {
    // 学生集合 -> 统一字段
    'student_name': 'name',
    'student_id': 'user_id',
    
    // 教师集合 -> 统一字段 (已经是统一格式)
    'name': 'name',
    'user_id': 'user_id',
  };
  
  // NFC字段映射
  static const Map<String, String> nfcFields = {
    // 学生集合 -> 统一NFC字段
    'cardNumber': 'nfc_card_number',
    'issuedDate': 'nfc_issued_date',
    'expiryDate': 'nfc_expiry_date',
    'cardStatus': 'nfc_status',
    'cardType': 'nfc_type',
    'last_swipe_time': 'nfc_last_used',
    'swipe_count_today': 'nfc_usage_count',
    
    // 教师集合 -> 统一NFC字段
    'nfc_card_number': 'nfc_card_number',
    'nfc_card_issued_date': 'nfc_issued_date',
    'nfc_card_expiry_date': 'nfc_expiry_date',
    'last_swipe_time': 'nfc_last_used',
    'swipe_count_today': 'nfc_usage_count',
  };
  
  // 新增的统一NFC字段
  static const Map<String, dynamic> newNfcFields = {
    'nfc_tag_id': '',
    'nfc_associated_at': '',
    'nfc_last_used': '',
    'nfc_usage_count': 0,
  };
}
```

## 🔧 实施步骤

### 步骤1: 创建统一字段映射服务
```dart
// lib/services/unified_field_mapper.dart
class UnifiedFieldMapper {
  static String getUnifiedFieldName(String originalField, String collectionType) {
    // 根据集合类型和原始字段名返回统一字段名
    if (collectionType == 'student') {
      return basicFields[originalField] ?? originalField;
    } else if (collectionType == 'teacher') {
      return basicFields[originalField] ?? originalField;
    }
    return originalField;
  }
  
  static Map<String, dynamic> getUnifiedNfcData(Map<String, dynamic> originalData, String collectionType) {
    Map<String, dynamic> unifiedData = {};
    
    // 映射NFC字段
    nfcFields.forEach((originalField, unifiedField) {
      if (originalData.containsKey(originalField)) {
        unifiedData[unifiedField] = originalData[originalField];
      }
    });
    
    // 添加新的统一字段
    newNfcFields.forEach((field, defaultValue) {
      if (!unifiedData.containsKey(field)) {
        unifiedData[field] = defaultValue;
      }
    });
    
    return unifiedData;
  }
}
```

### 步骤2: 更新NFC关联功能
```dart
// 在NFC关联功能中使用统一字段
Future<void> _associateNfcWithStudent() async {
  if (_scannedNfcId == null || _selectedUserForAssociation == null) {
    return;
  }

  try {
    String userName = '';
    Map<String, dynamic> nfcData = {
      'nfc_tag_id': _scannedNfcId,
      'nfc_associated_at': DateTime.now().toIso8601String(),
      'nfc_last_used': DateTime.now().toIso8601String(),
      'nfc_usage_count': 0,
    };
    
    if (_associationType == 'student') {
      // 获取学生信息
      final studentProvider = context.read<StudentProvider>();
      final student = studentProvider.students.firstWhere(
        (s) => s.id == _selectedUserForAssociation,
      );
      userName = student.getStringValue('student_name') ?? '未知学生';

      // 使用统一字段更新学生记录
      await _pocketBaseService.updateStudent(_selectedUserForAssociation!, nfcData);
    } else {
      // 获取教师信息
      final teacherProvider = context.read<TeacherProvider>();
      final teacher = teacherProvider.teachers.firstWhere(
        (t) => t.id == _selectedUserForAssociation,
      );
      userName = teacher.getStringValue('name') ?? '未知教师';

      // 使用统一字段更新教师记录
      await _pocketBaseService.updateTeacher(_selectedUserForAssociation!, nfcData);
    }

    // 显示成功消息
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ 成功将NFC卡关联到${_associationType == 'student' ? '学生' : '教师'}: $userName'),
          backgroundColor: AppTheme.successColor,
          duration: const Duration(seconds: 3),
        ),
      );
    }

    // 重置状态
    setState(() {
      _scannedNfcId = null;
      _selectedUserForAssociation = null;
      _scanStatus = 'NFC卡关联成功';
    });

  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ 关联失败: $e'),
          backgroundColor: AppTheme.errorColor,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }
}
```

## 📊 字段整合效果

### 整合前
- **学生集合:** `student_name`, `cardNumber`, `issuedDate`
- **教师集合:** `name`, `nfc_card_number`, `nfc_card_issued_date`
- **问题:** 字段名不一致，难以统一管理

### 整合后
- **统一字段:** `name`, `nfc_card_number`, `nfc_issued_date`
- **优势:** 字段名一致，便于统一管理和维护

## 🎯 整合收益

1. **代码简化:** 减少重复代码，统一处理逻辑
2. **维护性提升:** 字段名一致，便于维护和扩展
3. **功能统一:** NFC关联功能对学生和教师使用相同的字段
4. **数据一致性:** 确保两个集合的NFC数据格式一致

## ⚠️ 注意事项

1. **向后兼容:** 需要保持对现有数据的兼容性
2. **数据迁移:** 可能需要数据迁移脚本来更新现有记录
3. **测试验证:** 确保整合后功能正常工作
4. **文档更新:** 更新相关文档和API说明

---

**文档生成时间:** ${DateTime.now().toString().substring(0, 19)}
**版本:** 1.0
**状态:** 实施中
