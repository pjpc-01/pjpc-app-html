const net = require('net');

// 测试端口检测功能
async function testPortDetection() {
    console.log('🧪 测试端口检测功能...');
    
    const portRange = [3000, 3001, 3002, 3003, 3004, 3005];
    
    for (const port of portRange) {
        const isAvailable = await isPortAvailable(port);
        console.log(`端口 ${port}: ${isAvailable ? '✅ 可用' : '❌ 被占用'}`);
    }
}

// 检查端口是否可用
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, '0.0.0.0', () => {
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

// 运行测试
testPortDetection().catch(console.error);
