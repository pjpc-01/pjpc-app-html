const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const net = require('net');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';

// 使用常用端口，通常不会被防火墙阻止
const commonPorts = [80, 443, 8080, 8443, 3000, 3001];

class SimplePortManager {
    constructor() {
        this.currentPort = null;
    }

    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, hostname, () => {
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            
            server.on('error', () => {
                resolve(false);
            });
        });
    }

    async findAvailablePort() {
        console.log('🔍 正在检测常用端口...');
        
        for (const port of commonPorts) {
            const isAvailable = await this.isPortAvailable(port);
            if (isAvailable) {
                this.currentPort = port;
                console.log(`✅ 找到可用端口: ${port}`);
                return port;
            } else {
                console.log(`⚠️ 端口 ${port} 被占用，尝试下一个...`);
            }
        }
        
        throw new Error('所有常用端口都被占用');
    }

    getCurrentPort() {
        return this.currentPort;
    }
}

class SimpleCertificateManager {
    constructor() {
        this.certPath = 'cert.crt';
        this.keyPath = 'cert.key';
    }

    checkCertificates() {
        try {
            const certExists = fs.existsSync(this.certPath) && fs.existsSync(this.keyPath);
            if (certExists) {
                console.log('✅ 发现现有证书文件');
                return true;
            }
            console.log('⚠️ 未找到证书文件，将使用HTTP模式');
            return false;
        } catch (error) {
            console.log('❌ 检查证书时出错:', error.message);
            return false;
        }
    }

    getHttpsOptions() {
        return {
            cert: fs.readFileSync(this.certPath),
            key: fs.readFileSync(this.keyPath)
        };
    }
}

function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const localIPs = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIPs.push(net.address);
            }
        }
    }
    
    if (localIPs.length > 0) {
        console.log(`🔍 找到局域网IP: ${localIPs.join(', ')}`);
        return localIPs[0];
    }
    
    console.log('⚠️ 未找到网络IP，使用localhost');
    return 'localhost';
}

async function startServer() {
    const portManager = new SimplePortManager();
    const certManager = new SimpleCertificateManager();
    const localIP = getLocalIP();
    
    console.log('🚀 启动简化HTTPS服务器...');
    console.log(`📱 检测到本机IP: ${localIP}`);
    
    try {
        const port = await portManager.findAvailablePort();
        
        const app = next({ dev, hostname, port });
        const handle = app.getRequestHandler();
        
        await app.prepare();
        
        const hasCertificates = certManager.checkCertificates();
        
        if (hasCertificates) {
            // 启动HTTPS服务器
            const httpsOptions = certManager.getHttpsOptions();
            const server = createServer(httpsOptions, async (req, res) => {
                try {
                    const parsedUrl = parse(req.url, true);
                    await handle(req, res, parsedUrl);
                } catch (err) {
                    console.error('Error occurred handling', req.url, err);
                    res.statusCode = 500;
                    res.end('internal server error');
                }
            });

            server.listen(port, hostname, (err) => {
                if (err) throw err;
                console.log('🎉 简化HTTPS服务器启动成功！');
                console.log(`📱 本地访问: https://localhost:${port}`);
                console.log(`🌐 网络访问: https://${localIP}:${port}`);
                console.log(`📋 手机NFC页面: https://${localIP}:${port}/mobile-nfc`);
                console.log(`🧪 NFC测试页面: https://${localIP}:${port}/mobile-nfc-test`);
                console.log(`✅ 使用常用端口 ${port}，防火墙通常不会阻止！`);
            });
        } else {
            // 启动HTTP服务器
            const server = createHttpServer(async (req, res) => {
                try {
                    const parsedUrl = parse(req.url, true);
                    await handle(req, res, parsedUrl);
                } catch (err) {
                    console.error('Error occurred handling', req.url, err);
                    res.statusCode = 500;
                    res.end('internal server error');
                }
            });

            server.listen(port, hostname, (err) => {
                if (err) throw err;
                console.log('⚠️ HTTP服务器启动成功');
                console.log(`📱 本地访问: http://localhost:${port}`);
                console.log(`🌐 网络访问: http://${localIP}:${port}`);
                console.log(`📋 手机NFC页面: http://${localIP}:${port}/mobile-nfc`);
                console.log(`💡 注意：NFC功能需要HTTPS，建议配置SSL证书`);
            });
        }

        // 处理进程退出
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭服务器...');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ 服务器启动失败:', error.message);
    }
}

startServer().catch(console.error);
