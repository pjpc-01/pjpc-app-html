# Generate self-signed SSL certificate script
# For local HTTPS development environment

Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Green

# Create certificate directory
$certDir = "certs"
if (!(Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force
    Write-Host "Created certificate directory: $certDir" -ForegroundColor Green
}

# Generate private key
$privateKeyPath = "$certDir/localhost-key.pem"
$certPath = "$certDir/localhost.pem"

Write-Host "Generating private key..." -ForegroundColor Yellow
openssl genrsa -out $privateKeyPath 2048

if ($LASTEXITCODE -eq 0) {
    Write-Host "Private key generated successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to generate private key" -ForegroundColor Red
    exit 1
}

# Generate certificate signing request
Write-Host "Generating certificate signing request..." -ForegroundColor Yellow
openssl req -new -x509 -key $privateKeyPath -out $certPath -days 365 -subj "/C=CN/ST=Local/L=Local/O=Development/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificate generated successfully" -ForegroundColor Green
    Write-Host "Certificate file locations:" -ForegroundColor Cyan
    Write-Host "   Private key: $privateKeyPath" -ForegroundColor White
    Write-Host "   Certificate: $certPath" -ForegroundColor White
} else {
    Write-Host "Failed to generate certificate" -ForegroundColor Red
    exit 1
}

Write-Host "SSL certificate generation completed!" -ForegroundColor Green
Write-Host "You can now use 'npm run dev:https' to start HTTPS development server" -ForegroundColor Cyan
