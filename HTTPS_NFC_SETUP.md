# HTTPS NFC 功能设置指南

## 🎯 目标
在手机上使用NFC功能进行签到，需要HTTPS连接。

## 📋 当前状态
✅ **已完成设置**
- 使用mkcert生成了可信的SSL证书
- 配置了HTTPS服务器（端口3000）
- 创建了手机NFC签到页面
- 创建了NFC功能测试页面

## 🚀 快速启动

### 方法1：使用npm命令
```bash
npm run https
```

### 方法2：直接运行
```bash
node server.js
```

### 方法3：使用PowerShell脚本
```bash
powershell -ExecutionPolicy Bypass -File start-https-simple.ps1
```

## 📱 访问地址

### 本地访问
- **HTTPS服务器**: https://localhost:3000
- **手机NFC页面**: https://localhost:3000/mobile-nfc
- **NFC测试页面**: https://localhost:3000/mobile-nfc-test

### 网络访问（手机）
- **HTTPS服务器**: https://192.168.0.72:3000
- **手机NFC页面**: https://192.168.0.72:3000/mobile-nfc
- **NFC测试页面**: https://192.168.0.72:3000/mobile-nfc-test

## 🔧 技术细节

### SSL证书
- **CA证书**: ca.crt, ca.key
- **服务器证书**: cert.crt, cert.key
- **生成工具**: mkcert
- **状态**: 本地可信，浏览器不会显示安全警告

### 服务器配置
- **端口**: 3000
- **协议**: HTTPS
- **主机**: 0.0.0.0（允许网络访问）
- **框架**: Next.js + 自定义HTTPS服务器

## 📱 手机使用步骤

1. **确保手机和电脑在同一网络**
2. **在手机浏览器中访问**: https://192.168.0.72:3000/mobile-nfc
3. **首次访问时，浏览器会请求NFC权限** - 点击"允许"
4. **将NFC卡片靠近手机背面**
5. **系统会自动读取卡片信息并完成签到**

## 🧪 测试功能

访问测试页面检查设备兼容性：
- **地址**: https://192.168.0.72:3000/mobile-nfc-test
- **功能**: 检查HTTPS连接、NFC支持、设备兼容性

## ⚠️ 注意事项

1. **必须使用HTTPS**: NFC功能只在HTTPS连接下工作
2. **移动设备**: 建议在手机或平板电脑上使用
3. **浏览器支持**: 推荐使用Chrome浏览器
4. **NFC权限**: 首次使用需要授权NFC权限
5. **网络连接**: 确保手机和电脑在同一局域网

## 🔄 重新生成证书

如果证书过期或需要重新生成：

```bash
# 生成CA证书
mkcert create-ca

# 生成服务器证书
mkcert create-cert localhost 192.168.0.72
```

## 🛠️ 故障排除

### 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 停止占用进程
taskkill /F /PID <进程ID>
```

### 证书问题
```bash
# 检查证书文件
dir *.crt *.key

# 重新生成证书
mkcert create-ca
mkcert create-cert localhost 192.168.0.72
```

### 网络访问问题
1. 检查防火墙设置
2. 确保手机和电脑在同一网络
3. 验证IP地址是否正确

## 📞 支持

如果遇到问题，请检查：
1. 服务器是否正常启动
2. 证书文件是否存在
3. 网络连接是否正常
4. 浏览器是否支持NFC

---

**最后更新**: 2025年8月15日
**状态**: ✅ 已完成设置，可以正常使用
