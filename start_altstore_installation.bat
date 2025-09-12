@echo off
echo ========================================
echo    AltStore iOS应用安装指南
echo ========================================
echo.
echo 步骤1：下载AltStore
echo 1. 访问 https://altstore.io/
echo 2. 下载Windows版本
echo 3. 安装并启动AltStore
echo.
echo 步骤2：连接iPhone 14
echo 1. 用USB连接iPhone到电脑
echo 2. 在iPhone上点击"信任此电脑"
echo 3. 确保iPhone和电脑在同一WiFi
echo.
echo 步骤3：安装AltStore到iPhone
echo 1. 在电脑上打开AltStore
echo 2. 点击"Install AltStore"
echo 3. 选择你的iPhone 14
echo 4. 输入Apple ID和密码
echo.
echo 步骤4：构建iOS应用
echo 选择以下方案之一：
echo.
echo 方案A：GitHub Actions
echo 1. 推送代码到GitHub
echo 2. GitHub Actions自动构建
echo 3. 下载.ipa文件
echo.
echo 方案B：Codemagic
echo 1. 注册 https://codemagic.io/
echo 2. 连接GitHub仓库
echo 3. 自动构建iOS应用
echo.
echo 步骤5：安装应用到iPhone
echo 1. 将.ipa文件拖到AltStore
echo 2. AltStore自动安装到iPhone
echo 3. 在iPhone设置中信任证书
echo.
echo ========================================
echo 详细说明请查看：
echo - ALTSTORE_INSTALL_GUIDE.md
echo - IPHONE_INSTALL_GUIDE.md
echo ========================================
pause

