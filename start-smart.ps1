# 智能HTTPS服务器启动脚本
# 自动配置HTTPS，无需手动设置

Write-Host "🚀 启动智能HTTPS服务器..." -ForegroundColor Green
Write-Host "📱 自动配置HTTPS，支持手机NFC功能" -ForegroundColor Cyan
Write-Host "✅ 无需手动配置证书" -ForegroundColor Yellow

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未找到Node.js，请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 启动智能HTTPS服务器..." -ForegroundColor Blue
Write-Host "💡 系统将自动检测并生成SSL证书" -ForegroundColor Cyan
Write-Host "📱 支持手机NFC功能测试" -ForegroundColor Green

# 启动智能HTTPS服务器
node smart-https-server.js
