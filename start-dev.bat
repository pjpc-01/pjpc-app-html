@echo off
setlocal enabledelayedexpansion

:: 设置默认端口
set PORT=3001

:: 检查是否有参数传入
if not "%~1"=="" (
    set PORT=%~1
)

echo 🚀 启动 PJPC 应用开发服务器...
echo 📍 端口: %PORT%
echo 🌐 访问地址: http://localhost:%PORT%
echo.

:: 设置环境变量
set PORT=%PORT%

:: 启动开发服务器
npm run dev

if errorlevel 1 (
    echo.
    echo ❌ 启动失败
    echo.
    echo 💡 提示:
    echo 1. 确保已安装依赖: npm install
    echo 2. 检查 .env.local 文件配置
    echo 3. 尝试其他端口: start-dev.bat 3002
    echo.
    pause
)
