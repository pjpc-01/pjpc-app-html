@echo off
echo ========================================
echo 温馨小屋应用构建和安装脚本
echo ========================================

echo.
echo 1. 清理项目...
flutter clean

echo.
echo 2. 获取依赖...
flutter pub get

echo.
echo 3. 构建Android APK...
flutter build apk --release

echo.
echo 4. 检查APK文件...
if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo ✅ APK构建成功！
    echo 📱 APK位置: build\app\outputs\flutter-apk\app-release.apk
    echo 📏 文件大小: 
    dir "build\app\outputs\flutter-apk\app-release.apk" | findstr "app-release.apk"
) else (
    echo ❌ APK构建失败！
)

echo.
echo 5. 构建Android Bundle...
flutter build appbundle --release

echo.
echo 6. 检查Bundle文件...
if exist "build\app\outputs\bundle\release\app-release.aab" (
    echo ✅ Bundle构建成功！
    echo 📦 Bundle位置: build\app\outputs\bundle\release\app-release.aab
) else (
    echo ❌ Bundle构建失败！
)

echo.
echo ========================================
echo 安装说明:
echo ========================================
echo.
echo Android安装:
echo 1. 将APK文件传输到Android设备
echo 2. 启用"未知来源"安装
echo 3. 点击APK文件安装
echo.
echo iOS安装:
echo 1. 使用Xcode打开 ios/Runner.xcworkspace
echo 2. 配置开发者账号
echo 3. 连接设备并运行
echo.
echo ========================================
pause
