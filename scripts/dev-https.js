const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 检查证书文件是否存在
const certDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('❌ SSL 证书文件不存在！');
    console.log('请先运行: powershell -ExecutionPolicy Bypass -File scripts/generate-ssl-cert.ps1');
    process.exit(1);
}

console.log('🔐 启动 HTTPS 开发服务器...');
console.log('📁 使用证书:', certPath);
console.log('🔑 使用私钥:', keyPath);

// 设置环境变量
process.env.NODE_OPTIONS = '--openssl-legacy-provider --max-old-space-size=4096';
process.env.HTTPS = 'true';
process.env.SSL_CRT_FILE = certPath;
process.env.SSL_KEY_FILE = keyPath;

// 启动 Next.js 开发服务器
const nextDev = spawn('node', ['node_modules/.bin/next', 'dev', '-H', '0.0.0.0', '-p', '3000'], {
    stdio: 'inherit',
    env: process.env
});

nextDev.on('error', (error) => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
});

nextDev.on('close', (code) => {
    console.log(`🚪 开发服务器已关闭，退出码: ${code}`);
    process.exit(code);
});

// 处理进程退出
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    nextDev.kill('SIGTERM');
});
