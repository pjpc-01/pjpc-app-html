#!/bin/bash
# 温馨小屋应用构建脚本

echo "========================================"
echo "温馨小屋应用构建脚本"
echo "========================================"

echo ""
echo "1. 清理项目..."
flutter clean

echo ""
echo "2. 获取依赖..."
flutter pub get

echo ""
echo "3. 构建Android APK..."
flutter build apk --release

echo ""
echo "4. 检查APK文件..."
if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
    echo "✅ APK构建成功！"
    echo "📱 APK位置: build/app/outputs/flutter-apk/app-release.apk"
    ls -lh "build/app/outputs/flutter-apk/app-release.apk"
else
    echo "❌ APK构建失败！"
fi

echo ""
echo "5. 构建Android Bundle..."
flutter build appbundle --release

echo ""
echo "6. 检查Bundle文件..."
if [ -f "build/app/outputs/bundle/release/app-release.aab" ]; then
    echo "✅ Bundle构建成功！"
    echo "📦 Bundle位置: build/app/outputs/bundle/release/app-release.aab"
    ls -lh "build/app/outputs/bundle/release/app-release.aab"
else
    echo "❌ Bundle构建失败！"
fi

echo ""
echo "7. 构建iOS应用..."
flutter build ios --release --no-codesign

echo ""
echo "========================================"
echo "构建完成！"
echo "========================================"
echo ""
echo "Android安装:"
echo "1. 将APK文件传输到Android设备"
echo "2. 启用'未知来源'安装"
echo "3. 点击APK文件安装"
echo ""
echo "iOS安装:"
echo "1. 使用Xcode打开 ios/Runner.xcworkspace"
echo "2. 配置开发者账号"
echo "3. 连接设备并运行"
echo ""
echo "========================================"
