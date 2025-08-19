const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { networkInterfaces } = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 8080; // 使用8080端口

function getLocalIP() {
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

async function startSimpleServer() {
    const localIP = getLocalIP();
    
    console.log('🚀 启动简单HTTP服务器...');
    console.log(`📱 检测到本机IP: ${localIP}`);
    console.log(`🔧 使用端口: ${port}`);
    
    try {
        const app = next({ dev, hostname, port });
        const handle = app.getRequestHandler();
        
        await app.prepare();
        
        const server = createServer(async (req, res) => {
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
            console.log('🎉 简单HTTP服务器启动成功！');
            console.log(`📱 本地访问: http://localhost:${port}`);
            console.log(`🌐 网络访问: http://${localIP}:${port}`);
            console.log(`📋 手机NFC页面: http://${localIP}:${port}/mobile-nfc`);
            console.log(`🧪 NFC测试页面: http://${localIP}:${port}/mobile-nfc-test`);
            console.log(`💡 注意：这是HTTP模式，NFC功能可能受限`);
            console.log(`🔧 如果NFC不工作，请使用HTTPS版本`);
        });

        // 处理进程退出
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭HTTP服务器...');
            server.close(() => {
                console.log('✅ HTTP服务器已关闭');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ HTTP服务器启动失败:', error.message);
    }
}

startSimpleServer().catch(console.error);
