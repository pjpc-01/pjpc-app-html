# 简单的HTTPS启动脚本
Write-Host "🔐 启动PJPC HTTPS服务器..." -ForegroundColor Green

# 检查证书文件是否存在
if (-not (Test-Path "cert.key") -or -not (Test-Path "cert.crt")) {
    Write-Host "❌ 未找到SSL证书文件" -ForegroundColor Red
    Write-Host "请先运行: mkcert create-ca" -ForegroundColor Yellow
    Write-Host "然后运行: mkcert create-cert localhost 192.168.0.72" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSL证书文件已找到" -ForegroundColor Green
Write-Host "🚀 启动HTTPS服务器..." -ForegroundColor Blue

# 启动HTTPS服务器
node server.js
