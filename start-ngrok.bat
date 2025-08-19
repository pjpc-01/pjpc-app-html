@echo off
echo 🚀 启动ngrok隧道服务器...
echo 📱 这将创建一个公网可访问的HTTPS链接
echo.

REM 检查ngrok是否安装
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok未安装，正在安装...
    npm install -g ngrok
)

echo ✅ ngrok已安装
echo 🔗 正在创建HTTPS隧道...

REM 启动ngrok隧道到端口3000
ngrok http 3000 --host-header=localhost:3000

echo.
echo 📱 使用上面的HTTPS链接访问手机NFC页面
echo 💡 例如: https://xxxx.ngrok.io/mobile-nfc
pause
