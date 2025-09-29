const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 为开发环境生成有效的 SSL 证书...');

// 确保 certs 目录存在
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
    console.log('📁 创建 certs 目录');
}

try {
    // 使用 Node.js crypto 模块生成有效的证书
    const crypto = require('crypto');
    
    // 生成 RSA 密钥对
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // 创建自签名证书
    const cert = crypto.createCertificate({
        publicKey: publicKey,
        privateKey: privateKey,
        serialNumber: '01',
        notBefore: new Date(),
        notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        subject: {
            commonName: 'localhost',
            country: 'US',
            state: 'State',
            locality: 'City',
            organization: 'Development',
            organizationalUnit: 'IT'
        },
        issuer: {
            commonName: 'localhost',
            country: 'US',
            state: 'State',
            locality: 'City',
            organization: 'Development',
            organizationalUnit: 'IT'
        }
    });

    // 写入文件
    const keyPath = path.join(certsDir, 'key.pem');
    const certPath = path.join(certsDir, 'cert.pem');

    fs.writeFileSync(keyPath, privateKey);
    fs.writeFileSync(certPath, cert.toString());
    
    console.log('✅ 有效证书生成成功!');
    console.log('📁 文件已创建:');
    console.log(`   - ${certPath} (证书)`);
    console.log(`   - ${keyPath} (私钥)`);
    console.log('');
    console.log('🚀 现在可以运行: npm run dev:https');
    
} catch (error) {
    console.error('❌ 生成证书失败:', error.message);
    
    // 如果 Node.js 方法失败，尝试使用系统命令
    console.log('🔄 尝试使用系统命令生成证书...');
    
    try {
        // 尝试使用 PowerShell 生成证书
        const psScript = `
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(1)
$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "certs\\localhost.pfx" -Password $pwd
$certPath = "certs\\cert.pem"
$keyPath = "certs\\key.pem"
openssl pkcs12 -in "certs\\localhost.pfx" -out $certPath -clcerts -nokeys -passin pass:password
openssl pkcs12 -in "certs\\localhost.pfx" -out $keyPath -nocerts -nodes -passin pass:password
Remove-Item "certs\\localhost.pfx"
Remove-Item "cert:\\CurrentUser\\My\\$($cert.Thumbprint)"
`;
        
        execSync(`powershell -Command "${psScript}"`, { stdio: 'inherit' });
        console.log('✅ 使用 PowerShell 生成证书成功!');
        
    } catch (psError) {
        console.error('❌ PowerShell 方法也失败了:', psError.message);
        console.log('💡 请手动安装 OpenSSL 或使用 Git Bash');
        process.exit(1);
    }
}