# 生成自签名 SSL 证书脚本
# 用于本地 HTTPS 开发环境

Write-Host "🔐 正在生成自签名 SSL 证书..." -ForegroundColor Green

# 创建证书目录
$certDir = "certs"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force
    Write-Host "✅ 创建证书目录: $certDir" -ForegroundColor Green
}

# 生成私钥
$privateKeyPath = "$certDir/localhost-key.pem"
$certPath = "$certDir/localhost.pem"

Write-Host "🔑 生成私钥..." -ForegroundColor Yellow
openssl genrsa -out $privateKeyPath 2048

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 私钥生成成功" -ForegroundColor Green
} else {
    Write-Host "❌ 私钥生成失败" -ForegroundColor Red
    exit 1
}

# 生成证书签名请求
Write-Host "📝 生成证书签名请求..." -ForegroundColor Yellow
openssl req -new -x509 -key $privateKeyPath -out $certPath -days 365 -subj "/C=CN/ST=Local/L=Local/O=Development/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 证书生成成功" -ForegroundColor Green
    Write-Host "📁 证书文件位置:" -ForegroundColor Cyan
    Write-Host "   私钥: $privateKeyPath" -ForegroundColor White
    Write-Host "   证书: $certPath" -ForegroundColor White
} else {
    Write-Host "❌ 证书生成失败" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 SSL 证书生成完成！" -ForegroundColor Green
Write-Host "💡 现在可以使用 'npm run dev:https' 启动 HTTPS 开发服务器" -ForegroundColor Cyan
