const { networkInterfaces } = require('os');

// 显示所有网络接口信息
function showAllNetworkInterfaces() {
    console.log('🌐 网络接口检测工具');
    console.log('='.repeat(50));
    
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        console.log(`\n📡 网络接口: ${name}`);
        console.log('-'.repeat(30));
        
        const interfaces = nets[name];
        for (const net of interfaces) {
            const type = net.family === 'IPv4' ? 'IPv4' : 'IPv6';
            const status = net.internal ? '内部' : '外部';
            const address = net.address;
            
            console.log(`  ${type} | ${status} | ${address}`);
            
            // 标记局域网IP
            if (net.family === 'IPv4' && !net.internal) {
                if (address.startsWith('192.168.') || 
                    address.startsWith('10.') || 
                    address.startsWith('172.')) {
                    console.log(`  ✅ 推荐用于局域网访问: ${address}`);
                }
            }
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 建议使用标记为"推荐"的IP地址进行手机访问');
}

// 获取推荐的局域网IP
function getRecommendedIP() {
    const nets = networkInterfaces();
    const recommendedIPs = [];
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                const ip = net.address;
                if (ip.startsWith('192.168.') || 
                    ip.startsWith('10.') || 
                    ip.startsWith('172.')) {
                    recommendedIPs.push({
                        interface: name,
                        ip: ip
                    });
                }
            }
        }
    }
    
    return recommendedIPs;
}

// 显示推荐IP
function showRecommendedIPs() {
    console.log('\n🎯 推荐的局域网IP地址:');
    console.log('-'.repeat(30));
    
    const recommendedIPs = getRecommendedIP();
    
    if (recommendedIPs.length === 0) {
        console.log('❌ 未找到推荐的局域网IP地址');
        console.log('💡 请检查网络连接或防火墙设置');
    } else {
        recommendedIPs.forEach((item, index) => {
            console.log(`${index + 1}. ${item.ip} (接口: ${item.interface})`);
        });
        
        console.log(`\n📱 建议使用: ${recommendedIPs[0].ip}`);
        console.log(`🌐 手机访问地址: https://${recommendedIPs[0].ip}:3000`);
    }
}

// 运行检测
showAllNetworkInterfaces();
showRecommendedIPs();
