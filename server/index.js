const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const config = require('./config');
const db = require('./db');

const app = express();

// Enable CORS
app.use(cors());

// Enable HTTP request logging in development
app.use(morgan('dev'));

// Capture raw body for GitHub Webhook HMAC verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

const { requireAuth } = require('./middleware/auth');
const userService = require('./services/userService');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/webhook/github', require('./routes/webhook'));
app.use('/api/v1/update', require('./routes/clientApi'));
app.use('/api/admin', requireAuth, require('./routes/adminApi'));
app.use('/api/snippets', require('./routes/codeSnippets'));

// Static files for client frontend
const staticDir = path.join(__dirname, '..', 'public');
app.use(express.static(staticDir));

// SPA fallback middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send('GitDist Update Server is running. UI is building...');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function start() {
  await db.init();
  await userService.initAdminUser();

  if (require.main === module) {
    const server = app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 GitDist 更新分发平台 已启动`);
      console.log(`🌐 访问地址: http://localhost:${config.PORT}`);
      console.log(`📦 Webhook 地址模版: http://localhost:${config.PORT}/api/webhook/github/:appId`);
      console.log(`🔌 客户端检测接口: http://localhost:${config.PORT}/api/v1/update/check`);
      console.log(`=======================================================`);
    });

    server.on('error', (err) => {
      console.error('Server listen error:', err.message);
    });
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
});

module.exports = app;
