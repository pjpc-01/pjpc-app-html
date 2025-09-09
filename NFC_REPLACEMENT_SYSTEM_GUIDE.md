# NFC卡补办申请系统设置指南

## 概述
NFC卡补办申请系统允许教师为学生申请NFC卡补办，管理员可以审核和管理这些申请。

## PocketBase集合配置

### 创建 `nfc_cards` 集合

在PocketBase管理界面中创建名为 `nfc_cards` 的集合，包含以下字段：

#### 字段配置

| 字段名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `id` | Text | ✅ | - | 记录ID（自动生成） |
| `student_id` | Relation | ✅ | - | 关联学生记录 |
| `teacher_id` | Text | ✅ | - | 申请教师ID |
| `card_status` | Select | ✅ | - | 卡片状态（lost/damaged/replace） |
| `replacement_reason` | Text | ✅ | - | 补办原因 |
| `replacement_lost_date` | Date | ❌ | - | 丢失日期 |
| `replacement_lost_location` | Text | ❌ | - | 丢失地点 |
| `replacement_urgency` | Select | ✅ | normal | 紧急程度（low/normal/high/urgent） |
| `replacement_status` | Select | ✅ | pending | 申请状态（pending/approved/rejected/completed） |
| `replacement_request_date` | Date | ✅ | now() | 申请日期 |
| `replacement_notes` | Text | ❌ | - | 备注信息 |
| `approved_by` | Text | ❌ | - | 审核人ID |
| `created` | DateTime | ✅ | now() | 创建时间 |
| `updated` | DateTime | ✅ | now() | 更新时间 |

#### 字段详细说明

1. **student_id**: 
   - 类型：Relation
   - 关联到：students 集合
   - 必需字段，用于关联学生记录

2. **card_status**:
   - 类型：Select
   - 选项：lost（丢失）、damaged（损坏）、replace（更换）
   - 用于标识NFC卡的状态

3. **replacement_urgency**:
   - 类型：Select
   - 选项：low（低）、normal（普通）、high（高）、urgent（紧急）
   - 用于标识申请的紧急程度

4. **replacement_status**:
   - 类型：Select
   - 选项：pending（待审核）、approved（已批准）、rejected（已拒绝）、completed（已完成）
   - 用于跟踪申请的处理状态

## 使用说明

### 教师操作

1. **访问补办申请页面**：
   ```
   http://localhost:3001/teacher/nfc-replacement
   ```

2. **提交补办申请**：
   - 选择需要补办NFC卡的学生
   - 选择卡片状态（丢失/损坏/更换）
   - 填写详细的补办原因
   - 可选填写丢失日期和地点
   - 选择紧急程度
   - 添加备注信息
   - 提交申请

3. **查看申请状态**：
   - 在申请记录区域查看已提交的申请
   - 实时查看申请状态更新

### 管理员操作

1. **访问审核页面**：
   ```
   http://localhost:3001/admin/nfc-approval
   ```

2. **筛选和搜索**：
   - 按申请状态筛选
   - 按紧急程度筛选
   - 搜索学生姓名、学号或教师姓名

3. **审核申请**：
   - 查看申请详细信息
   - 添加审核备注
   - 批准或拒绝申请
   - 更新申请状态

## API接口

### 获取申请列表
```
GET /api/nfc-cards
GET /api/nfc-cards?status=pending
GET /api/nfc-cards?teacher_id=xxx
GET /api/nfc-cards?student_id=xxx
```

### 创建申请
```
POST /api/nfc-cards
Content-Type: application/json

{
  "studentId": "student_id",
  "teacherId": "teacher_id",
  "cardStatus": "lost",
  "replacementReason": "学生在学校丢失了NFC卡",
  "lostDate": "2024-01-15",
  "lostLocation": "教室",
  "urgency": "normal",
  "notes": "学生需要尽快补办"
}
```

### 更新申请状态
```
PUT /api/nfc-cards
Content-Type: application/json

{
  "id": "request_id",
  "replacementStatus": "approved",
  "replacementNotes": "已批准补办",
  "approvedBy": "admin_id"
}
```

### 删除申请
```
DELETE /api/nfc-cards?id=request_id
```

## 工作流程

### 1. 申请流程
```
教师发现学生NFC卡问题 → 填写补办申请 → 提交申请 → 等待审核
```

### 2. 审核流程
```
管理员收到申请 → 查看申请详情 → 审核申请 → 批准/拒绝 → 通知教师
```

### 3. 状态流转
```
pending（待审核） → approved（已批准） → completed（已完成）
                ↘ rejected（已拒绝）
```

## 功能特性

### 1. 教师功能
- **便捷申请**：快速填写补办申请表单
- **状态跟踪**：实时查看申请处理状态
- **历史记录**：查看所有提交的申请记录
- **详细信息**：支持添加丢失日期、地点等详细信息

### 2. 管理员功能
- **批量管理**：查看和管理所有补办申请
- **智能筛选**：按状态、紧急程度、学生等条件筛选
- **快速搜索**：支持学生姓名、学号、教师姓名搜索
- **审核功能**：详细的审核界面和备注功能
- **状态管理**：灵活更新申请状态

### 3. 系统特性
- **权限控制**：基于角色的访问控制
- **数据验证**：完整的表单验证和错误处理
- **实时更新**：状态变更实时反映
- **审计记录**：完整的操作日志记录

## 安全特性

1. **身份验证**：
   - 教师需要登录才能提交申请
   - 管理员需要管理员权限才能审核

2. **数据验证**：
   - 前端和后端双重验证
   - 必需字段检查
   - 数据格式验证

3. **权限控制**：
   - 教师只能查看自己的申请
   - 管理员可以查看所有申请
   - 基于角色的功能访问

## 故障排除

### 常见问题

1. **申请提交失败**：
   - 检查所有必需字段是否填写
   - 确认学生和教师信息正确
   - 检查网络连接

2. **审核功能异常**：
   - 确认管理员权限
   - 检查申请状态是否正确
   - 验证审核备注内容

3. **数据加载失败**：
   - 检查API接口状态
   - 确认数据库连接正常
   - 验证集合配置正确

### 调试信息

系统会在控制台输出详细日志：
```javascript
// 申请创建日志
console.log('✅ NFC卡补办申请已创建:', record)

// 状态更新日志
console.log('✅ NFC卡补办申请状态已更新:', record)

// 错误日志
console.error('❌ 创建NFC卡补办申请失败:', error)
```

## 总结

NFC卡补办申请系统提供了：
- **完整的申请流程**：从申请到审核的完整工作流
- **用户友好的界面**：直观的操作界面和状态显示
- **灵活的管理功能**：强大的筛选、搜索和审核功能
- **可靠的数据管理**：完整的数据验证和错误处理

通过这个系统，教师可以方便地为学生申请NFC卡补办，管理员可以高效地审核和管理这些申请，确保学生能够及时获得新的NFC卡。
