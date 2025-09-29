const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if certificates exist
const pfxPath = path.join(__dirname, 'certs', 'localhost.pfx');
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');

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
} else {
  console.log('❌ 未找到证书文件');
  process.exit(1);
}

console.log('🚀 启动 HTTPS 代理服务器...');

// Start Next.js server on port 3001
const nextProcess = spawn('npm', ['run', 'dev:http'], {
  stdio: 'pipe',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--openssl-legacy-provider --max-old-space-size=4096',
    PORT: '3001'
  }
});

let nextReady = false;

nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  if (output.includes('Ready in') || output.includes('Local:')) {
    if (!nextReady) {
      nextReady = true;
      startHttpsProxy();
    }
  }
});

nextProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

function startHttpsProxy() {
  console.log('🔗 启动 HTTPS 代理到 Next.js...');
  
  const server = https.createServer(options, (req, res) => {
    // Proxy to Next.js
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
    console.log('✅ HTTPS 服务器运行在: https://localhost:3000');
    console.log('🔗 代理到 Next.js: http://localhost:3001');
    console.log('🌐 现在可以访问你的应用了!');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 关闭服务器...');
    server.close();
    nextProcess.kill('SIGINT');
    process.exit(0);
  });
}

nextProcess.on('error', (err) => {
  console.error('Next.js 启动失败:', err);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js 进程退出，代码: ${code}`);
});
