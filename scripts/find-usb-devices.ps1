# USB设备信息查找脚本
Write-Host "正在查找USB设备信息..." -ForegroundColor Green

# 获取所有USB设备
$usbDevices = Get-WmiObject -Class Win32_USBHub | Where-Object { $_.DeviceID -match "VID_" }

Write-Host "`n找到的USB设备:" -ForegroundColor Yellow
Write-Host ("=" * 50)

foreach ($device in $usbDevices) {
    if ($device.DeviceID -match "VID_([0-9A-F]{4})&PID_([0-9A-F]{4})") {
        $vendorId = $matches[1]
        $productId = $matches[2]
        
        Write-Host "设备名称: $($device.Name)" -ForegroundColor Cyan
        Write-Host "设备ID: $($device.DeviceID)" -ForegroundColor White
        Write-Host "Vendor ID: 0x$vendorId ($([Convert]::ToInt32($vendorId, 16)))" -ForegroundColor Green
        Write-Host "Product ID: 0x$productId ($([Convert]::ToInt32($productId, 16)))" -ForegroundColor Green
        Write-Host "状态: $($device.Status)" -ForegroundColor Yellow
        Write-Host ("-" * 50)
    }
}

# 查找HID设备
Write-Host "`n查找HID设备..." -ForegroundColor Yellow
$hidDevices = Get-WmiObject -Class Win32_PnPEntity | Where-Object { 
    $_.Name -match "HID" -or $_.Name -match "Human Interface" 
}

foreach ($device in $hidDevices) {
    Write-Host "HID设备: $($device.Name)" -ForegroundColor Cyan
    Write-Host "设备ID: $($device.DeviceID)" -ForegroundColor White
    Write-Host "状态: $($device.Status)" -ForegroundColor Yellow
    Write-Host ("-" * 30)
}

Write-Host "`n脚本执行完成！" -ForegroundColor Green
Write-Host "请将找到的Vendor ID和Product ID提供给开发人员。" -ForegroundColor Yellow
