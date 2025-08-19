const net = require('net');
const { networkInterfaces } = require('os');

// 测试网络连接
async function testConnection() {
    console.log('🌐 网络连接测试工具');
    console.log('='.repeat(50));
    
    // 获取本机IP
    const localIP = getLocalIP();
    console.log(`📱 本机IP: ${localIP}`);
    
    // 测试端口连接
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    
    for (const port of ports) {
        const isOpen = await testPort(localIP, port);
        console.log(`端口 ${port}: ${isOpen ? '✅ 开放' : '❌ 关闭'}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 如果端口显示"关闭"，请检查：');
    console.log('1. 防火墙设置');
    console.log('2. 服务器是否启动');
    console.log('3. 端口是否被占用');
}

// 获取本机IP
function getLocalIP() {
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                const ip = net.address;
                if (ip.startsWith('192.168.') || 
                    ip.startsWith('10.') || 
                    ip.startsWith('172.')) {
                    return ip;
                }
            }
        }
    }
    return 'localhost';
}

// 测试端口连接
function testPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(2000); // 2秒超时
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

// 运行测试
testConnection().catch(console.error);
