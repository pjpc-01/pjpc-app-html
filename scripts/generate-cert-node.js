const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建certs目录
const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

console.log('🔐 使用Node.js生成自签名SSL证书...');

try {
  // 使用Node.js的crypto模块生成证书
  const crypto = require('crypto');
  const forge = require('node-forge');
  
  // 生成密钥对
  const keys = forge.pki.rsa.generateKeyPair(2048);
  
  // 创建证书
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
  // 设置证书主题
  const attrs = [{
    name: 'countryName',
    value: 'CN'
  }, {
    name: 'stateOrProvinceName',
    value: 'State'
  }, {
    name: 'localityName',
    value: 'City'
  }, {
    name: 'organizationName',
    value: 'Development'
  }, {
    name: 'organizationalUnitName',
    value: 'IT'
  }, {
    name: 'commonName',
    value: 'localhost'
  }];
  
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  
  // 设置扩展
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 2, // DNS
      value: 'localhost'
    }, {
      type: 7, // IP
      ip: '127.0.0.1'
    }]
  }]);
  
  // 签名证书
  cert.sign(keys.privateKey);
  
  // 保存证书和私钥
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  
  fs.writeFileSync(path.join(certsDir, 'localhost.crt'), certPem);
  fs.writeFileSync(path.join(certsDir, 'localhost.key'), keyPem);
  
  console.log('✅ SSL证书生成完成');
  console.log('📁 证书位置:', path.join(certsDir, 'localhost.crt'));
  console.log('🔑 私钥位置:', path.join(certsDir, 'localhost.key'));
  
} catch (error) {
  console.error('❌ 使用Node.js生成证书失败:', error.message);
  
  // 备用方案：使用Windows内置的证书工具
  console.log('🔄 尝试使用Windows内置工具...');
  
  try {
    // 使用PowerShell的New-SelfSignedCertificate命令
    const psCommand = `
      $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\\LocalMachine\\My" -NotAfter (Get-Date).AddYears(1)
      $pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
      Export-PfxCertificate -Cert $cert -FilePath "${path.join(certsDir, 'localhost.pfx')}" -Password $pwd
      Export-Certificate -Cert $cert -FilePath "${path.join(certsDir, 'localhost.crt')}"
    `;
    
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
    
    // 从PFX提取私钥（需要额外的工具）
    console.log('⚠️  Windows证书已生成，但需要手动提取私钥');
    console.log('💡 建议：安装OpenSSL或使用在线证书生成工具');
    
  } catch (psError) {
    console.error('❌ Windows证书生成也失败:', psError.message);
    console.log('💡 建议解决方案：');
    console.log('1. 安装OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
    console.log('2. 使用在线证书生成工具');
    console.log('3. 使用现有的证书文件');
  }
}

