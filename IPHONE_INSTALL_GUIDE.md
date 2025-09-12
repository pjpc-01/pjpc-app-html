# iPhone 14 安装指南 - AltStore方法

## 步骤1：准备AltStore
1. 在电脑上下载AltStore：https://altstore.io/
2. 安装AltStore到电脑
3. 确保iPhone和电脑连接同一WiFi

## 步骤2：安装AltStore到iPhone
1. 用USB连接iPhone到电脑
2. 打开AltStore
3. 点击"Install AltStore"选择你的iPhone
4. 输入Apple ID（需要开发者账号或免费账号）

## 步骤3：构建iOS应用
在Windows上使用以下命令构建iOS应用（需要macOS环境）：

### 选项A：使用GitHub Actions
1. 将代码推送到GitHub
2. GitHub Actions会自动构建iOS应用
3. 下载构建好的.ipa文件

### 选项B：使用Codemagic
1. 注册Codemagic账号
2. 连接GitHub仓库
3. 配置开发者证书
4. 自动构建并分发到TestFlight

## 步骤4：安装应用到iPhone
1. 将.ipa文件拖到AltStore
2. AltStore会自动安装到iPhone
3. 在iPhone上信任开发者证书

## 注意事项
- 免费Apple ID每7天需要重新签名
- 付费开发者账号（$99/年）可以免签名限制
- 确保iPhone设置中信任开发者证书

## 开发者证书设置
1. 登录Apple Developer Portal
2. 创建iOS开发证书
3. 创建Provisioning Profile
4. 配置Bundle ID: com.pjpc.school.pjpcAppFlutter
