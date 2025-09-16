# 📱 NFC操作流程指南

## 🎯 概述

本系统采用简化的NFC操作流程，直接使用NFC标签的硬件ID进行用户匹配，无需复杂的写入操作。

## 🔄 核心流程

### 1. NFC扫描流程

**扫描服务**: `NFCSafeScannerService`

```dart
// 主要扫描方法
safeScanNFC({
  Duration timeout = Duration(seconds: 10),
  bool requireStudent = false,
  bool requireTeacher = false,
})
```

**扫描步骤**:
1. **防重复扫描** - 检查是否正在扫描中，避免重复操作
2. **NFC可用性检查** - 验证设备NFC功能是否可用
3. **开始扫描** - 使用`FlutterNfcKit.poll()`扫描NFC标签
4. **读取标签ID** - 直接使用`tag.id`作为NFC数据
5. **匹配用户** - 根据扫描到的数据查找对应的学生或教师

### 2. 用户匹配机制

**学生匹配** (`_findStudent`):
```dart
// 通过NFC标签ID查找学生
final student = await PocketBaseService.instance.getStudentByNfcId(nfcData);
```

**教师匹配** (`_findTeacher`):
```dart
// 支持多种格式的NFC数据匹配
List<String> nfcVariants = [
  nfcData,                    // 原始格式
  nfcData.toUpperCase(),      // 大写
  nfcData.toLowerCase(),      // 小写
  nfcData.replaceAll(':', ''), // 去除冒号
  // ... 更多格式变体
];
```

### 3. 数据库字段映射

**学生表** (`students`):
- `nfc_tag_id` - NFC标签ID
- `nfc_url` - NFC标识符（URL格式）
- `cardNumber` - 卡片编号

**教师表** (`teachers`):
- `nfc_tag_id` - NFC标签ID
- `card_id` - 卡片ID
- `nfc_card_number` - NFC卡片编号

### 4. 考勤应用流程

**考勤扫描**:
1. **启动扫描** - 用户点击扫描按钮
2. **NFC扫描** - 扫描NFC标签获取ID
3. **用户匹配** - 查找对应的学生或教师
4. **显示对话框** - 选择考勤类型（签到/签退）
5. **记录考勤** - 保存考勤记录到数据库

## ⚙️ 技术特点

### 安全性
- ✅ 防重复扫描机制
- ✅ 扫描间隔限制（3秒）
- ✅ 错误处理和异常捕获

### 兼容性
- ✅ 支持多种NFC标签格式
- ✅ 自动格式转换和标准化
- ✅ 容错匹配机制

### 性能
- ✅ 缓存机制减少数据库查询
- ✅ 异步操作避免UI阻塞
- ✅ 超时控制防止长时间等待

## 🔧 配置和管理

### NFC管理界面
- 扫描NFC卡查看拥有者信息
- 支持学生和教师的NFC配置
- 卡片状态管理（激活/未激活/锁定/丢失）

### 统一字段映射
- `UnifiedFieldMapper`提供统一的NFC数据格式
- 支持不同集合类型的字段映射
- NFC使用统计和追踪

## 💡 优势

### 简化设计
- ✅ **无需写入** - 直接使用NFC卡的硬件ID
- ✅ **更可靠** - 硬件ID不会丢失或损坏
- ✅ **更简单** - 减少了复杂的NDEF写入逻辑
- ✅ **更快速** - 直接读取标签ID，无需解析NDEF数据

### 维护性
- ✅ **易于管理** - 只需在数据库中关联NFC ID和用户
- ✅ **易于调试** - 问题更容易定位和解决
- ✅ **易于扩展** - 可以轻松添加新的匹配策略

## 🚫 已废弃的功能

### NFC写入服务
~~**写入服务** (`NFCWriteService`)~~ - 已删除
~~**写入步骤**~~:
- ~~检查NFC可用性~~
- ~~扫描NFC卡~~
- ~~验证NDEF支持~~
- ~~生成随机字符串 - studentId_randomString~~
- ~~写入NDEF记录 - 使用writeNDEFRawRecords()~~

## 📋 使用示例

### 考勤扫描
```dart
// 扫描NFC进行考勤
final result = await NFCSafeScannerService.instance.safeScanNFC(
  requireStudent: true,
  timeout: Duration(seconds: 10),
);

if (result.isSuccess) {
  final student = result.student;
  // 显示考勤对话框
  _showAttendanceDialog(student);
}
```

### NFC管理
```dart
// 扫描NFC查看拥有者
final result = await NFCSafeScannerService.instance.safeScanNFC();

if (result.isSuccess) {
  if (result.student != null) {
    print('学生: ${result.student!.getStringValue('student_name')}');
  } else if (result.teacher != null) {
    print('教师: ${result.teacher!.getStringValue('teacher_name')}');
  }
}
```

## 🔍 故障排除

### 常见问题
1. **NFC不可用** - 检查设备NFC设置
2. **扫描超时** - 确保NFC标签靠近设备
3. **用户未找到** - 检查数据库中的NFC字段配置
4. **重复扫描** - 等待3秒后重试

### 调试信息
- 扫描日志记录在控制台
- NFC数据格式自动标准化
- 错误信息详细记录

---

**最后更新**: 2024年12月
**版本**: 简化版NFC系统
