# 环境变量设置指南

## 1. 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件（此文件已在 `.gitignore` 中，不会被提交到Git）：

```bash
# PocketBase Configuration
POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
POCKETBASE_ADMIN_EMAIL=pjpcemerlang@gmail.com
POCKETBASE_ADMIN_PASSWORD=0122270775Sw!

# Next.js Configuration
PORT=3001
NODE_ENV=development
```

## 2. 重要说明

### 服务端 vs 客户端环境变量

- **服务端环境变量**：不需要 `NEXT_PUBLIC_` 前缀
  - `POCKETBASE_URL`
  - `POCKETBASE_ADMIN_EMAIL`
  - `POCKETBASE_ADMIN_PASSWORD`

- **客户端环境变量**：需要 `NEXT_PUBLIC_` 前缀
  - `NEXT_PUBLIC_POCKETBASE_URL`（如果需要在前端使用）

### 为什么这样设计？

1. **安全性**：管理员凭据只在服务端使用，不会暴露给浏览器
2. **性能**：避免每次请求都重新认证
3. **缓存**：PocketBase实例会被缓存，减少连接开销

## 3. 验证环境变量

运行以下命令验证环境变量是否正确设置：

```bash
npm run test:env
```

如果看到以下输出，说明设置正确：

```
🔍 环境变量检查:
=====================================
POCKETBASE_URL: http://pjpc.tplinkdns.com:8090
POCKETBASE_ADMIN_EMAIL: pjpcemerlang@gmail.com
POCKETBASE_ADMIN_PASSWORD Exists: true
NODE_ENV: development
PORT: 3001
=====================================
✅ 所有必需的环境变量都已设置
✅ PocketBase连接成功
Base URL: http://pjpc.tplinkdns.com:8090
Auth Valid: true
Admin Email: pjpcemerlang@gmail.com
```

## 4. 故障排除

### 如果环境变量显示 undefined

1. 检查 `.env.local` 文件是否在项目根目录
2. 检查文件名是否正确（注意是 `.env.local` 不是 `.env.local.txt`）
3. 重启开发服务器：`npm run dev`

### 如果PocketBase连接失败

1. 检查网络连接
2. 确认PocketBase服务器正在运行
3. 验证URL和凭据是否正确

## 5. 优化后的优势

- ✅ **避免重复认证**：每次请求不会都401错误
- ✅ **实例缓存**：PocketBase实例被缓存，减少创建开销
- ✅ **自动认证**：认证过期时自动重新认证
- ✅ **错误处理**：完善的错误处理和日志记录
- ✅ **环境隔离**：开发和生产环境分离

