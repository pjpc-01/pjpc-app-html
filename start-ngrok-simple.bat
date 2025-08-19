@echo off
echo 🚀 启动ngrok隧道...
echo.

REM 使用npx运行ngrok
npx ngrok http 80

echo.
echo 📱 使用上面的HTTPS链接访问手机NFC页面
pause
