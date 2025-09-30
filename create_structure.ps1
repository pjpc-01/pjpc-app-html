# 创建功能模块目录结构
$features = @("auth", "attendance", "student", "teacher", "finance", "leave", "nfc", "notification", "reports")
$subdirs = @("screens", "widgets", "services", "providers")

foreach ($feature in $features) {
    foreach ($subdir in $subdirs) {
        $path = "lib\features\$feature\$subdir"
        if (!(Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force
            Write-Host "Created: $path"
        }
    }
}

# 创建共享目录
$sharedDirs = @("lib\shared", "lib\shared\widgets", "lib\shared\services", "lib\shared\providers", "lib\shared\utils")
foreach ($dir in $sharedDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created: $dir"
    }
}

# 创建核心目录
$coreDirs = @("lib\core", "lib\core\config", "lib\core\theme", "lib\core\constants")
foreach ($dir in $coreDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created: $dir"
    }
}

Write-Host "Directory structure created successfully!"

