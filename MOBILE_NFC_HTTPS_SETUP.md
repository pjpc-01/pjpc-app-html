# 移动端NFC考勤系统 - HTTPS设置指南

## 🎯 概述

移动端NFC考勤系统已经创建完成，但需要HTTPS环境才能正常使用NFC功能。本文档将指导你如何设置HTTPS环境。

## 🚀 已完成的组件

### 1. 移动端打卡页面索引
- **路径**: `/mobile-checkin`
- **功能**: 选择考勤中心，显示系统状态

### 2. 各中心专属打卡页面
- **WX 01**: `/mobile-checkin/wx01`
- **WX 02**: `/mobile-checkin/wx02`  
- **WX 03**: `/mobile-checkin/wx03`
- **WX 04**: `/mobile-checkin/wx04`

### 3. 主要功能特性
- ✅ HTTPS协议检测
- ✅ NFC支持检测
- ✅ 设备信息显示
- ✅ 手动URL输入（备用方案）
- ✅ 实时考勤记录
- ✅ 系统状态监控

## 🔒 HTTPS设置方法

### 方法1: 使用现有的HTTPS服务器

如果你已经有HTTPS服务器，只需要：

1. **配置域名解析**
   ```
   center1.yourdomain.com → 你的服务器IP
   center2.yourdomain.com → 你的服务器IP
   ```

2. **配置SSL证书**
   - 使用Let's Encrypt免费证书
   - 或购买商业SSL证书

3. **配置反向代理**
   - 将HTTPS请求转发到Next.js应用
   - 确保端口3000的应用能正常访问

### 方法2: 使用ngrok进行HTTPS隧道

1. **安装ngrok**
   ```bash
   # 下载并安装ngrok
   # 注册账号获取authtoken
   ngrok config add-authtoken YOUR_TOKEN
   ```

2. **启动HTTPS隧道**
   ```bash
   # 为端口3000创建HTTPS隧道
   ngrok http 3000
   ```

3. **访问移动端页面**
   ```
   https://xxxx.ngrok.io/mobile-checkin
   https://xxxx.ngrok.io/mobile-checkin/wx01
   ```

### 方法3: 使用Cloudflare Tunnel

1. **安装cloudflared**
2. **创建隧道**
3. **配置域名**

## 📱 移动端使用流程

### 1. 访问打卡页面
```
https://yourdomain.com/mobile-checkin
```

### 2. 选择考勤中心
- 点击对应的中心卡片
- 进入专属打卡页面

### 3. NFC打卡操作
- 确保手机支持NFC
- 点击"NFC考勤打卡"按钮
- 将学生NFC卡片贴近手机背面
- 系统自动读取卡片中的URL
- 识别学生身份并记录考勤

### 4. 手动输入（备用方案）
- 点击"手动输入URL"
- 输入学生的专属URL
- 点击"确认打卡"

## 🔧 技术实现细节

### NFC读取流程
```typescript
1. 检查HTTPS环境
2. 检查NFC支持
3. 启动NFC读取
4. 读取卡片中的URL
5. 通过URL查找学生信息
6. 验证学生状态
7. 记录考勤信息
8. 显示打卡结果
```

### 考勤记录结构
```typescript
{
  id: string,
  studentId: string,
  studentName: string,
  studentUrl: string,
  timestamp: string,
  deviceInfo: string,
  center: string,
  type: 'checkin' | 'checkout',
  status: 'success' | 'failed'
}
```

## 🌐 访问地址示例

### 开发环境
```
http://localhost:3000/mobile-checkin          # 索引页面
http://localhost:3000/mobile-checkin/wx01     # WX 01中心
http://localhost:3000/mobile-checkin/wx02     # WX 02中心
```

### 生产环境（HTTPS）
```
https://center1.yourdomain.com/mobile-checkin/wx01
https://center2.yourdomain.com/mobile-checkin/wx02
https://center3.yourdomain.com/mobile-checkin/wx03
```

## ⚠️ 重要注意事项

### 1. HTTPS要求
- **NFC功能必须使用HTTPS**
- HTTP环境下NFC按钮会被禁用
- 系统会自动检测协议类型

### 2. 设备兼容性
- 需要支持NFC的手机
- 建议使用Android 8.0+或iOS 13+
- 部分老旧设备可能不支持

### 3. 浏览器支持
- Chrome 67+ (Android)
- Safari 13+ (iOS)
- Edge 79+ (Windows)

### 4. 网络要求
- 稳定的网络连接
- 建议使用WiFi或4G/5G
- 离线状态下可以缓存数据

## 🚀 下一步计划

### 步骤3: 实现NFC读取API
- 创建真实的NFC读取功能
- 集成Web NFC API
- 处理各种NFC卡片格式

### 步骤4: 集成PocketBase
- 连接真实的考勤记录API
- 实现实时数据同步
- 添加考勤统计功能

## 📞 技术支持

如果在设置过程中遇到问题：

1. **检查HTTPS配置**
2. **验证SSL证书有效性**
3. **确认防火墙设置**
4. **查看浏览器控制台错误**

## 🎉 总结

移动端NFC考勤系统的基础架构已经完成，包括：

- ✅ 响应式移动端界面
- ✅ 多中心支持
- ✅ HTTPS协议检测
- ✅ NFC功能框架
- ✅ 考勤记录管理
- ✅ 系统状态监控

现在需要配置HTTPS环境来启用NFC功能。建议先使用ngrok进行测试，确认功能正常后再配置生产环境的HTTPS。
