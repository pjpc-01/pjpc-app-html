# HTTPS 开发服务器启动脚本
# 用于支持 NFC 功能的本地开发

Write-Host "🔐 启动 PJPC HTTPS 开发服务器..." -ForegroundColor Green

# 检查证书是否存在
$certDir = "certs"
$keyPath = "$certDir/localhost-key.pem"
$certPath = "$certDir/localhost.pem"

if (!(Test-Path $keyPath) -or !(Test-Path $certPath)) {
    Write-Host "❌ SSL 证书文件不存在！" -ForegroundColor Red
    Write-Host "🔧 正在生成 SSL 证书..." -ForegroundColor Yellow
    
    # 运行证书生成脚本
    & "powershell" "-ExecutionPolicy" "Bypass" "-File" "scripts/generate-ssl-cert.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 证书生成失败！" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ SSL 证书检查通过" -ForegroundColor Green
Write-Host "🚀 启动 HTTPS 开发服务器..." -ForegroundColor Cyan

# 启动 HTTPS 开发服务器
npm run dev:https
