# PocketBase Users 集合 API 规则设置

## 当前设置问题
当前所有规则都使用 `@request.auth.id != ""`，这只检查用户是否已认证，但没有检查用户角色。

## 建议的API规则设置

### 1. List/Search 规则
```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.type = "admin")
```
**说明**: 只有管理员可以查看用户列表

### 2. View 规则  
```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.type = "admin")
```
**说明**: 只有管理员可以查看单个用户详情

### 3. Create 规则
```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.type = "admin")
```
**说明**: 只有管理员可以创建新用户

### 4. Update 规则
```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.type = "admin")
```
**说明**: 只有管理员可以更新用户信息

### 5. Delete 规则
```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.type = "admin")
```
**说明**: 只有管理员可以删除用户

## 替代方案（如果角色字段不同）

如果用户集合中的角色字段不是 `role` 或 `type`，请检查实际字段名：

### 检查用户集合字段
1. 在PocketBase管理面板中，点击 "users" 集合
2. 查看 "Fields" 标签页
3. 找到角色相关的字段（可能是 `role`, `type`, `user_type`, `permissions` 等）

### 根据实际字段调整规则
例如，如果角色字段是 `user_type`：
```
@request.auth.id != "" && @request.auth.user_type = "admin"
```

## 测试建议

1. **先测试当前设置**: 看看是否能正常工作
2. **如果不行**: 按照上述建议修改API规则
3. **检查用户数据**: 确认管理员用户的角色字段值

## 调试步骤

1. 在浏览器控制台查看用户信息：
   ```javascript
   console.log('当前用户:', pb.authStore.model)
   ```

2. 检查用户角色字段的实际值

3. 根据实际字段值调整API规则
