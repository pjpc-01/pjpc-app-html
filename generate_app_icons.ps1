# PowerShell脚本：生成应用图标
# 从logo.png生成不同尺寸的应用图标

Write-Host "开始生成应用图标..." -ForegroundColor Green

# 检查源文件是否存在
if (-not (Test-Path "assets/images/logo.png")) {
    Write-Host "错误: 找不到源文件 assets/images/logo.png" -ForegroundColor Red
    exit 1
}

# 创建Android图标目录
$androidDirs = @(
    "android/app/src/main/res/mipmap-mdpi",
    "android/app/src/main/res/mipmap-hdpi", 
    "android/app/src/main/res/mipmap-xhdpi",
    "android/app/src/main/res/mipmap-xxhdpi",
    "android/app/src/main/res/mipmap-xxxhdpi"
)

foreach ($dir in $androidDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
}

# Android图标尺寸映射
$androidSizes = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

# 生成Android图标
Write-Host "生成Android图标..." -ForegroundColor Yellow
foreach ($density in $androidSizes.Keys) {
    $size = $androidSizes[$density]
    $sourceFile = "assets/images/logo.png"
    $targetFile = "android/app/src/main/res/mipmap-$density/ic_launcher.png"
    
    # 使用PowerShell的Add-Type来调用.NET的System.Drawing
    Add-Type -AssemblyName System.Drawing
    
    $originalImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourceFile))
    $resizedImage = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($originalImage, 0, 0, $size, $size)
    $resizedImage.Save((Resolve-Path $targetFile), [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $resizedImage.Dispose()
    $originalImage.Dispose()
    
    Write-Host "生成: $targetFile ($size x $size)" -ForegroundColor Cyan
}

# 创建iOS图标目录
$iosDir = "ios/Runner/Assets.xcassets/AppIcon.appiconset"
if (-not (Test-Path $iosDir)) {
    New-Item -ItemType Directory -Path $iosDir -Force
}

# iOS图标尺寸映射
$iosSizes = @{
    "Icon-App-20x20@1x.png" = 20
    "Icon-App-29x29@1x.png" = 29
    "Icon-App-40x40@1x.png" = 40
    "Icon-App-29x29@2x.png" = 58
    "Icon-App-60x60@1x.png" = 60
    "Icon-App-40x40@2x.png" = 80
    "Icon-App-29x29@3x.png" = 87
    "Icon-App-60x60@2x.png" = 120
    "Icon-App-60x60@3x.png" = 180
    "Icon-App-1024x1024@1x.png" = 1024
}

# 生成iOS图标
Write-Host "生成iOS图标..." -ForegroundColor Yellow
foreach ($filename in $iosSizes.Keys) {
    $size = $iosSizes[$filename]
    $sourceFile = "assets/images/logo.png"
    $targetFile = "$iosDir/$filename"
    
    $originalImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourceFile))
    $resizedImage = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($originalImage, 0, 0, $size, $size)
    $resizedImage.Save((Resolve-Path $targetFile), [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $resizedImage.Dispose()
    $originalImage.Dispose()
    
    Write-Host "生成: $targetFile ($size x $size)" -ForegroundColor Cyan
}

Write-Host "应用图标生成完成！" -ForegroundColor Green
Write-Host "Android图标已保存到: android/app/src/main/res/mipmap-*/" -ForegroundColor Cyan
Write-Host "iOS图标已保存到: ios/Runner/Assets.xcassets/AppIcon.appiconset/" -ForegroundColor Cyan
