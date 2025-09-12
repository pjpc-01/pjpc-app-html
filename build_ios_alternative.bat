@echo off
echo ========================================
echo    温馨小屋 iOS应用构建脚本
echo ========================================
echo.

echo 当前状态：
echo - AltStore已安装到iPhone ✅
echo - 需要构建.ipa文件 ⏳
echo.

echo 由于AppCenter需要添加SDK，我们使用更简单的方案：
echo.

echo 方案1：Bitrise（推荐）
echo 1. 访问：https://bitrise.io/
echo 2. 注册并连接GitHub
echo 3. 选择仓库：pjpc-01/pjpc-app-html
echo 4. 选择分支：flutter
echo 5. 开始构建
echo.

echo 方案2：Firebase App Distribution
echo 1. 访问：https://firebase.google.com/
echo 2. 创建项目
echo 3. 启用App Distribution
echo 4. 上传.ipa文件
echo.

echo 方案3：使用Mac电脑
echo 如果你有Mac电脑，可以使用：
echo flutter build ios --release --no-codesign
echo.

echo ========================================
echo 构建完成后，通过AltStore安装.ipa文件
echo ========================================
pause
