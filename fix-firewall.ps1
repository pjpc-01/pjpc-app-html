# 修复防火墙设置脚本
# 需要以管理员身份运行

Write-Host "🔧 修复防火墙设置..." -ForegroundColor Green
Write-Host "📱 允许手机访问HTTPS服务器" -ForegroundColor Cyan

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ 需要管理员权限！" -ForegroundColor Red
    Write-Host "💡 请右键点击PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    Write-Host "💡 然后运行: .\fix-firewall.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ 检测到管理员权限" -ForegroundColor Green

# 删除现有规则（如果存在）
Write-Host "🗑️ 清理现有规则..." -ForegroundColor Blue
netsh advfirewall firewall delete rule name="Node.js HTTPS Server" 2>$null
netsh advfirewall firewall delete rule name="Node.js HTTP Server" 2>$null

# 添加新的防火墙规则
Write-Host "➕ 添加防火墙规则..." -ForegroundColor Blue

# HTTPS规则
netsh advfirewall firewall add rule name="Node.js HTTPS Server" dir=in action=allow protocol=TCP localport=3000-3010
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HTTPS防火墙规则添加成功" -ForegroundColor Green
} else {
    Write-Host "❌ HTTPS防火墙规则添加失败" -ForegroundColor Red
}

# HTTP规则（备用）
netsh advfirewall firewall add rule name="Node.js HTTP Server" dir=in action=allow protocol=TCP localport=3000-3010
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HTTP防火墙规则添加成功" -ForegroundColor Green
} else {
    Write-Host "❌ HTTP防火墙规则添加失败" -ForegroundColor Red
}

# 验证规则
Write-Host "🔍 验证防火墙规则..." -ForegroundColor Blue
netsh advfirewall firewall show rule name="Node.js HTTPS Server"
netsh advfirewall firewall show rule name="Node.js HTTP Server"

Write-Host "🎉 防火墙设置完成！" -ForegroundColor Green
Write-Host "📱 现在手机应该可以访问您的服务器了" -ForegroundColor Cyan
Write-Host "🌐 访问地址: https://192.168.0.70:3000" -ForegroundColor Yellow

pause
