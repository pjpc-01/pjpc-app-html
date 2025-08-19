const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const defaultPort = 3000;

// 智能端口管理
class SmartPortManager {
    constructor() {
        this.portRange = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
        this.currentPort = null;
    }

    // 检查端口是否可用
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

    // 查找可用端口
    async findAvailablePort() {
        console.log('🔍 正在检测可用端口...');
        
        for (const port of this.portRange) {
            const isAvailable = await this.isPortAvailable(port);
            if (isAvailable) {
                this.currentPort = port;
                console.log(`✅ 找到可用端口: ${port}`);
                return port;
            } else {
                console.log(`⚠️ 端口 ${port} 被占用，尝试下一个...`);
            }
        }
        
        throw new Error('所有端口都被占用，无法启动服务器');
    }

    // 获取当前端口
    getCurrentPort() {
        return this.currentPort;
    }
}

// 准备Next.js应用（端口将在运行时确定）
let app = null;
let handle = null;

// 智能证书管理
class SmartCertificateManager {
    constructor() {
        this.certPath = 'cert.crt';
        this.keyPath = 'cert.key';
        this.caCertPath = 'ca.crt';
        this.caKeyPath = 'ca.key';
    }

    // 检查证书是否存在且有效
    checkCertificates() {
        try {
            const certExists = fs.existsSync(this.certPath) && fs.existsSync(this.keyPath);
            const caExists = fs.existsSync(this.caCertPath) && fs.existsSync(this.caKeyPath);
            
            if (certExists && caExists) {
                console.log('✅ 发现现有证书文件');
                return true;
            }
            
            console.log('⚠️ 未找到证书文件，将自动生成');
            return false;
        } catch (error) {
            console.log('❌ 检查证书时出错:', error.message);
            return false;
        }
    }

    // 自动生成证书
    async generateCertificates() {
        try {
            console.log('🔐 正在自动生成SSL证书...');
            
            // 检查是否安装了mkcert
            const hasMkcert = this.checkMkcert();
            
            if (hasMkcert) {
                await this.generateWithMkcert();
            } else {
                await this.generateWithOpenSSL();
            }
            
            console.log('✅ SSL证书生成完成');
            return true;
        } catch (error) {
            console.error('❌ 生成证书失败:', error.message);
            return false;
        }
    }

    // 检查mkcert是否可用
    checkMkcert() {
        try {
            execSync('mkcert --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    // 使用mkcert生成证书
    async generateWithMkcert() {
        console.log('🔧 使用mkcert生成证书...');
        
        try {
            // 生成CA证书
            execSync('mkcert create-ca', { stdio: 'inherit' });
            
            // 生成服务器证书
            execSync('mkcert create-cert localhost 192.168.0.72', { stdio: 'inherit' });
            
            console.log('✅ mkcert证书生成成功');
        } catch (error) {
            throw new Error(`mkcert生成失败: ${error.message}`);
        }
    }

    // 使用OpenSSL生成证书
    async generateWithOpenSSL() {
        console.log('🔧 使用OpenSSL生成自签名证书...');
        
        try {
            // 生成CA私钥
            execSync('openssl genrsa -out ca.key 2048', { stdio: 'ignore' });
            
            // 生成CA证书
            execSync('openssl req -new -x509 -key ca.key -out ca.crt -days 365 -subj "/C=CN/ST=Local/L=Local/O=Development/CN=LocalCA"', { stdio: 'ignore' });
            
            // 生成服务器私钥
            execSync('openssl genrsa -out cert.key 2048', { stdio: 'ignore' });
            
            // 生成服务器证书
            execSync('openssl req -new -x509 -key cert.key -out cert.crt -days 365 -subj "/C=CN/ST=Local/L=Local/O=Development/CN=localhost"', { stdio: 'ignore' });
            
            console.log('✅ OpenSSL证书生成成功');
        } catch (error) {
            throw new Error(`OpenSSL生成失败: ${error.message}`);
        }
    }

    // 获取HTTPS配置
    getHttpsOptions() {
        try {
            return {
                key: fs.readFileSync(this.keyPath),
                cert: fs.readFileSync(this.certPath)
            };
        } catch (error) {
            throw new Error(`读取证书文件失败: ${error.message}`);
        }
    }
}

// 获取本机IP地址
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    // 优先查找局域网IP地址
    const localIPs = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                const ip = net.address;
                // 优先选择常见的局域网IP段
                if (ip.startsWith('192.168.') || 
                    ip.startsWith('10.') || 
                    ip.startsWith('172.')) {
                    localIPs.push(ip);
                }
            }
        }
    }
    
    // 如果找到局域网IP，返回第一个
    if (localIPs.length > 0) {
        console.log(`🔍 找到局域网IP: ${localIPs.join(', ')}`);
        return localIPs[0];
    }
    
    // 如果没有找到局域网IP，查找任何非内部IP
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                const ip = net.address;
                console.log(`🔍 找到网络IP: ${ip}`);
                return ip;
            }
        }
    }
    
    console.log('⚠️ 未找到网络IP，使用localhost');
    return 'localhost';
}

