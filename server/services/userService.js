const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

async function initAdminUser() {
  try {
    const admin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!admin) {
      const salt = 'd9f8a4e1b2c3d4e5f6a7b8c9d0e1f2a3';
      const hash = hashPassword('admin123', salt);
      const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
      await db.run(`
        INSERT INTO users (username, password_hash, salt, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', hash, salt, 'admin', now, now]);
      console.log('[Auth] 默认超级管理员账户已就绪: 用户名 admin, 初始密码 admin123');
    }
  } catch (err) {
    console.warn('[Auth] initAdminUser:', err.message);
  }
}

async function verifyLogin(username, password) {
  if (!username || !password) return null;
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username.trim()]);
  if (!user) return null;

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.password_hash) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

async function updateProfile(userId, { currentPassword, newUsername, newPassword }) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('用户不存在');

  const currentHash = hashPassword(currentPassword, user.salt);
  if (currentHash !== user.password_hash) {
    throw new Error('原密码输入错误，无法修改');
  }

  let finalUsername = user.username;
  let finalHash = user.password_hash;
  let finalSalt = user.salt;

  // Handle username update
  if (newUsername && newUsername.trim() !== user.username) {
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      throw new Error('新用户名长度不能少于 3 位');
    }
    const exist = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [trimmed, userId]);
    if (exist) {
      throw new Error(`用户名 "${trimmed}" 已被占用，请使用其他用户名`);
    }
    finalUsername = trimmed;
  }

  // Handle password update
  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 6) {
      throw new Error('新密码长度不能少于 6 位');
    }
    finalSalt = generateSalt();
    finalHash = hashPassword(newPassword, finalSalt);
  }

  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  await db.run(
    'UPDATE users SET username = ?, password_hash = ?, salt = ?, updated_at = ? WHERE id = ?',
    [finalUsername, finalHash, finalSalt, now, userId]
  );

  return {
    id: user.id,
    username: finalUsername,
    role: user.role
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  initAdminUser,
  verifyLogin,
  updateProfile,
  generateToken,
  verifyToken
};
