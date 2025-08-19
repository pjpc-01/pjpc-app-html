# 📱 手机访问故障排除指南

## 🎯 问题描述
电脑可以访问，但手机无法访问HTTPS服务器。

## 🔍 诊断步骤

### 步骤1：检查网络配置
```bash
npm run test:network
```
确认您的IP地址是：`192.168.0.70`

### 步骤2：检查防火墙设置
```bash
npm run test:connection
```
如果端口显示"关闭"，说明防火墙阻止了连接。

### 步骤3：修复防火墙（需要管理员权限）
1. 右键点击PowerShell
2. 选择"以管理员身份运行"
3. 运行以下命令：
```bash
.\fix-firewall.ps1
```

## 🛠️ 解决方案

### 方案1：修复防火墙（推荐）
1. **以管理员身份运行PowerShell**
2. **执行防火墙修复脚本**：
   ```bash
   .\fix-firewall.ps1
   ```
3. **重启HTTPS服务器**：
   ```bash
   npm run smart
   ```

### 方案2：手动添加防火墙规则
如果脚本不工作，手动添加：
```bash
# 以管理员身份运行
netsh advfirewall firewall add rule name="Node.js HTTPS Server" dir=in action=allow protocol=TCP localport=3000-3010
```

### 方案3：临时关闭防火墙（仅测试用）
```bash
# 以管理员身份运行
netsh advfirewall set allprofiles state off
```
⚠️ **注意**：测试完成后请重新开启防火墙

## 📱 手机访问测试

### 1. 确保手机和电脑在同一WiFi网络

### 2. 在手机浏览器中访问：
```
https://192.168.0.70:3000
```

### 3. 如果出现证书警告：
- 点击"高级"
- 选择"继续访问"
- 或选择"信任此证书"

### 4. 测试NFC功能：
```
https://192.168.0.70:3000/mobile-nfc-test
https://192.168.0.70:3000/mobile-nfc
```

## 🔧 其他可能的问题

### 问题1：路由器阻止连接
- 检查路由器设置
- 确保没有启用AP隔离
- 检查MAC地址过滤

### 问题2：杀毒软件阻止
- 临时关闭杀毒软件
- 将Node.js添加到白名单
- 允许端口3000-3010

### 问题3：网络配置问题
- 确保手机和电脑在同一子网
- 检查IP地址冲突
- 尝试重启路由器

## 🧪 测试工具

### 网络配置测试
```bash
npm run test:network
```

### 端口连接测试
```bash
npm run test:connection
```

### 端口可用性测试
```bash
npm run test:ports
```

## 📞 快速诊断命令

```bash
# 1. 检查网络配置
npm run test:network

# 2. 检查端口连接
npm run test:connection

# 3. 修复防火墙（需要管理员权限）
.\fix-firewall.ps1

# 4. 启动HTTPS服务器
npm run smart
```

## 🎯 预期结果

修复后，您应该看到：
```
🎉 智能HTTPS服务器启动成功！
📱 本地访问: https://localhost:3000
🌐 网络访问: https://192.168.0.70:3000
📋 手机NFC页面: https://192.168.0.70:3000/mobile-nfc
🧪 NFC测试页面: https://192.168.0.70:3000/mobile-nfc-test
✅ 自动配置完成，无需手动设置！
📱 现在可以在手机上正常使用NFC功能了！
```

## 🆘 如果仍然无法访问

1. **检查手机网络**：确保手机连接的是同一个WiFi
2. **尝试其他端口**：服务器会自动选择可用端口
3. **检查路由器设置**：某些路由器可能阻止设备间通信
4. **联系技术支持**：提供详细的错误信息

## 📋 故障排除清单

- [ ] 手机和电脑在同一WiFi网络
- [ ] 防火墙已正确配置
- [ ] 服务器正在运行
- [ ] 端口3000-3010未被占用
- [ ] 路由器未启用AP隔离
- [ ] 杀毒软件未阻止连接
- [ ] 手机浏览器支持HTTPS
- [ ] 证书警告已处理

按照这个清单逐步检查，应该能解决手机访问问题！

