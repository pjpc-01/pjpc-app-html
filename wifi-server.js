const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const { networkInterfaces } = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 9000;

function getWiFiIP() {
    const nets = networkInterfaces();
    
    // 优先查找Wi-Fi接口
    for (const name of Object.keys(nets)) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wifi')) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`🔍 找到Wi-Fi IP: ${net.address}`);
                    return net.address;
                }
            }
        }
    }
    
    // 如果没有找到Wi-Fi，查找任何非内部IP
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
                console.log(`🔍 找到网络IP: ${net.address}`);
                return net.address;
            }
        }
    }
    
    console.log('⚠️ 未找到合适的网络IP');
    return 'localhost';
}

async function startWiFiServer() {
    const wifiIP = getWiFiIP();
    
    console.log('🚀 启动Wi-Fi专用服务器...');
    console.log(`📱 使用Wi-Fi IP: ${wifiIP}`);
    console.log(`🔧 使用端口: ${port}`);
    
    try {
        const app = next({ dev, hostname, port });
        const handle = app.getRequestHandler();
        
        await app.prepare();
        
        // 检查证书
        const certPath = 'cert.crt';
        const keyPath = 'cert.key';
        const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath);
        
        if (hasCertificates) {
            // 启动HTTPS服务器
            const httpsOptions = {
                cert: fs.readFileSync(certPath),
                key: fs.readFileSync(keyPath)
            };
            
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
                console.log('🎉 Wi-Fi HTTPS服务器启动成功！');
                console.log(`📱 本地访问: https://localhost:${port}`);
                console.log(`🌐 Wi-Fi访问: https://${wifiIP}:${port}`);
                console.log(`📋 手机NFC页面: https://${wifiIP}:${port}/mobile-nfc`);
                console.log(`🧪 NFC测试页面: https://${wifiIP}:${port}/mobile-nfc-test`);
                console.log(`✅ 请确保手机连接到同一个Wi-Fi网络！`);
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
                console.log('⚠️ Wi-Fi HTTP服务器启动成功');
                console.log(`📱 本地访问: http://localhost:${port}`);
                console.log(`🌐 Wi-Fi访问: http://${wifiIP}:${port}`);
                console.log(`📋 手机NFC页面: http://${wifiIP}:${port}/mobile-nfc`);
                console.log(`💡 注意：NFC功能需要HTTPS`);
            });
        }

        // 处理进程退出
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭Wi-Fi服务器...');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Wi-Fi服务器启动失败:', error.message);
    }
}

startWiFiServer().catch(console.error);
