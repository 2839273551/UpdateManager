const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  
  // Database Configuration
  // Set DB_TYPE='mysql' in .env to use MySQL, or default to 'sqlite'
  DB_TYPE: process.env.DB_TYPE || 'sqlite',
  MYSQL: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gitdist',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  },

  // JWT Auth
  JWT_SECRET: process.env.JWT_SECRET || 'gitdist_jwt_auth_secret_key_2026',
  JWT_EXPIRES_IN: '7d',

  // Proxies
  DEFAULT_ACCELERATION_PROXY: process.env.DEFAULT_ACCELERATION_PROXY || 'https://ghfast.top/',
  AVAILABLE_PROXIES: [
    { label: '直连 GitHub (海外/原地址)', value: 'direct' },
    { label: 'GHFast 加速 (推荐国内)', value: 'https://ghfast.top/' },
    { label: 'GHProxy 镜像', value: 'https://ghproxy.net/' },
    { label: 'Mirror GHProxy', value: 'https://mirror.ghproxy.com/' }
  ]
};
