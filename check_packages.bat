@echo off
echo ========================================
echo 温馨小屋应用安装包位置检查
echo ========================================

echo.
echo 📱 Android APK文件:
if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo ✅ APK文件存在: build\app\outputs\flutter-apk\app-release.apk
    for %%I in ("build\app\outputs\flutter-apk\app-release.apk") do echo 📏 文件大小: %%~zI 字节
) else (
    echo ❌ APK文件不存在
)

echo.
echo 📦 Android Bundle文件:
if exist "build\app\outputs\bundle\release\app-release.aab" (
    echo ✅ Bundle文件存在: build\app\outputs\bundle\release\app-release.aab
    for %%I in ("build\app\outputs\bundle\release\app-release.aab") do echo 📏 文件大小: %%~zI 字节
) else (
    echo ❌ Bundle文件不存在
)

echo.
echo 🍎 iOS应用文件:
if exist "build\ios" (
    echo ✅ iOS构建目录存在: build\ios
    echo 📱 使用Xcode打开: ios\Runner.xcworkspace
) else (
    echo ❌ iOS构建目录不存在
)

echo.
echo 📋 安装包位置总结:
echo ========================================
echo Android APK: build\app\outputs\flutter-apk\app-release.apk
echo Android Bundle: build\app\outputs\bundle\release\app-release.aab
echo iOS项目: ios\Runner.xcworkspace
echo ========================================

pause
