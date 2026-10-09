import React, { useState, useEffect } from 'react';
import { X, User, KeyRound, Lock, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AccountModal({ isOpen, onClose, user, onUserUpdated }) {
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword) {
      setError('请输入当前密码以验证身份');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setError('用户名长度不能少于 3 个字符');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('新密码长度不能少于 6 位');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('gitdist_token');
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername: username.trim(),
          newPassword: newPassword ? newPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '保存失败');
      }

      if (data.token) {
        localStorage.setItem('gitdist_token', data.token);
      }

      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">账号与安全设置</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">修改管理员登录用户名或登录密码</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>账号信息修改成功！</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              管理员用户名
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: admin"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">可自定义修改为任意专属管理账号名</p>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>新登录密码 (选填)</span>
              <span className="text-[11px] text-slate-400">若不改密码请留空</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="不少于6位，不修改请留空"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Confirm Password (only shown if newPassword is entered) */}
          {newPassword && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                确认新密码
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {/* Current Password Verification */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              验证原密码 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码以确认修改"
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? '正在保存...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
