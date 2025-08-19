@echo off
chcp 65001 >nul
echo 🚀 启动智能HTTPS服务器...
echo 📱 自动配置HTTPS，支持手机NFC功能
echo ✅ 无需手动配置证书
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 🔧 启动智能HTTPS服务器...
echo 💡 系统将自动检测并生成SSL证书
echo 📱 支持手机NFC功能测试
echo.

REM 启动智能HTTPS服务器
node smart-https-server.js

pause
