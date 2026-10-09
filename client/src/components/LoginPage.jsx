import React, { useState } from 'react';
import { Rocket, Lock, User, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, theme, onToggleTheme }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '登录失败');
      }

      localStorage.setItem('gitdist_token', data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || '网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 relative transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={theme === 'dark' ? '切换为白色明亮主题' : '切换为暗色夜间主题'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-black/5 dark:ring-white/20 mb-4">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            更新管理器
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            GitHub 联动 · 客户端应用自动更新与分发系统
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">管理员安全登录</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">请输入管理员账号进入后台控制台</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">登录用户名</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
                />
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">登录密码</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
              <span>默认初始账户：<strong className="text-blue-600 dark:text-blue-400">admin</strong></span>
              <span>初始密码：<strong className="text-blue-600 dark:text-blue-400">admin123</strong></span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? '正在验证...' : '立即登录控制台'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500">
          更新管理器 · 支持随时在个人中心修改用户名与密码
        </div>
      </div>
    </div>
  );
}
