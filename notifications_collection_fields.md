# 📢 通知公告集合 (notifications) 字段结构

此文档描述了名为 "notifications" 的数据集合的字段结构，用于教师工作台的通知公告功能。

## 🏷️ 集合基本信息
- **名称 (Name):** `notifications`
- **类型 (Type):** `Base`
- **描述:** 存储系统通知和公告信息

## 📋 字段列表 (Fields)

以下是 "notifications" 集合中定义的各个字段及其属性：

### 🔑 基本信息字段
1. **`id`**
   - **类型:** Text (T)
   - **约束:** 自动生成
   - **描述:** 通知唯一标识符

2. **`title`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 通知标题

3. **`message`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 通知内容/消息

4. **`type`**
   - **类型:** Select (☰)
   - **可选值:** `announcement`, `system`, `urgent`, `info`
   - **选择方式:** Single (单选)
   - **约束:** Nonempty (必填)
   - **描述:** 通知类型

### 👥 用户相关字段
5. **`sender_id`**
   - **类型:** Relation (🔗)
   - **关联集合:** `users`
   - **约束:** Nonempty (必填)
   - **描述:** 发送者用户ID

6. **`recipient_id`**
   - **类型:** Relation (🔗)
   - **关联集合:** `users`
   - **约束:** Nonempty (必填)
   - **描述:** 接收者用户ID

7. **`sender_name`**
   - **类型:** Text (T)
   - **描述:** 发送者姓名（冗余字段，便于显示）

8. **`recipient_name`**
   - **类型:** Text (T)
   - **描述:** 接收者姓名（冗余字段，便于显示）

### 📊 状态字段
9. **`is_read`**
   - **类型:** Bool (☑️)
   - **默认值:** `false`
   - **描述:** 是否已读

10. **`is_important`**
    - **类型:** Bool (☑️)
    - **默认值:** `false`
    - **描述:** 是否重要通知

11. **`priority`**
    - **类型:** Select (☰)
    - **可选值:** `low`, `normal`, `high`, `urgent`
    - **选择方式:** Single (单选)
    - **默认值:** `normal`
    - **描述:** 通知优先级

### 📅 时间字段
12. **`created_at`**
    - **类型:** Date (📅)
    - **约束:** Nonempty (必填)
    - **描述:** 创建时间

13. **`read_at`**
    - **类型:** Date (📅)
    - **描述:** 阅读时间

14. **`expires_at`**
    - **类型:** Date (📅)
    - **描述:** 过期时间（可选）

### 🏢 组织相关字段
15. **`center`**
    - **类型:** Select (☰)
    - **可选值:** `WX 01`, `WX 02`, `WX 03`, `WX 04`, `all`
    - **选择方式:** Single (单选)
    - **默认值:** `all`
    - **描述:** 适用的中心/分校

16. **`department`**
    - **类型:** Select (☰)
    - **可选值:** `primary`, `secondary`, `all`
    - **选择方式:** Single (单选)
    - **默认值:** `all`
    - **描述:** 适用的部门

17. **`role`**
    - **类型:** Select (☰)
    - **可选值:** `admin`, `teacher`, `parent`, `student`, `all`
    - **选择方式:** Single (单选)
    - **默认值:** `all`
    - **描述:** 适用的用户角色

### 📎 附件字段
18. **`attachments`**
    - **类型:** File (📎)
    - **描述:** 附件文件（可选）

19. **`attachment_urls`**
    - **类型:** Text (T)
    - **描述:** 附件URL列表（JSON格式）

### 🔧 系统字段
20. **`created`**
    - **类型:** Date (📅)
    - **约束:** 自动生成
    - **描述:** 系统创建时间

21. **`updated`**
    - **类型:** Date (📅)
    - **约束:** 自动更新
    - **描述:** 系统更新时间

## 📝 使用说明

### 通知类型说明
- **`announcement`**: 公告通知，用于重要信息发布
- **`system`**: 系统通知，用于系统维护、更新等
- **`urgent`**: 紧急通知，需要立即处理
- **`info`**: 一般信息通知

### 权限说明
- **管理员**: 可以创建、查看、编辑、删除所有通知
- **教师**: 只能查看发给自己的通知
- **家长/学生**: 只能查看发给自己的通知

### 过滤规则
- 教师查看通知时，系统会自动过滤 `recipient_id = 当前用户ID` 的通知
- 管理员查看通知时，可以看到所有通知
- 支持按中心、部门、角色进行进一步过滤

## 🚀 测试数据示例

```json
{
  "title": "系统维护通知",
  "message": "系统将于今晚22:00-24:00进行维护，期间可能无法正常使用，请提前保存工作。",
  "type": "system",
  "sender_id": "admin_user_id",
  "recipient_id": "teacher_user_id",
  "sender_name": "系统管理员",
  "recipient_name": "张老师",
  "is_read": false,
  "is_important": true,
  "priority": "high",
  "created_at": "2025-01-14T10:00:00Z",
  "center": "all",
  "department": "all",
  "role": "teacher"
}
```
