# 🚀 Codemagic iOS构建指南

## 步骤1：注册Codemagic账号
1. 访问：https://codemagic.io/
2. 点击"Sign up"
3. 选择"Sign up with GitHub"
4. 授权Codemagic访问你的GitHub仓库

## 步骤2：创建应用
1. 在Codemagic控制台点击"Add application"
2. 选择你的GitHub仓库：pjpc-01/pjpc-app-html
3. 选择分支：flutter
4. 点击"Add application"

## 步骤3：配置iOS构建
1. 在应用页面点击"Start new build"
2. 选择分支：flutter
3. 选择工作流：ios-workflow
4. 点击"Start build"

## 步骤4：等待构建完成
- 构建过程大约需要10-15分钟
- 构建完成后会生成.ipa文件
- 下载.ipa文件到电脑

## 步骤5：安装到iPhone
1. 确保AltStore已安装到iPhone
2. 将.ipa文件拖到AltStore
3. AltStore会自动安装应用到iPhone

## 注意事项
- 免费Apple ID每7天需要重新签名
- 确保iPhone设置中信任开发者证书
- 保持AltStore在后台运行以自动续签

## 替代方案：手动构建
如果Codemagic不可用，可以使用以下命令在macOS上构建：
```bash
flutter build ios --release
```
