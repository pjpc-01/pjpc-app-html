# Bitrise iOS构建指南

## 步骤1：注册Bitrise
1. 访问：https://bitrise.io/
2. 点击"Sign up"
3. 选择"Sign up with GitHub"
4. 授权Bitrise访问你的GitHub仓库

## 步骤2：添加应用
1. 在Bitrise控制台点击"Add new app"
2. 选择仓库：pjpc-01/pjpc-app-html
3. 选择分支：flutter
4. 点击"Add app"

## 步骤3：配置工作流
1. 选择"iOS"平台
2. 选择"Flutter"框架
3. Bitrise会自动检测Flutter项目
4. 点击"Confirm"

## 步骤4：开始构建
1. 点击"Start/Schedule a Build"
2. 选择分支：flutter
3. 选择工作流：primary
4. 点击"Start build"

## 步骤5：下载.ipa文件
- 构建完成后（约10-15分钟）
- 在构建页面下载.ipa文件
- 通过AltStore安装到iPhone

## 优势
- 无需配置文件
- 自动检测Flutter项目
- 免费构建额度
- 简单易用
