const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const crypto = require('crypto');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

// 生成自签名证书
const generateSelfSignedCert = () => {
  const { generateKeyPairSync } = crypto;
  
  try {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
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

    return { cert: publicKey, key: privateKey };
  } catch (error) {
    console.error('生成证书失败:', error);
    throw error;
  }
};

const startHttpsServer = async () => {
  try {
    console.log('🔐 生成自签名SSL证书...');
    const { cert, key } = generateSelfSignedCert();
    
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    const server = createServer({ cert, key }, async (req, res) => {
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
    });
    
  } catch (error) {
    console.error('❌ HTTPS服务器启动失败:', error);
    process.exit(1);
  }
};

startHttpsServer();