// 主启动函数
async function startServer() {
    const portManager = new SmartPortManager();
    const certManager = new SmartCertificateManager();
    const localIP = getLocalIP();
    
    console.log('🚀 启动智能HTTPS服务器...');
    console.log(`📱 检测到本机IP: ${localIP}`);
    
    try {
        // 查找可用端口
        const port = await portManager.findAvailablePort();
        
        // 初始化Next.js应用
        app = next({ dev, hostname, port });
        handle = app.getRequestHandler();
        
        // 检查证书
        const hasCertificates = certManager.checkCertificates();
        
        if (!hasCertificates) {
            // 自动生成证书
            const generated = await certManager.generateCertificates();
            if (!generated) {
                console.log('⚠️ 证书生成失败，将使用HTTP模式');
                await startHttpServer(portManager);
                return;
            }
        }
        
        // 启动HTTPS服务器
        await startHttpsServer(certManager, localIP, portManager);
        
    } catch (error) {
        console.error('❌ HTTPS启动失败:', error.message);
        console.log('⚠️ 切换到HTTP模式...');
        await startHttpServer(portManager);
    }
}

// 启动HTTPS服务器
async function startHttpsServer(certManager, localIP, portManager) {
    await app.prepare();
    
    const port = portManager.getCurrentPort();
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
        console.log('🎉 智能HTTPS服务器启动成功！');
        console.log(`📱 本地访问: https://localhost:${port}`);
        console.log(`🌐 网络访问: https://${localIP}:${port}`);
        console.log(`📋 手机NFC页面: https://${localIP}:${port}/mobile-nfc`);
        console.log(`🧪 NFC测试页面: https://${localIP}:${port}/mobile-nfc-test`);
        console.log(`✅ 自动配置完成，无需手动设置！`);
        console.log(`📱 现在可以在手机上正常使用NFC功能了！`);
    });

    // 处理进程退出
    process.on('SIGINT', () => {
        console.log('\n🛑 正在关闭HTTPS服务器...');
        server.close(() => {
            console.log('✅ HTTPS服务器已关闭');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 正在关闭HTTPS服务器...');
        server.close(() => {
            console.log('✅ HTTPS服务器已关闭');
            process.exit(0);
        });
    });
}

// 启动HTTP服务器（备用方案）
async function startHttpServer(portManager) {
    await app.prepare();
    
    const port = portManager.getCurrentPort();
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
        console.log('⚠️ HTTP服务器启动成功（NFC功能可能受限）');
        console.log(`📱 本地访问: http://localhost:${port}`);
        console.log(`🌐 网络访问: http://${getLocalIP()}:${port}`);
        console.log(`💡 建议配置HTTPS以获得完整的NFC功能`);
    });
}

// 启动服务器
startServer().catch(console.error);
