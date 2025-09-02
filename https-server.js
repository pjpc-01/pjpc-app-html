const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// 从PFX文件读取证书和私钥
const getHttpsOptions = () => {
  const pfxPath = path.join(__dirname, 'certs', 'localhost.pfx');
  const crtPath = path.join(__dirname, 'certs', 'localhost.crt');
  
  if (fs.existsSync(pfxPath)) {
    console.log('🔐 使用PFX证书文件');
    return {
      pfx: fs.readFileSync(pfxPath),
      passphrase: 'password'
    };
  } else if (fs.existsSync(crtPath)) {
    console.log('🔐 使用CRT证书文件');
    return {
      cert: fs.readFileSync(crtPath)
    };
  } else {
    throw new Error('未找到证书文件');
  }
};

const startHttpsServer = async () => {
  try {
    console.log('🚀 启动HTTPS服务器...');
    
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    const httpsOptions = getHttpsOptions();
    
    const server = createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`🚀 HTTPS服务器启动成功!`);
      console.log(`📍 访问地址: https://localhost:${port}`);
      console.log(`📱 手机访问: https://你的IP:${port}`);
      console.log(`🔐 自签名证书 (浏览器会显示安全警告，这是正常的)`);
      console.log(`⚠️  首次访问时点击"高级"→"继续访问"即可`);
      console.log(`📱 NFC功能现在可以使用了!`);
    });
    
  } catch (error) {
    console.error('❌ HTTPS服务器启动失败:', error);
    process.exit(1);
  }
};

startHttpsServer();
