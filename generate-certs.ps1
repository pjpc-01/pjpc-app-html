# PowerShell script to generate self-signed SSL certificates for development
Write-Host "🔐 Generating self-signed SSL certificates for development..." -ForegroundColor Green

# Check if OpenSSL is available
try {
    $opensslVersion = & openssl version 2>$null
    Write-Host "✅ OpenSSL found: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenSSL not found. Please install OpenSSL or use Git Bash." -ForegroundColor Red
    Write-Host "💡 You can install OpenSSL via:" -ForegroundColor Yellow
    Write-Host "   - Chocolatey: choco install openssl" -ForegroundColor Yellow
    Write-Host "   - Or download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    exit 1
}

# Create certs directory if it doesn't exist
if (!(Test-Path "certs")) {
    New-Item -ItemType Directory -Path "certs" | Out-Null
}

# Generate private key and certificate
Write-Host "Generating private key and certificate..." -ForegroundColor Yellow
& openssl req -x509 -newkey rsa:4096 -keyout "certs\key.pem" -out "certs\cert.pem" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificates generated successfully!" -ForegroundColor Green
    Write-Host "📁 Files created:" -ForegroundColor Green
    Write-Host "   - certs\cert.pem (certificate)" -ForegroundColor White
    Write-Host "   - certs\key.pem (private key)" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 You can now run: npm run dev:https" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to generate certificates" -ForegroundColor Red
    exit 1
}
