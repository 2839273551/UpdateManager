import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('新密码长度不能少于 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('gitdist_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '修改密码失败');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">修改管理员密码</h3>
              <p className="text-xs text-slate-400">保障后台安全，建议定期更新密码</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>密码修改成功！</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">当前原密码</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入原密码"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">新密码 (不少于6位)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">确认新密码</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? '保存中...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
