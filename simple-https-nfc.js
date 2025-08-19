const https = require('https');
const http = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// 自动生成自签名证书
function generateSelfSignedCert() {
    console.log('🔐 正在生成自签名SSL证书...');
    
    const certDir = 'certs';
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir);
    }
    
    const keyPath = path.join(certDir, 'localhost-key.pem');
    const certPath = path.join(certDir, 'localhost.pem');
    
    // 如果证书已存在，直接使用
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        console.log('✅ 发现现有证书文件');
        return { keyPath, certPath };
    }
    
    // 生成私钥
    const privateKey = crypto.generateKeyPairSync('rsa', {
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
    
    // 生成证书
    const cert = crypto.createCertificate();
    cert.setPublicKey(privateKey.publicKey);
    cert.setPrivateKey(privateKey.privateKey);
    cert.setSubject([
        { shortName: 'C', value: 'CN' },
        { shortName: 'ST', value: 'Local' },
        { shortName: 'L', value: 'Local' },
        { shortName: 'O', value: 'Development' },
        { shortName: 'CN', value: 'localhost' }
    ]);
    cert.setIssuer([
        { shortName: 'C', value: 'CN' },
        { shortName: 'ST', value: 'Local' },
        { shortName: 'L', value: 'Local' },
        { shortName: 'O', value: 'Development' },
        { shortName: 'CN', value: 'localhost' }
    ]);
    cert.sign(privateKey.privateKey, 'sha256');
    
    // 保存证书文件
    fs.writeFileSync(keyPath, privateKey.privateKey);
    fs.writeFileSync(certPath, cert.getPEM());
    
    console.log('✅ 自签名证书生成完成');
    return { keyPath, certPath };
}

// 准备Next.js应用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    try {
        // 生成证书
        const { keyPath, certPath } = generateSelfSignedCert();
        
        // 读取证书文件
        const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
        
        // 创建HTTPS服务器
        const httpsServer = https.createServer(httpsOptions, async (req, res) => {
            try {
                const parsedUrl = parse(req.url, true);
                await handle(req, res, parsedUrl);
            } catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        });
        
        // 创建HTTP服务器（重定向到HTTPS）
        const httpServer = http.createServer((req, res) => {
            const httpsUrl = `https://${req.headers.host}${req.url}`;
            res.writeHead(301, { Location: httpsUrl });
            res.end();
        });
        
        // 启动服务器
        httpsServer.listen(port, hostname, (err) => {
            if (err) throw err;
            console.log(`🚀 HTTPS 服务器已启动`);
            console.log(`📱 本地访问: https://localhost:${port}`);
            console.log(`📱 手机访问: https://[您的IP]:${port}`);
            console.log(`🔐 NFC测试页面: https://localhost:${port}/mobile-nfc-test`);
            console.log(`⚠️  注意: 首次访问时浏览器会显示安全警告，请点击"高级" -> "继续访问"`);
        });
        
        // 启动HTTP重定向服务器
        httpServer.listen(3001, hostname, (err) => {
            if (err) throw err;
            console.log(`🔄 HTTP重定向服务器已启动: http://localhost:3001`);
        });
        
        // 获取本机IP地址
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        const localIPs = [];
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    const ip = net.address;
                    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                        localIPs.push(ip);
                    }
                }
            }
        }
        
        if (localIPs.length > 0) {
            console.log(`📱 手机访问地址:`);
            localIPs.forEach(ip => {
                console.log(`   https://${ip}:${port}/mobile-nfc-test`);
            });
        }
        
    } catch (error) {
        console.error('❌ 启动HTTPS服务器失败:', error);
        process.exit(1);
    }
}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});

// 处理进程退出
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});
