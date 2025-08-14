# 端口配置和使用说明

## 环境配置

已创建 `.env.local` 文件，包含以下配置：

```env
# PocketBase 配置
NEXT_PUBLIC_POCKETBASE_URL=http://pjpc.tplinkdns.com:8090
PORT=3001
NODE_ENV=development

# Google Sheets API 配置
GOOGLE_SERVICE_ACCOUNT_JSON=你的Google服务账户JSON
```

## 启动方式

### 方式1: 使用PowerShell脚本（推荐）
```powershell
# 默认端口3001
.\start-dev.ps1

# 指定端口
.\start-dev.ps1 -Port 3002
.\start-dev.ps1 -Port 3003
```

### 方式2: 使用批处理文件
```cmd
# 默认端口3001
start-dev.bat

# 指定端口
start-dev.bat 3002
start-dev.bat 3003
```

### 方式3: 直接使用npm命令
```bash
# 设置环境变量并启动
$env:PORT=3001; npm run dev

# 或者
set PORT=3001 && npm run dev
```

## 数据导入功能配置

### 问题原因
数据导入界面没有反应是因为缺少Google Sheets API的配置。

### 解决方案

1. **获取Google Service Account凭据**：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建或选择项目
   - 启用 Google Sheets API
   - 创建服务账户
   - 下载JSON密钥文件

2. **配置环境变量**：
   - 打开 `.env.local` 文件
   - 将下载的JSON文件内容替换 `GOOGLE_SERVICE_ACCOUNT_JSON` 的值
   - 确保JSON格式正确（所有引号都需要转义）

3. **示例配置**：
```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"your-service@your-project.iam.gserviceaccount.com",...}
```

## 端口使用说明

- **3001**: 主要开发端口
- **3002**: 备用端口1
- **3003**: 备用端口2

如果某个端口被占用，Next.js会自动尝试下一个可用端口。

## 故障排除

### 端口被占用
```powershell
# 查看端口占用情况
netstat -ano | findstr :3001

# 结束占用进程（替换PID为实际进程ID）
taskkill /PID <PID> /F
```

### 环境变量不生效
1. 重启开发服务器
2. 检查 `.env.local` 文件格式
3. 确保文件在项目根目录

### 数据导入仍然无反应
1. 检查Google Sheets API配置
2. 查看浏览器控制台错误信息
3. 检查网络连接
4. 确认Google Sheets文档权限设置

## 访问地址

启动成功后，访问以下地址：
- http://localhost:3001
- http://localhost:3002
- http://localhost:3003

数据导入页面：http://localhost:3001/data-import
