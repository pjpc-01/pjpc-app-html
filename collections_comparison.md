# 📊 学生与教师集合对比分析

此文档对比分析了学生集合 (students) 和教师集合 (teachers) 的字段结构，帮助理解两个集合的异同点。

## 🏷️ 集合基本信息对比

| 项目 | 学生集合 (students) | 教师集合 (teachers) |
|------|-------------------|-------------------|
| **名称** | `students` | `teachers` |
| **类型** | `Base` | `Base` |
| **总字段数** | 49个字段 | 36个字段 |
| **必填字段** | 5个 | 2个 |

## 📋 字段分类对比

### 👤 基本信息字段
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| `id` | ✅ Text | ✅ Text (必填) | 唯一标识符 |
| `name` | ✅ `student_name` (必填) | ✅ `name` (必填) | 姓名 |
| `email` | ✅ Text | ✅ Email | 邮箱 |
| `phone` | ✅ Text | ✅ Text | 电话 |
| `address` | ✅ Text | ✅ Text | 地址 |
| `nric` | ✅ Text | ✅ Text | 身份证号 |

### 🏢 工作/学习信息
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| **学习信息** | `standard` (年级) | ❌ 无 | 学生特有 |
| **工作信息** | ❌ 无 | `department`, `position` | 教师特有 |
| **中心/部门** | `center` (中心) | `department` (部门) | 类似概念 |
| **入职/入学** | `enrollmentDate` | `hireDate` | 时间记录 |

### 👨‍👩‍👧‍👦 家庭信息
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| **家长信息** | `parents_name`, `parents_phone` | ❌ 无 | 学生特有 |
| **婚姻状况** | ❌ 无 | `maritalStatus` | 教师特有 |
| **子女数量** | ❌ 无 | `childrenCount` | 教师特有 |
| **紧急联系人** | `emergencyContactName` | ❌ 无 | 学生特有 |

### 💰 财务信息
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| **余额** | `balance` | ❌ 无 | 学生特有 |
| **薪资信息** | ❌ 无 | `epfNo`, `socsoNo` | 教师特有 |
| **银行信息** | ❌ 无 | `bankName`, `bankAccountNo` | 教师特有 |

### 💳 NFC卡相关
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| **卡号** | `cardNumber` | `nfc_card_number` | 卡号标识 |
| **卡类型** | `cardType` (NFC/RFID) | ❌ 无 | 学生特有 |
| **卡状态** | `cardStatus` | ❌ 无 | 学生特有 |
| **发卡日期** | `issuedDate` | `nfc_card_issued_date` | 发卡时间 |
| **过期日期** | `expiryDate` | `nfc_card_expiry_date` | 过期时间 |

### 🔐 权限和安全
| 字段 | 学生集合 | 教师集合 | 说明 |
|------|---------|---------|------|
| **权限管理** | ❌ 无 | `permissions` | 教师特有 |
| **状态** | `status` (active/graduated) | `status` (active/inactive) | 不同可选值 |
| **安全状态** | `security_status` | `security_status` | 相同字段 |
| **加密字段** | 多个加密字段 | 多个加密字段 | 需要清理 |

## 🔍 字段差异分析

### 学生集合独有字段
1. **学习相关**
   - `standard` (年级)
   - `center` (中心)
   - `level` (Primary/Secondary)
   - `school` (学校)

2. **家长和接送**
   - `parents_name`, `parents_phone`
   - `pickupMethod`
   - `authorizedPickup1Name` 等

3. **文件和文档**
   - `photo` (照片)
   - `birthCert` (出生证明)

4. **NFC管理**
   - `cardType` (卡类型)
   - `cardStatus` (卡状态)

### 教师集合独有字段
1. **工作相关**
   - `department` (部门)
   - `position` (职位)
   - `hireDate` (入职日期)

2. **个人生活**
   - `maritalStatus` (婚姻状况)
   - `childrenCount` (子女数量)

3. **薪资管理**
   - `epfNo` (EPF号码)
   - `socsoNo` (SOCSO号码)
   - `bankName`, `bankAccountNo` (银行信息)

4. **权限管理**
   - `permissions` (normal_teacher/senior_teacher)

## 🔄 NFC关联功能对比

### 当前NFC字段
| 功能 | 学生集合 | 教师集合 |
|------|---------|---------|
| **NFC卡号** | `cardNumber` | `nfc_card_number` |
| **发卡日期** | `issuedDate` | `nfc_card_issued_date` |
| **过期日期** | `expiryDate` | `nfc_card_expiry_date` |
| **使用统计** | `last_swipe_time`, `swipe_count_today` | `last_swipe_time`, `swipe_count_today` |

### 建议统一NFC字段
```dart
// 建议为两个集合添加的统一字段
{
  'nfc_tag_id': 'NFC标签ID (用于关联)',
  'nfc_associated_at': 'NFC关联时间',
  'nfc_last_used': 'NFC最后使用时间',
  'nfc_usage_count': 'NFC使用次数'
}
```

## ⚠️ 需要关注的问题

### 1. 字段命名不一致
- 学生: `student_name` vs 教师: `name`
- 学生: `cardNumber` vs 教师: `nfc_card_number`
- 学生: `issuedDate` vs 教师: `nfc_card_issued_date`

### 2. 安全字段过多
两个集合都包含大量安全相关字段，根据您之前的要求需要清理：
- `encrypted_uid`
- `encryption_key_version`
- `encryption_salt`
- `verification_level`
- `encryption_algorithm`
- `key_rotation_date`
- `suspicious_activities`
- `risk_score`

### 3. 必填字段差异
- **学生集合:** 5个必填字段
- **教师集合:** 2个必填字段

## 🔧 优化建议

### 1. 字段标准化
```dart
// 建议统一字段命名
{
  'name': '姓名 (统一使用name)',
  'nfc_card_number': 'NFC卡号 (统一命名)',
  'nfc_issued_date': 'NFC发卡日期 (统一命名)',
  'nfc_expiry_date': 'NFC过期日期 (统一命名)'
}
```

### 2. NFC关联字段统一
```dart
// 为两个集合添加相同的NFC关联字段
{
  'nfc_tag_id': 'NFC标签ID',
  'nfc_associated_at': 'NFC关联时间',
  'nfc_last_used': 'NFC最后使用时间',
  'nfc_usage_count': 'NFC使用次数'
}
```

### 3. 安全字段清理
根据您之前的要求，建议移除或简化以下字段：
- 所有加密相关字段
- 安全状态字段
- 风险评分字段
- 可疑活动字段

### 4. 数据验证加强
- 统一必填字段标准
- 加强邮箱格式验证
- 加强电话号码格式验证
- 加强日期格式验证

## 📈 功能扩展建议

### 1. 学生集合增强
- 添加基础权限管理
- 添加家长联系方式验证
- 添加学习进度跟踪

### 2. 教师集合增强
- 添加教学科目管理
- 添加工作表现评估
- 添加培训记录

### 3. 通用功能
- 统一NFC管理界面
- 统一数据导出功能
- 统一搜索和筛选功能

---

**文档生成时间:** ${DateTime.now().toString().substring(0, 19)}
**版本:** 1.0
**基于:** 实际集合字段分析
