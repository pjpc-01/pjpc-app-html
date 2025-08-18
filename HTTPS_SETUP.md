# HTTPS 开发环境设置

## 概述
为了支持 Chrome 浏览器的 NFC 功能，需要将开发环境从 HTTP 升级到 HTTPS。

## 快速启动

### 方法 1: 使用 PowerShell 脚本（推荐）
```powershell
.\start-https.ps1
```

### 方法 2: 使用 npm 命令
```bash
npm run dev:https
```

### 方法 3: 手动步骤
1. 生成 SSL 证书：
   ```bash
   node scripts/generate-ssl-cert.js
   ```

2. 启动 HTTPS 服务器：
   ```bash
   npm run dev:https
   ```

## 访问地址
- **本地访问**: https://localhost:3000
- **网络访问**: https://[您的IP地址]:3000

## 重要提示

### 浏览器安全警告
由于使用的是自签名证书，浏览器会显示安全警告。这是正常的，请：

1. 点击"高级"
2. 点击"继续前往 localhost (不安全)"
3. 或者点击地址栏的盾牌图标，选择"允许"

### NFC 功能
现在您可以在 Chrome 浏览器中使用 NFC 功能了！

## 文件说明
- `scripts/generate-ssl-cert.js` - 生成自签名证书
- `scripts/dev-https.js` - HTTPS 开发服务器启动脚本
- `start-https.ps1` - PowerShell 启动脚本
- `certs/` - 证书文件目录

## 故障排除

### 证书问题
如果遇到证书错误，删除 `certs/` 目录并重新生成：
```bash
rm -rf certs/
node scripts/generate-ssl-cert.js
```

### 端口占用
如果 3000 端口被占用，可以修改 `scripts/dev-https.js` 中的端口号。

### 权限问题
在 Windows 上可能需要以管理员身份运行 PowerShell。
