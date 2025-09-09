# WiFi网络管理设置指南

## 概述
WiFi网络管理功能允许管理员动态配置教师打卡时允许的WiFi网络，无需修改代码即可更新WiFi SSID。

## PocketBase集合配置

### 创建 `wifi_networks` 集合

在PocketBase管理界面中创建名为 `wifi_networks` 的集合，包含以下字段：

#### 字段配置

| 字段名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `network_name` | Text | ✅ | - | WiFi网络名称（支持部分匹配） |
| `description` | Text | ❌ | - | 网络描述 |
| `center_id` | Text | ❌ | - | 关联的中心ID |
| `is_active` | Bool | ✅ | true | 是否启用此网络 |
| `created` | DateTime | ✅ | now() | 创建时间 |
| `updated` | DateTime | ✅ | now() | 更新时间 |

#### 字段详细说明

1. **network_name**: 
   - 支持部分匹配，例如输入"PJPC"可以匹配"PJPC-WiFi"、"PJPC-Office"等
   - 建议使用简洁的网络名称标识符

2. **description**:
   - 可选字段，用于描述网络用途
   - 例如："主办公室WiFi"、"教师专用网络"

3. **center_id**:
   - 可选字段，用于关联特定中心
   - 例如："wx01"、"wx02"

4. **is_active**:
   - 控制网络是否在验证中使用
   - 可以临时禁用某个网络而不删除

## 使用说明

### 管理员操作

1. **访问WiFi管理页面**：
   ```
   http://localhost:3001/admin/wifi-networks
   ```

2. **添加WiFi网络**：
   - 点击"添加WiFi网络"按钮
   - 输入网络名称（支持部分匹配）
   - 可选填写描述和关联中心
   - 选择是否启用

3. **编辑网络**：
   - 点击网络列表中的编辑按钮
   - 修改网络配置
   - 保存更改

4. **删除网络**：
   - 点击删除按钮
   - 确认删除操作

### 教师打卡流程

1. **访问教师打卡页面**：
   ```
   http://localhost:3002/teacher-checkin?center=wx01
   ```

2. **WiFi验证**：
   - 系统自动检查当前WiFi网络
   - 与配置的允许网络列表对比
   - 显示验证结果

3. **打卡操作**：
   - 只有WiFi验证通过才能进行打卡
   - 记录WiFi网络信息到考勤记录

## 网络匹配规则

### 支持的模式

1. **完全匹配**：
   - 网络名称完全一致

2. **部分匹配**：
   - 配置的网络名称包含在检测到的网络中
   - 检测到的网络包含配置的网络名称

3. **大小写不敏感**：
   - 自动转换为小写进行比较

### 示例

| 配置的网络名称 | 匹配的网络 | 结果 |
|----------------|------------|------|
| "PJPC" | "PJPC-WiFi" | ✅ 匹配 |
| "PJPC" | "pjpc-office" | ✅ 匹配 |
| "Office" | "PJPC-Office" | ✅ 匹配 |
| "Home" | "PJPC-WiFi" | ❌ 不匹配 |

## 安全特性

1. **网络验证**：
   - 防止教师在家或其他地方远程打卡
   - 确保打卡操作在指定网络环境下进行

2. **审计记录**：
   - 记录打卡时的WiFi网络信息
   - 包含网络名称、验证状态等

3. **动态配置**：
   - 管理员可以随时更新允许的网络列表
   - 无需重启服务或修改代码

## 故障排除

### 常见问题

1. **无法验证WiFi**：
   - 检查是否在HTTPS环境下
   - 确认网络名称配置正确
   - 检查网络是否已启用

2. **网络检测失败**：
   - 浏览器安全限制可能影响网络信息获取
   - 系统会使用备用验证方法
   - 检查网络连接状态

3. **配置不生效**：
   - 确认网络配置已保存
   - 检查网络是否启用
   - 刷新页面重新验证

### 调试信息

系统会在控制台输出详细的调试信息，包括：
- 检测到的网络信息
- 配置的网络列表
- 匹配结果
- 错误信息

## 技术实现

### API端点

- `GET /api/wifi-networks` - 获取网络列表
- `POST /api/wifi-networks` - 创建/更新网络
- `DELETE /api/wifi-networks?id=xxx` - 删除网络

### 数据库结构

```sql
-- wifi_networks 集合
{
  "id": "string",
  "network_name": "string",
  "description": "string", 
  "center_id": "string",
  "is_active": "boolean",
  "created": "datetime",
  "updated": "datetime"
}
```

### 前端组件

- `WiFiNetworkManager` - 管理员界面
- `WiFiVerification` - 验证组件
- `TeacherCheckinPage` - 教师打卡页面集成
