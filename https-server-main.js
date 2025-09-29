const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if certificates exist
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');
const pfxPath = path.join(__dirname, 'certs', 'localhost.pfx');
const crtPath = path.join(__dirname, 'certs', 'localhost.crt');

let options = null;

if (fs.existsSync(pfxPath)) {
  console.log('🔐 使用PFX证书文件');
  options = {
    pfx: fs.readFileSync(pfxPath),
    passphrase: 'password'
  };
} else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('🔐 使用PEM证书文件');
  options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
} else if (fs.existsSync(crtPath)) {
  console.log('🔐 使用CRT证书文件');
  options = {
    cert: fs.readFileSync(crtPath)
  };
} else {
  console.log('❌ SSL certificates not found!');
  console.log('📁 Expected certificates at:');
  console.log(`   ${certPath}`);
  console.log(`   ${keyPath}`);
  console.log(`   ${pfxPath}`);
  console.log(`   ${crtPath}`);
  console.log('');
  console.log('🔧 To generate certificates, run:');
  console.log('   node generate-dev-certs.js');
  console.log('');
  console.log('🚀 Starting HTTP server instead...');
  
  // Fallback to HTTP
  const httpProcess = spawn('npm', ['run', 'dev:http'], {
    stdio: 'inherit',
    shell: true
  });
  
  httpProcess.on('error', (err) => {
    console.error('Failed to start HTTP server:', err);
  });
  
  return;
}

console.log('🚀 Starting Next.js development server with HTTPS...');
console.log('📁 Certificates found, enabling HTTPS');
console.log('🌐 Server will be available at: https://localhost:3000');
console.log('');

// Start Next.js server on port 3001
const nextProcess = spawn('npm', ['run', 'dev:http'], {
  stdio: 'pipe',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--openssl-legacy-provider --max-old-space-size=4096',
    PORT: '3001' // Next.js runs on port 3001
  }
});

// Wait for Next.js to be ready
let nextReady = false;
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  if (output.includes('Ready in') || output.includes('Local:')) {
    nextReady = true;
    startHttpsProxy();
  }
});

nextProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

function startHttpsProxy() {
  if (nextReady) {
    // Create HTTPS proxy server
    const server = https.createServer(options, (req, res) => {
      // Proxy requests to Next.js server
      const proxyReq = http.request({
        hostname: 'localhost',
        port: 3001,
        path: req.url,
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      req.pipe(proxyReq);
    });

    server.listen(3000, () => {
      console.log('✅ HTTPS 代理服务器运行在: https://localhost:3000');
      console.log('🔗 代理到 Next.js 服务器: http://localhost:3001');
      console.log('🔒 SSL 证书已加载');
      console.log('🌐 现在可以访问你的应用: https://localhost:3000');
      console.log('');
      console.log('💡 提示: 浏览器会显示安全警告，点击"高级"→"继续访问"即可');
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 正在关闭服务器...');
      server.close();
      nextProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 正在关闭服务器...');
      server.close();
      nextProcess.kill('SIGTERM');
      process.exit(0);
    });
  }
}

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js server process exited with code ${code}`);
});


