# 简单的证书生成脚本
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "certs\localhost-new.pfx" -Password $pwd
Remove-Item "cert:\CurrentUser\My\$($cert.Thumbprint)"
Write-Host "新证书生成完成: certs\localhost-new.pfx"

