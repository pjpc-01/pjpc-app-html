# HTTPS开发服务器启动脚本
Write-Host "🚀 启动HTTPS开发服务器..." -ForegroundColor Green

# 检查Node.js是否安装
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未找到Node.js，请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 检查OpenSSL是否安装
try {
    $opensslVersion = openssl version
    Write-Host "✅ OpenSSL版本: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  未找到OpenSSL，将尝试使用内置证书生成" -ForegroundColor Yellow
}

# 安装依赖（如果需要）
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装项目依赖..." -ForegroundColor Yellow
    npm install
}

# 启动HTTPS开发服务器
Write-Host "🔐 启动HTTPS开发服务器..." -ForegroundColor Cyan
Write-Host "📍 访问地址: https://localhost:3000" -ForegroundColor Cyan
Write-Host "📱 NFC功能: 现在可以在HTTPS环境下使用NFC功能了!" -ForegroundColor Green
Write-Host "⚠️  注意: 首次访问时浏览器会显示安全警告，点击'高级'→'继续访问'即可" -ForegroundColor Yellow

# 启动服务器
node scripts/dev-https.js
