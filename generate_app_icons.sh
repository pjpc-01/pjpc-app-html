# 应用图标生成脚本
# 这个脚本会从您的logo.png生成不同尺寸的应用图标

# Android图标尺寸
ANDROID_SIZES=(
  "48x48"    # mdpi
  "72x72"    # hdpi  
  "96x96"    # xhdpi
  "144x144"  # xxhdpi
  "192x192"  # xxxhdpi
)

# iOS图标尺寸
IOS_SIZES=(
  "20x20"    # iPhone notification
  "29x29"    # iPhone settings
  "40x40"    # iPhone spotlight
  "58x58"    # iPhone 2x settings
  "60x60"    # iPhone 2x spotlight
  "80x80"    # iPhone 2x spotlight
  "87x87"    # iPhone 3x settings
  "120x120"  # iPhone 3x spotlight
  "180x180"  # iPhone 3x app
  "1024x1024" # App Store
)

echo "开始生成应用图标..."

# 检查ImageMagick是否安装
if ! command -v magick &> /dev/null; then
    echo "错误: 需要安装ImageMagick来生成图标"
    echo "请访问: https://imagemagick.org/script/download.php"
    exit 1
fi

# 检查源文件是否存在
if [ ! -f "assets/images/logo.png" ]; then
    echo "错误: 找不到源文件 assets/images/logo.png"
    exit 1
fi

# 创建Android图标目录
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# 生成Android图标
echo "生成Android图标..."
magick assets/images/logo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
magick assets/images/logo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick assets/images/logo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick assets/images/logo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick assets/images/logo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 创建iOS图标目录
mkdir -p ios/Runner/Assets.xcassets/AppIcon.appiconset

# 生成iOS图标
echo "生成iOS图标..."
magick assets/images/logo.png -resize 20x20 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png
magick assets/images/logo.png -resize 29x29 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png
magick assets/images/logo.png -resize 40x40 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png
magick assets/images/logo.png -resize 58x58 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png
magick assets/images/logo.png -resize 60x60 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@1x.png
magick assets/images/logo.png -resize 80x80 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png
magick assets/images/logo.png -resize 87x87 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png
magick assets/images/logo.png -resize 120x120 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png
magick assets/images/logo.png -resize 180x180 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png
magick assets/images/logo.png -resize 1024x1024 ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png

echo "应用图标生成完成！"
echo "Android图标已保存到: android/app/src/main/res/mipmap-*/"
echo "iOS图标已保存到: ios/Runner/Assets.xcassets/AppIcon.appiconset/"
