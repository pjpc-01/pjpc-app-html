# PocketBase Students 集合配置说明

## 概述

由于删除了 `students_card` 集合，现在所有学生数据都统一存储在 `students` 集合中。本文档说明如何正确配置 `students` 集合以支持所有功能。

## 集合名称

**集合名称**: `students`

## 字段配置

### 基本信息字段

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `student_id` | Text | ✅ | 学号（唯一） |
| `student_name` | Text | ✅ | 学生姓名 |
| `dob` | Date | ❌ | 出生日期 |
| `father_phone` | Text | ❌ | 父亲电话 |
| `mother_phone` | Text | ❌ | 母亲电话 |
| `home_address` | Text | ❌ | 家庭地址 |
| `gender` | Select | ❌ | 性别 (male/female) |
| `serviceType` | Select | ❌ | 服务类型 (afterschool/tuition) |
| `register_form_url` | Text | ❌ | 注册表单URL |
| `standard` | Text | ❌ | 年级 |
| `level` | Select | ❌ | 教育级别 (primary/secondary) |
| `center` | Select | ❌ | 所属中心 (WX 01/WX 02/WX 03/WX 04) |

### 扩展信息字段

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `nric` | Text | ❌ | NRIC/护照号码 |
| `school` | Text | ❌ | 学校名称 |
| `parentPhone` | Text | ❌ | 家长电话 |
| `emergencyContact` | Text | ❌ | 紧急联络人 |
| `emergencyPhone` | Text | ❌ | 紧急联络电话 |
| `healthInfo` | Text | ❌ | 健康信息 |
| `pickupMethod` | Select | ❌ | 接送方式 (parent/guardian/authorized/public/walking) |

### 接送安排字段

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `authorizedPickup1Name` | Text | ❌ | 授权接送人1姓名 |
| `authorizedPickup1Phone` | Text | ❌ | 授权接送人1电话 |
| `authorizedPickup1Relation` | Text | ❌ | 授权接送人1关系 |
| `authorizedPickup2Name` | Text | ❌ | 授权接送人2姓名 |
| `authorizedPickup2Phone` | Text | ❌ | 授权接送人2电话 |
| `authorizedPickup2Relation` | Text | ❌ | 授权接送人2关系 |
| `authorizedPickup3Name` | Text | ❌ | 授权接送人3姓名 |
| `authorizedPickup3Phone` | Text | ❌ | 授权接送人3电话 |
| `authorizedPickup3Relation` | Text | ❌ | 授权接送人3关系 |

### 注册和费用信息字段

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `registrationDate` | Date | ❌ | 注册日期 |
| `tuitionStatus` | Select | ❌ | 学费状态 (pending/paid/partial/overdue) |
| `birthCert` | File | ❌ | 出生证明文件 |
| `photo` | File | ❌ | 学生照片 |

### 考勤相关字段（新增）

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `cardNumber` | Text | ❌ | 卡号 |
| `cardType` | Select | ❌ | 卡类型 (NFC/RFID) |
| `studentUrl` | Text | ❌ | 学生专属URL（用于考勤） |
| `balance` | Number | ❌ | 余额 |
| `status` | Select | ❌ | 状态 (active/inactive/lost/graduated) |
| `issuedDate` | Date | ❌ | 发卡日期 |
| `expiryDate` | Date | ❌ | 过期日期 |
| `enrollmentDate` | Date | ❌ | 入学日期 |
| `phone` | Text | ❌ | 学生电话 |
| `email` | Text | ❌ | 学生邮箱 |
| `parentName` | Text | ❌ | 家长姓名 |
| `address` | Text | ❌ | 地址 |
| `medicalInfo` | Text | ❌ | 医疗信息 |
| `notes` | Text | ❌ | 备注 |
| `usageCount` | Number | ❌ | 使用次数 |
| `lastUsed` | Date | ❌ | 最后使用时间 |

