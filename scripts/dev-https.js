const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// 生成自签名SSL证书
const generateSelfSignedCert = () => {
  const { execSync } = require('child_process');
  
  try {
    // 检查是否已有证书
    if (fs.existsSync('./certs/localhost.crt') && fs.existsSync('./certs/localhost.key')) {
      console.log('✅ SSL证书已存在');
      return;
    }
    
    // 检查是否有PEM格式的证书
    if (fs.existsSync('./certs/localhost.pem') && fs.existsSync('./certs/localhost-key.pem')) {
      console.log('✅ PEM格式SSL证书已存在');
      return;
    }
    
    // 创建certs目录
    if (!fs.existsSync('./certs')) {
      fs.mkdirSync('./certs');
    }
    
    console.log('🔐 生成自签名SSL证书...');
    
    // 生成私钥
    execSync('openssl genrsa -out ./certs/localhost.key 2048', { stdio: 'inherit' });
    
    // 生成证书签名请求
    execSync('openssl req -new -key ./certs/localhost.key -out ./certs/localhost.csr -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
    
    // 生成自签名证书
    execSync('openssl x509 -req -in ./certs/localhost.csr -signkey ./certs/localhost.key -out ./certs/localhost.crt -days 365', { stdio: 'inherit' });
    
    // 清理CSR文件
    fs.unlinkSync('./certs/localhost.csr');
    
    console.log('✅ SSL证书生成完成');
  } catch (error) {
    console.error('❌ SSL证书生成失败:', error.message);
    console.log('请确保已安装OpenSSL，或手动创建证书文件');
    process.exit(1);
  }
};

// 启动HTTPS服务器
const startHttpsServer = async () => {
  try {
    // 生成SSL证书
    generateSelfSignedCert();
    
    // 准备Next.js应用
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    // 读取SSL证书
    let httpsOptions;
    if (fs.existsSync('./certs/localhost.crt') && fs.existsSync('./certs/localhost.key')) {
      httpsOptions = {
        key: fs.readFileSync('./certs/localhost.key'),
        cert: fs.readFileSync('./certs/localhost.crt'),
      };
    } else if (fs.existsSync('./certs/localhost.pem') && fs.existsSync('./certs/localhost-key.pem')) {
      httpsOptions = {
        key: fs.readFileSync('./certs/localhost-key.pem'),
        cert: fs.readFileSync('./certs/localhost.pem'),
      };
    } else {
      throw new Error('未找到SSL证书文件');
    }
    
    // 创建HTTPS服务器
    const server = createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`🚀 HTTPS开发服务器启动成功!`);
      console.log(`📍 访问地址: https://${hostname}:${port}`);
      console.log(`🔐 SSL证书: 自签名证书 (浏览器会显示安全警告，这是正常的)`);
      console.log(`📱 NFC功能: 现在可以在HTTPS环境下使用NFC功能了!`);
      console.log(`⚠️  注意: 首次访问时浏览器会显示安全警告，点击"高级"→"继续访问"即可`);
    });
    
  } catch (error) {
    console.error('❌ HTTPS服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startHttpsServer();
