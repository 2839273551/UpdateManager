const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  try {
    const user = await userService.verifyLogin(username, password);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = userService.generateToken(user);
    res.json({
      success: true,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});

// POST /api/auth/profile - 修改账号用户名和/或密码
router.post('/profile', requireAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ error: '请输入当前密码以验证身份' });
  }

  try {
    const updatedUser = await userService.updateProfile(req.user.id, {
      currentPassword,
      newUsername,
      newPassword
    });

    const token = userService.generateToken(updatedUser);
    res.json({
      success: true,
      token,
      user: updatedUser,
      message: '账号信息更新成功'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/change-password (兼容老接口)
router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入原密码和新密码' });
  }

  try {
    const updatedUser = await userService.updateProfile(req.user.id, {
      currentPassword: oldPassword,
      newPassword
    });
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

module.exports = router;
