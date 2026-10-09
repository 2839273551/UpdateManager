import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  RefreshCw, 
  Plus, 
  ExternalLink, 
  Terminal, 
  Zap, 
  Play, 
  Settings, 
  Trash2, 
  Layers, 
  Package, 
  AlertCircle,
  BellRing,
  Code2,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import GithubIcon from './components/GithubIcon';

import Header from './components/Header';
import LoginPage from './components/LoginPage';
import AppModal from './components/AppModal';
import WebhookGuideModal from './components/WebhookGuideModal';
import SdkModal from './components/SdkModal';
import ApiTesterModal from './components/ApiTesterModal';
import ManualReleaseModal from './components/ManualReleaseModal';
import ReleaseItem from './components/ReleaseItem';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Theme state: defaults to light (白色主题)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gitdist_theme') || 'light';
  });

  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [releases, setReleases] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [sdkModalOpen, setSdkModalOpen] = useState(false);
  const [testerModalOpen, setTesterModalOpen] = useState(false);
  const [manualReleaseModalOpen, setManualReleaseModalOpen] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gitdist_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const showNotify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('gitdist_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('gitdist_token');
    if (!token) {
      setAuthChecking(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('gitdist_token');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchSystem = async () => {
    try {
      const res = await fetch('/api/admin/system', { headers: getAuthHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setSystemInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApps = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch('/api/admin/apps', { headers: getAuthHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setApps(data);
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].id);
      }
    } catch (e) {
      console.error(e);
      showNotify('获取应用列表失败', 'error');
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchReleases = async (appId) => {
    if (!appId) return;
    setLoadingReleases(true);
    try {
      const res = await fetch(`/api/admin/apps/${appId}/releases`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setReleases(data);
    } catch (e) {
      console.error(e);
      showNotify('获取发布列表失败', 'error');
    } finally {
      setLoadingReleases(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSystem();
      fetchApps();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedAppId && currentUser) {
      fetchReleases(selectedAppId);
    } else {
      setReleases([]);
    }
  }, [selectedAppId, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('gitdist_token');
    setCurrentUser(null);
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  const handleSaveApp = async (formData) => {
    const isEdit = !!editingApp;
    const url = isEdit ? `/api/admin/apps/${editingApp.id}` : '/api/admin/apps';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '保存应用失败');
    }

    const saved = await res.json();
    showNotify(isEdit ? '应用配置已更新' : '新应用已成功接入', 'success');
    await fetchApps();
    await fetchSystem();
    setSelectedAppId(saved.id);
  };

  const handleDeleteApp = async (app) => {
    if (!window.confirm(`确定要删除应用 "${app.name}" (${app.id}) 吗？此操作将连带删除所有相关发布版本！`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotify('应用已删除', 'success');
        const remaining = apps.filter(a => a.id !== app.id);
        setApps(remaining);
        setSelectedAppId(remaining.length > 0 ? remaining[0].id : null);
        fetchSystem();
      }
    } catch (e) {
      showNotify('删除应用失败: ' + e.message, 'error');
    }
  };

  const handleSyncGitHub = async () => {
    if (!selectedApp) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/apps/${selectedApp.id}/sync`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '同步失败');

      showNotify(`GitHub 同步成功！已同步 ${data.count} 个版本`, 'success');
      fetchReleases(selectedApp.id);
      fetchApps();
      fetchSystem();
    } catch (e) {
      showNotify(`同步失败: ${e.message}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateRelease = async (releaseId, patch) => {
    try {
      const res = await fetch(`/api/admin/releases/${releaseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(patch)
      });
      if (res.ok) {
        setReleases(prev => prev.map(r => r.id === releaseId ? { ...r, ...patch } : r));
        showNotify('版本策略已更新', 'success');
      }
    } catch (e) {
      showNotify('更新版本策略失败', 'error');
    }
  };

  const handleDeleteRelease = async (releaseId) => {
    if (!window.confirm('确定要从分发平台删除该发布版本吗？')) return;
    try {
      const res = await fetch(`/api/admin/releases/${releaseId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setReleases(prev => prev.filter(r => r.id !== releaseId));
        showNotify('版本已删除', 'success');
        fetchSystem();
      }
    } catch (e) {
      showNotify('删除失败', 'error');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
        正在验证登录状态...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(u) => setCurrentUser(u)} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const serverUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Header */}
      <Header
        systemInfo={systemInfo}
        user={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          showNotify('个人资料已更新', 'success');
        }}
        onNewApp={() => {
          setEditingApp(null);
          setAppModalOpen(true);
        }}
      />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border flex items-center space-x-2 text-xs font-medium ${
            notification.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-200'
              : (notification.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-200' 
                  : 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-200')
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {apps.length === 0 && !loadingApps ? (
          /* Empty state */
          <div className="max-w-xl mx-auto my-16 text-center p-8 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">开始接入你的第一个应用程序</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                填入应用名称和 GitHub 仓库（如 <code>username/my-app</code>），即可打通 GitHub 与客户端自动升级分发！
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setEditingApp(null);
                  setAppModalOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/20 cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>立即接入应用</span>
              </button>
            </div>
          </div>
        ) : (
          /* App Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Apps list */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>已接入应用 ({apps.length})</span>
                </span>
                <button
                  onClick={() => {
                    setEditingApp(null);
                    setAppModalOpen(true);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加应用</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {apps.map((app) => {
                  const isSelected = app.id === selectedAppId;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-slate-900 border-blue-500/80 dark:border-blue-500/60 shadow-sm dark:shadow-blue-500/10 ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/90'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{app.name}</h4>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">ID: {app.id}</span>
                        </div>
                        {app.latest_version && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
                            v{app.latest_version}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-[11px] truncate max-w-[170px]" title={app.github_repo}>
                          <GithubIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-700 dark:text-slate-300">{app.github_repo}</span>
                        </span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                          {app.total_downloads || 0} 次分发
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected App Dashboard */}
            {selectedApp && (
              <div className="lg:col-span-8 space-y-6">
                {/* App Header Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedApp.name}</h2>
                        <a
                          href={`https://github.com/${selectedApp.github_repo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                        >
                          <GithubIcon className="w-3 h-3" />
                          <span>{selectedApp.github_repo}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                        </a>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        客户端参数: <code className="text-blue-600 dark:text-blue-400 font-semibold">app_id={selectedApp.id}</code>
                        {selectedApp.description ? ` · ${selectedApp.description}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingApp(selectedApp);
                          setAppModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs transition cursor-pointer"
                        title="编辑应用设置"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteApp(selectedApp)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs transition cursor-pointer"
                        title="删除该应用"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Acceleration & Webhook Info Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <div>
                          <div className="text-[10px] uppercase text-slate-500 font-semibold">分发下载加速线路</div>
                          <div className="text-slate-800 dark:text-slate-200 font-mono truncate max-w-[200px]" title={selectedApp.acceleration_proxy}>
                            {selectedApp.acceleration_proxy === 'direct' ? '直连 GitHub' : selectedApp.acceleration_proxy}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BellRing className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-[10px] uppercase text-slate-500 font-semibold">Webhook 自动推送状态</div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">已配置安全验签 Secret</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setWebhookModalOpen(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        查看配置
                      </button>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                    {/* Manual Sync from GitHub */}
                    <button
                      onClick={handleSyncGitHub}
                      disabled={syncing}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? '正在从 GitHub 同步...' : '立即同步 GitHub 发版'}</span>
                    </button>

                    {/* Webhook Guide */}
                    <button
                      onClick={() => setWebhookModalOpen(true)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>Webhook 配置指引</span>
                    </button>

                    {/* SDK Code Snippets */}
                    <button
                      onClick={() => setSdkModalOpen(true)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>客户端对接 SDK / 脚本</span>
                    </button>

                    {/* Online API Tester */}
                    <button
                      onClick={() => setTesterModalOpen(true)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-current" />
                      <span>API 在线模拟测试</span>
                    </button>

                    {/* Manual Release */}
                    <button
                      onClick={() => setManualReleaseModalOpen(true)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer sm:ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>手动登记版本</span>
                    </button>
                  </div>
                </div>

                {/* Releases Management List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        版本分发列表 ({releases.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      支持开关停用、设为强更、灰度滑块实时调控
                    </span>
                  </div>

                  {loadingReleases ? (
                    <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-blue-500" />
                      正在加载发布版本...
                    </div>
                  ) : releases.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <Package className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        该应用暂无已同步的发布版本
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          onClick={handleSyncGitHub}
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          从 GitHub 仓库抓取现有 Release
                        </button>
                        <button
                          onClick={() => setManualReleaseModalOpen(true)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          手动登记新版本
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {releases.map((rel) => (
                        <ReleaseItem
                          key={rel.id}
                          release={rel}
                          onUpdate={handleUpdateRelease}
                          onDelete={handleDeleteRelease}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-12 bg-white dark:bg-slate-950 transition-colors">
        更新管理器 · GitHub 联动应用更新分发平台 · Powered by Node.js & MySQL
      </footer>

      {/* Modals */}
      <AppModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        onSave={handleSaveApp}
        app={editingApp}
        availableProxies={systemInfo?.availableProxies || []}
      />

      <WebhookGuideModal
        isOpen={webhookModalOpen}
        onClose={() => setWebhookModalOpen(false)}
        app={selectedApp}
        serverUrl={serverUrl}
      />

      <SdkModal
        isOpen={sdkModalOpen}
        onClose={() => setSdkModalOpen(false)}
        app={selectedApp}
        serverUrl={serverUrl}
      />

      <ApiTesterModal
        isOpen={testerModalOpen}
        onClose={() => setTesterModalOpen(false)}
        app={selectedApp}
      />

      <ManualReleaseModal
        isOpen={manualReleaseModalOpen}
        onClose={() => setManualReleaseModalOpen(false)}
        appId={selectedApp?.id}
        onCreated={() => {
          showNotify('新版本已登记发布', 'success');
          fetchReleases(selectedApp?.id);
          fetchApps();
          fetchSystem();
        }}
      />
    </div>
  );
}
