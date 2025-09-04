# 本地PocketBase服务器设置指南

## 问题分析

远程服务器 `pjpc.tplinkdns.com:8090` 无法连接，可能的原因：
1. 服务器未运行
2. 端口被防火墙阻止
3. 网络配置问题
4. 服务器配置错误

## 解决方案：本地测试环境

### 步骤1: 下载PocketBase

1. 访问 https://pocketbase.io/docs/
2. 下载适合Windows的版本
3. 解压到项目目录

### 步骤2: 启动本地服务器

```bash
# 在项目根目录运行
pocketbase serve --http=localhost:8090
```

或者双击 `start_local_server.bat` 文件

### 步骤3: 配置数据库

1. 打开浏览器访问 http://localhost:8090/_/
2. 创建管理员账户
3. 创建必要的集合（collections）：
   - `users` - 用户表
   - `students` - 学生表
   - `attendance` - 考勤表
   - `invoices` - 发票表
   - `payments` - 支付表

### 步骤4: 测试连接

1. 运行Flutter应用
2. 在服务器配置中测试 `http://localhost:8090`
3. 确认连接成功

## 集合结构

### users 集合
```json
{
  "id": "string",
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "string", // admin, teacher, parent, accountant
  "status": "string" // active, inactive
}
```

### students 集合
```json
{
  "id": "string",
  "name": "string",
  "grade": "string",
  "gender": "string",
  "phone": "string",
  "points": "number",
  "nfc_card_id": "string"
}
```

### attendance 集合
```json
{
  "id": "string",
  "student": "string", // 学生ID
  "student_name": "string",
  "type": "string", // check_in, check_out
  "nfc_card_id": "string",
  "date": "string",
  "time": "string"
}
```

## 测试数据

### 创建测试用户
1. 在PocketBase管理界面
2. 进入 `users` 集合
3. 创建以下用户：

**管理员**
- email: admin@pjpc.com
- password: admin123
- name: 管理员
- role: admin

**教师**
- email: teacher@pjpc.com
- password: teacher123
- name: 张老师
- role: teacher

**家长**
- email: parent@pjpc.com
- password: parent123
- name: 李家长
- role: parent

## 故障排除

### 如果PocketBase无法启动
1. 检查端口8090是否被占用
2. 尝试其他端口：`pocketbase serve --http=localhost:8091`
3. 检查防火墙设置

### 如果应用无法连接
1. 确认PocketBase正在运行
2. 检查URL是否正确
3. 查看浏览器控制台错误

### 如果数据库为空
1. 在PocketBase管理界面创建集合
2. 添加测试数据
3. 设置适当的权限

## 下一步

1. 设置本地服务器
2. 创建测试数据
3. 测试应用功能
4. 确认一切正常后，再考虑远程服务器配置

---

**本地测试环境可以确保应用功能正常，然后再解决远程服务器问题。**
