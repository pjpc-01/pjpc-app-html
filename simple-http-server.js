const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting simple HTTP server...');
console.log(`🌐 Server will be available at: http://localhost:${PORT}`);
console.log('');

// Start Next.js development server
const nextProcess = spawn('npm', ['run', 'dev:http'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--openssl-legacy-provider --max-old-space-size=4096'
  }
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
});

nextProcess.on('close', (code) => {
  console.log(`Next.js server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

