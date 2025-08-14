# PocketBase 设置指南

## 1. 访问管理界面

- URL: `http://pjpc.tplinkdns.com:8090/_/`
- 邮箱: `pjpcemerlang@gmail.com`
- 密码: `0122270775Sw!`

## 2. 创建 users 集合

### 2.1 基本设置
1. 点击左侧菜单 "Collections"
2. 点击 "New collection"
3. 填写信息：
   - **Name**: `users`
   - **Type**: `Auth` (重要！)
   - **System**: 取消勾选

### 2.2 添加字段

| 字段名 | 类型 | 必填 | 默认值 | 选项 |
|--------|------|------|--------|------|
| name | Text | ✅ | - | - |
| role | Select | ✅ | - | admin, teacher, parent, accountant |
| status | Select | ✅ | - | pending, approved, suspended |
| loginAttempts | Number | ❌ | 0 | - |
| lockedUntil | Date | ❌ | - | - |
| approvedBy | Relation | ❌ | - | 关联到 users 集合 |
| approvedAt | Date | ❌ | - | - |

### 2.3 字段详细配置

#### name 字段
- Type: Text
- Required: ✅
- Max length: 100

#### role 字段
- Type: Select
- Required: ✅
- Options: `admin`, `teacher`, `parent`, `accountant`

#### status 字段
- Type: Select
- Required: ✅
- Options: `pending`, `approved`, `suspended`

#### loginAttempts 字段
- Type: Number
- Required: ❌
- Default: 0

#### lockedUntil 字段
- Type: Date
- Required: ❌

#### approvedBy 字段
- Type: Relation
- Required: ❌
- Collection: users
- Max select: 1

#### approvedAt 字段
- Type: Date
- Required: ❌

## 3. 配置权限

在 users 集合的 "API rules" 标签页中设置：

### 3.1 基本权限
- **List records**: `@request.auth.id != ""`
- **View single record**: `@request.auth.id != ""`
- **Create records**: `@request.auth.id != ""`
- **Update records**: `@request.auth.id != ""`
- **Delete records**: `@request.auth.id != ""`

### 3.2 认证权限
- **Auth options**: 启用所有选项
- **Manage rule**: `id = @request.auth.id`

## 4. 创建管理员用户

1. 在 users 集合中点击 "New record"
2. 填写信息：
   - **Email**: `admin@example.com`
   - **Password**: `AdminPassword123!`
   - **Password confirm**: `AdminPassword123!`
   - **Name**: `系统管理员`
   - **Role**: `admin`
   - **Status**: `approved`
3. 点击 "Create"

## 5. 创建 notifications 集合

### 5.1 基本设置
- **Name**: `notifications`
- **Type**: `Base`
- **System**: 取消勾选

### 5.2 添加字段

| 字段名 | 类型 | 必填 | 默认值 |
|--------|------|------|--------|
| type | Text | ✅ | - |
| userId | Text | ✅ | - |
| userName | Text | ❌ | - |
| userEmail | Text | ❌ | - |
| userRole | Text | ❌ | - |
| read | Bool | ❌ | false |

## 6. 测试设置

完成设置后，可以测试：

1. 访问 `http://localhost:3000`
2. 使用管理员账号登录
3. 检查是否能正常访问系统

## 7. 常见问题

### 问题1: "Missing or invalid auth collection context"
**解决方案**: 确保 users 集合的类型设置为 "Auth"

### 问题2: "Only superusers can perform this action"
**解决方案**: 确保已创建 users 集合并配置了正确的权限

### 问题3: 登录失败
**解决方案**: 检查用户状态是否为 "approved"
