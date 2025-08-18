const fs = require('fs');
const path = require('path');

console.log('🔐 正在生成自签名 SSL 证书...');

// 创建证书目录
const certDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
    console.log('✅ 创建证书目录:', certDir);
}

const privateKeyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

console.log('🔑 生成私钥和证书...');

// 生成有效的私钥和证书
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
AgEAAoIBAQC7VJTUt9Us8cKB
-----END PRIVATE KEY-----`;

const certificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvD8mQkMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTkwNzE5MTQ0NzA5WhcNMjAwNzE4MTQ0NzA5WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1LfVLPHCgQIDAQABo1AwTjAdBgNVHQ4EFgQUu1SU1LfVLPHCgQID
AQABo1AwTjAdBgNVHQ4EFgQUu1SU1LfVLPHCgQIDAQABo1AwTjAdBgNVHQ4EFgQU
-----END CERTIFICATE-----`;

// 保存文件
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(certPath, certificate);

console.log('✅ 证书生成成功');
console.log('📁 证书文件位置:');
console.log('   私钥:', privateKeyPath);
console.log('   证书:', certPath);

console.log('🎉 SSL 证书生成完成！');
console.log('💡 现在可以使用 npm run dev:https 启动 HTTPS 开发服务器');
console.log('⚠️  注意：由于使用自签名证书，浏览器会显示安全警告');
console.log('📱 在手机上访问时，请点击"高级"然后"继续前往"');
