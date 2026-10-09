const { verifyToken } = require('../services/userService');

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: '授权格式错误，需使用 Bearer Token' });
  }

  const token = parts[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: '登录会话已过期，请重新登录' });
  }

  req.user = decoded;
  next();
}

module.exports = {
  requireAuth
};
