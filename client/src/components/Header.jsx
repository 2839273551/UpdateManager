import React, { useState } from 'react';
import { 
  Rocket, 
  Layers, 
  DownloadCloud, 
  PackageCheck, 
  Plus, 
  User,
  LogOut,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import AccountModal from './AccountModal';

export default function Header({ systemInfo, onNewApp, user, onLogout, theme, onToggleTheme, onUserUpdated }) {
  const stats = systemInfo?.stats || { totalApps: 0, totalReleases: 0, totalDownloads: 0 };
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-black/5 dark:ring-white/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  更新管理器
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    v1.0.0
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                GitHub 联动 · 客户端应用自动更新与分发中枢
              </p>
            </div>
          </div>

          {/* Quick Metrics & User Controls */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">应用总数</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{stats.totalApps}</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <PackageCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">版本发布数</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{stats.totalReleases}</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <DownloadCloud className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">累计分发量</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{stats.totalDownloads}</div>
              </div>
            </div>

            {/* New App Button */}
            <button
              onClick={onNewApp}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>接入新应用</span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title={theme === 'dark' ? '切换为白色明亮主题' : '切换为暗色夜间主题'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile & Actions */}
            {user && (
              <div className="flex items-center space-x-1.5 border-l border-slate-200 dark:border-slate-800 pl-2.5">
                <button
                  onClick={() => setAccountModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  title="账号与安全设置 (修改用户名与密码)"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium font-mono">{user.username}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={user}
        onUserUpdated={onUserUpdated}
      />
    </header>
  );
}
