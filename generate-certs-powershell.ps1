# PowerShell script to generate self-signed SSL certificates using Windows built-in tools
Write-Host "🔐 使用 PowerShell 生成自签名 SSL 证书..." -ForegroundColor Green

# Create certs directory if it doesn't exist
if (!(Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs" | Out-Null
    Write-Host "📁 创建 certs 目录" -ForegroundColor Yellow
}

try {
    # Generate self-signed certificate using PowerShell
    Write-Host "🔑 生成自签名证书..." -ForegroundColor Yellow
    
    $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1) -FriendlyName "Development Certificate" -KeyUsageProperty All -KeyUsage CertSign,CRLSign,DigitalSignature
    
    # Export certificate to PEM format
    $certPath = Join-Path $PWD "certs\cert.pem"
    $keyPath = Join-Path $PWD "certs\key.pem"
    
    # Export the certificate
    Export-Certificate -Cert $cert -FilePath "certs\cert.cer"
    
    # Convert to PEM format using certutil
    certutil -encode "certs\cert.cer" $certPath
    
    # Export private key (requires Windows 10/Server 2016+)
    $certWithKey = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object {$_.Thumbprint -eq $cert.Thumbprint}
    
    # Remove the certificate from store (optional, for cleanup)
    Remove-Item -Path "cert:\LocalMachine\My\$($cert.Thumbprint)" -Force
    
    Write-Host "✅ 证书生成成功!" -ForegroundColor Green
    Write-Host "📁 文件已创建:" -ForegroundColor Green
    Write-Host "   - certs\cert.pem (证书)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  注意: 这是自签名证书，浏览器会显示安全警告" -ForegroundColor Yellow
    Write-Host "🚀 现在可以运行: npm run dev:https" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ 生成证书失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 建议安装 OpenSSL 或使用 Git Bash" -ForegroundColor Yellow
    exit 1
}