### 系统字段

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `created` | DateTime | ✅ | 创建时间（自动） |
| `updated` | DateTime | ✅ | 更新时间（自动） |

## 字段配置步骤

### 1. 创建集合

1. 在PocketBase管理界面中，点击"Collections"
2. 点击"New collection"
3. 输入集合名称：`students`
4. 选择类型：`Base`

### 2. 添加字段

#### 基本信息字段
```json
{
  "student_id": {
    "type": "text",
    "required": true,
    "unique": true
  },
  "student_name": {
    "type": "text",
    "required": true
  },
  "center": {
    "type": "select",
    "options": ["WX 01", "WX 02", "WX 03", "WX 04"]
  },
  "serviceType": {
    "type": "select",
    "options": ["afterschool", "tuition"]
  },
  "level": {
    "type": "select",
    "options": ["primary", "secondary"]
  }
}
```

#### 考勤相关字段
```json
{
  "studentUrl": {
    "type": "text",
    "unique": true
  },
  "status": {
    "type": "select",
    "options": ["active", "inactive", "lost", "graduated"],
    "default": "active"
  },
  "cardType": {
    "type": "select",
    "options": ["NFC", "RFID"]
  }
}
```

### 3. 设置验证规则

#### student_id 验证
- 类型：Text
- 必填：✅
- 唯一：✅
- 最小长度：1
- 最大长度：50

#### student_name 验证
- 类型：Text
- 必填：✅
- 最小长度：1
- 最大长度：100

#### studentUrl 验证
- 类型：Text
- 必填：❌
- 唯一：✅
- 格式：URL格式验证

### 4. 设置索引

为了提高查询性能，建议为以下字段创建索引：

1. `student_id` - 唯一索引
2. `student_name` - 普通索引
3. `center` - 普通索引
4. `status` - 普通索引
5. `studentUrl` - 唯一索引

## 数据迁移

### 从 students_card 迁移数据

如果你需要将 `students_card` 集合中的数据迁移到 `students` 集合，可以：

1. 导出 `students_card` 数据为JSON
2. 在 `students` 集合中创建对应的记录
3. 确保 `studentUrl` 字段正确设置

### 示例迁移脚本

```javascript
// 在PocketBase管理界面的控制台中执行
const studentsCard = await pb.collection('students_card').getList(1, 1000)
const students = await pb.collection('students').getList(1, 1000)

for (const card of studentsCard.items) {
  // 查找对应的学生记录
  const student = students.items.find(s => 
    s.student_name === card.studentName || 
    s.student_id === card.studentId
  )
  
  if (student) {
    // 更新学生记录，添加考勤相关字段
    await pb.collection('students').update(student.id, {
      cardNumber: card.cardNumber,
      cardType: card.cardType,
      studentUrl: card.studentUrl,
      balance: card.balance,
      status: card.status,
      issuedDate: card.issuedDate,
      expiryDate: card.expiryDate,
      enrollmentDate: card.enrollmentDate,
      phone: card.phone,
      email: card.email,
      parentName: card.parentName,
      address: card.address,
      medicalInfo: card.medicalInfo,
      notes: card.notes,
      usageCount: card.usageCount || 0,
      lastUsed: card.lastUsed
    })
  }
}
```

## 注意事项

1. **字段名称**: 确保字段名称与代码中的接口定义完全一致
2. **数据类型**: 注意字段类型，特别是日期和数字字段
3. **必填字段**: 至少设置 `student_id` 和 `student_name` 为必填
4. **唯一性**: `student_id` 和 `studentUrl` 应该设置为唯一
5. **默认值**: 为 `status` 字段设置默认值 `active`

## 测试

配置完成后，建议：

1. 创建几个测试学生记录
2. 测试URL考勤功能
3. 验证所有字段都能正确显示和编辑
4. 检查搜索和过滤功能是否正常

## 联系支持

如果在配置过程中遇到问题，请联系系统管理员或查看PocketBase官方文档。
