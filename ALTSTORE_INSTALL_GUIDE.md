# AltStore安装指南 - iPhone 14

## 📱 方案1：AltStore安装步骤

### 步骤1：下载AltStore
1. 访问官网：https://altstore.io/
2. 点击"Download AltStore for Windows"
3. 下载AltInstaller.exe文件
4. 运行AltInstaller.exe安装AltStore

### 步骤2：准备Apple ID
- **免费Apple ID**：每7天需要重新签名
- **付费开发者账号**（$99/年）：免签名限制
- 建议使用免费Apple ID开始

### 步骤3：连接iPhone 14
1. 用USB线连接iPhone 14到电脑
2. 在iPhone上点击"信任此电脑"
3. 确保iPhone和电脑在同一WiFi网络

### 步骤4：安装AltStore到iPhone
1. 打开电脑上的AltStore
2. 点击"Install AltStore"
3. 选择你的iPhone 14
4. 输入Apple ID和密码
5. 等待安装完成

### 步骤5：信任开发者证书
1. 在iPhone上打开"设置" > "通用" > "VPN与设备管理"
2. 找到你的Apple ID
3. 点击"信任"

## 🔧 应用构建和安装

### 构建iOS应用
由于在Windows上无法直接构建iOS应用，我们使用云服务：

#### 选项A：GitHub Actions（推荐）
1. 将代码推送到GitHub
2. GitHub Actions自动构建
3. 下载.ipa文件

#### 选项B：Codemagic
1. 注册Codemagic账号
2. 连接GitHub仓库
3. 自动构建iOS应用

### 安装应用到iPhone
1. 将.ipa文件拖到AltStore
2. AltStore会自动安装到iPhone
3. 在iPhone上打开应用

## ⚠️ 注意事项
- 免费Apple ID每7天需要重新签名
- 确保iPhone设置中信任开发者证书
- 保持AltStore在后台运行以自动续签

## 🆘 常见问题
- **无法安装**：检查USB连接和信任设置
- **签名过期**：重新运行AltStore续签
- **应用崩溃**：检查iOS版本兼容性
