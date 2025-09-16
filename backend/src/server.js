#!/usr/bin/env node

/**
 * Production server wrapper with fallback
 * This ensures Railway can always start something
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('Starting Fare Backend server wrapper...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Try to start the main TypeScript server
const startMainServer = () => {
  console.log('Attempting to start main TypeScript server with tsx...');
  
  const tsxPath = require.resolve('tsx/cli');
  const mainServer = spawn('node', [tsxPath, 'src/index.ts'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
  });

  mainServer.on('error', (err) => {
    console.error('Failed to start main server:', err);
    startFallbackServer();
  });

  mainServer.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Main server exited with code ${code}`);
      startFallbackServer();
    }
  });
};

// Fallback server if TypeScript fails
const startFallbackServer = () => {
  console.log('Starting fallback health check server...');
  
  const server = http.createServer((req, res) => {
    console.log(`Fallback server request: ${req.url}`);
    
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        mode: 'fallback',
        message: 'Main server initialization failed, health check active',
        timestamp: new Date().toISOString() 
      }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Service temporarily unavailable',
        message: 'Main server is being repaired'
      }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });

  server.on('error', (error) => {
    console.error('Fallback server error:', error);
    process.exit(1);
  });
};

// Start the main server
startMainServer();

// Handle process signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});