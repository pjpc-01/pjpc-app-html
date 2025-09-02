# Generate self-signed SSL certificate
Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Green

# Create certificate
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)

# Set password
$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText

# Export PFX file
Export-PfxCertificate -Cert $cert -FilePath "certs\localhost.pfx" -Password $pwd

# Export CRT file
Export-Certificate -Cert $cert -FilePath "certs\localhost.crt" -Type CERT

Write-Host "Certificate generated successfully!" -ForegroundColor Green
Write-Host "Certificate location: certs\localhost.crt" -ForegroundColor Yellow
Write-Host "PFX location: certs\localhost.pfx" -ForegroundColor Yellow
