# 排班系统设置指南

## 🚀 快速开始

### 1. 导入集合到PocketBase

#### 方法一：通过管理界面
1. 打开PocketBase管理界面: `http://your-pb-instance:8090/_/`
2. 登录管理员账户
3. 进入 **Collections** 页面
4. 点击 **Import collections** 按钮
5. 依次导入以下文件：
   - `pocketbase_collections/schedules.json`
   - `pocketbase_collections/schedule_templates.json`
   - `pocketbase_collections/schedule_logs.json`
   - `pocketbase_collections/classes.json`

#### 方法二：通过命令行
```bash
# 在项目根目录执行
cd pocketbase_collections
pb import collections schedules.json
pb import collections schedule_templates.json
pb import collections schedule_logs.json
pb import collections classes.json
```

### 2. 验证集合导入

检查集合是否成功创建：
- 在PocketBase管理界面查看Collections列表
- 确认以下集合存在：
  - `schedules` - 排班记录
  - `schedule_templates` - 排班模板
  - `schedule_logs` - 操作日志
  - `classes` - 课程信息

### 3. 运行API兼容性检查

```bash
# 安装依赖（如果还没有）
npm install pocketbase

# 运行兼容性检查
node scripts/check-api-compatibility.js
```

### 4. 测试API功能

```bash
# 运行API测试
node scripts/test-schedule-api.js
```

### 5. 初始化默认数据

```bash
# 创建默认排班模板和课程
node scripts/init-schedule-data.js
```

## 🔧 配置说明

### 权限设置
所有集合的权限规则已设置为 `@request.auth.id != ""`，这意味着：
- 任何已认证的用户都可以查看、创建、更新、删除记录
- 日志记录只能创建，不能更新（符合审计要求）

### 数据库索引
已为以下字段创建索引以优化查询性能：
- `schedules`: employee_id+date, date, center, status
- `schedule_templates`: type, is_active
- `classes`: subject, grade, center, status, is_active
- `schedule_logs`: schedule_id, user_id, action, created

## 📋 验证清单

### ✅ 集合导入检查
- [ ] schedules 集合已创建
- [ ] schedule_templates 集合已创建
- [ ] schedule_logs 集合已创建
- [ ] classes 集合已创建

### ✅ 权限设置检查
- [ ] 所有集合权限规则为 `@request.auth.id != ""`
- [ ] schedule_logs 的 updateRule 为 `false`
- [ ] 可以正常创建、读取、更新、删除记录

### ✅ API功能检查
- [ ] 排班记录CRUD操作正常
- [ ] 排班模板CRUD操作正常
- [ ] 课程信息CRUD操作正常
- [ ] 操作日志记录正常

### ✅ 数据初始化检查
- [ ] 默认排班模板已创建
- [ ] 默认课程数据已创建
- [ ] 数据格式正确

## 🚨 常见问题

### 问题1：集合导入失败
**解决方案**：
- 检查JSON文件格式是否正确
- 确认PocketBase服务正在运行
- 检查管理员权限

### 问题2：API测试失败
**解决方案**：
- 检查PocketBase连接配置
- 确认集合已正确导入
- 检查权限设置

### 问题3：字段类型不匹配
**解决方案**：
- 运行兼容性检查脚本
- 根据报告调整字段类型
- 重新导入集合

## 📞 技术支持

如果遇到问题，请：
1. 查看控制台错误信息
2. 运行诊断脚本
3. 检查PocketBase日志
4. 联系技术支持

## 🎯 下一步

集合导入和测试完成后，您可以：
1. 访问排班管理界面：`http://localhost:3000/schedule-management`
2. 开始创建排班记录
3. 配置排班模板
4. 管理课程信息
5. 查看操作日志

---

**注意**：请确保在生产环境中使用前，根据实际需求调整权限规则和安全设置。
