# DDNS 配置说明

## 概述

本项目已配置支持通过DDNS域名访问PocketBase服务。

## 配置详情

### 1. DDNS域名
- **域名**: `pjpc.tplinkdns.com`
- **端口**: `8090`
- **完整地址**: `http://pjpc.tplinkdns.com:8090`

### 2. 环境变量配置

在项目根目录创建 `.env.local` 文件，添加以下配置：

```bash
# PocketBase Configuration
# 使用DDNS地址访问PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security Settings
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
```

### 3. 配置优先级

系统按以下优先级选择PocketBase地址：

1. **环境变量**: `NEXT_PUBLIC_POCKETBASE_URL`
2. **开发环境**: `http://192.168.0.59:8090`
3. **生产环境**: `http://pjpc.tplinkdns.com:8090`

### 4. 访问地址

#### PocketBase管理界面
- **本地访问**: `http://192.168.0.59:8090/_/`
- **DDNS访问**: `http://pjpc.tplinkdns.com:8090/_/`

#### 应用程序
- **本地开发**: `http://localhost:3000`
- **DDNS访问**: `http://pjpc.tplinkdns.com:3000` (需要配置端口转发)

### 5. 测试连接

运行以下命令测试DDNS连接：

```bash
# 测试网络连接
npm run test:network

# 测试认证功能
npm run test:auth

# 测试权限配置
npm run test:permissions
```

### 6. 端口转发配置

确保在路由器中配置以下端口转发：

- **端口 8090**: PocketBase服务
- **端口 3000**: Next.js应用 (可选)

### 7. 安全注意事项

1. **HTTPS**: 建议配置SSL证书以支持HTTPS访问
2. **防火墙**: 确保只开放必要的端口
3. **认证**: 使用强密码保护管理员账户
4. **备份**: 定期备份PocketBase数据

### 8. 故障排除

#### 问题1: 无法通过DDNS访问
**解决方案**:
1. 检查DDNS服务是否正常
2. 确认端口转发配置
3. 测试网络连接

#### 问题2: 应用无法连接到PocketBase
**解决方案**:
1. 检查环境变量配置
2. 确认PocketBase服务运行状态
3. 查看浏览器控制台错误信息

#### 问题3: 认证失败
**解决方案**:
1. 检查用户账户状态
2. 确认密码正确性
3. 查看PocketBase日志

### 9. 开发环境切换

如需在开发环境中使用本地IP，可以：

1. 修改 `.env.local` 文件：
```bash
NEXT_PUBLIC_POCKETBASE_URL=http://192.168.0.59:8090
```

2. 或者删除 `NEXT_PUBLIC_POCKETBASE_URL` 环境变量，系统会自动使用本地IP

### 10. 生产环境部署

在生产环境中，建议：

1. 使用HTTPS协议
2. 配置域名解析
3. 设置适当的CORS策略
4. 启用日志记录
5. 配置数据备份策略
