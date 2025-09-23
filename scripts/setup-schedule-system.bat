@echo off
REM 排班系统一键设置脚本 (Windows版本)
REM 用于自动导入集合、测试API和初始化数据

echo 🚀 开始设置排班系统...

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

REM 检查PocketBase是否安装
pb --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ PocketBase CLI 未安装，将跳过命令行导入
    echo 请手动通过管理界面导入集合文件
) else (
    echo 1️⃣ 导入集合到PocketBase...
    
    REM 导入集合
    cd pocketbase_collections
    pb import collections schedules.json
    pb import collections schedule_templates.json
    pb import collections schedule_logs.json
    pb import collections classes.json
    cd ..
    
    echo ✅ 集合导入完成
)

REM 安装依赖
echo 2️⃣ 安装依赖...
if not exist "node_modules" (
    npm install
)

REM 运行兼容性检查
echo 3️⃣ 检查API兼容性...
node scripts/check-api-compatibility.js

if %errorlevel% neq 0 (
    echo ❌ API兼容性检查失败
    pause
    exit /b 1
) else (
    echo ✅ API兼容性检查通过
)

REM 运行API测试
echo 4️⃣ 测试API功能...
node scripts/test-schedule-api.js

if %errorlevel% neq 0 (
    echo ❌ API功能测试失败
    pause
    exit /b 1
) else (
    echo ✅ API功能测试通过
)

REM 初始化默认数据
echo 5️⃣ 初始化默认数据...
node scripts/init-schedule-data.js

if %errorlevel% neq 0 (
    echo ❌ 默认数据初始化失败
    pause
    exit /b 1
) else (
    echo ✅ 默认数据初始化完成
)

echo 🎉 排班系统设置完成！
echo.
echo 📋 下一步：
echo 1. 访问排班管理界面: http://localhost:3000/attendance-management
echo 2. 开始创建排班记录
echo 3. 配置排班模板
echo 4. 管理课程信息
echo.
echo 💡 提示：如果遇到问题，请查看 docs/setup-guide.md
pause
