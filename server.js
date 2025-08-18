const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// 准备Next.js应用
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 使用mkcert生成的SSL证书
const httpsOptions = {
    key: fs.readFileSync('cert.key'),
    cert: fs.readFileSync('cert.crt')
};

app.prepare().then(() => {
    // 创建HTTPS服务器
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
        console.log(`🔐 HTTPS服务器已启动（使用mkcert证书）`);
        console.log(`📱 本地访问: https://localhost:${port}`);
        console.log(`🌐 网络访问: https://192.168.0.72:${port}`);
        console.log(`📋 手机NFC页面: https://192.168.0.72:${port}/mobile-nfc`);
        console.log(`✅ 使用可信SSL证书，浏览器不会显示安全警告`);
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
});
