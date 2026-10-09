import React, { useState, useEffect } from 'react';
import { X, RefreshCw, KeyRound, Globe, Info, Zap } from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function AppModal({ isOpen, onClose, onSave, app = null, availableProxies = [] }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    github_repo: '',
    github_token: '',
    webhook_secret: '',
    acceleration_proxy: 'https://ghfast.top/'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (app) {
      setFormData({
        id: app.id || '',
        name: app.name || '',
        description: app.description || '',
        github_repo: app.github_repo || '',
        github_token: app.github_token || '',
        webhook_secret: app.webhook_secret || '',
        acceleration_proxy: app.acceleration_proxy || 'https://ghfast.top/'
      });
    } else {
      const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setFormData({
        id: '',
        name: '',
        description: '',
        github_repo: '',
        github_token: '',
        webhook_secret: randomSecret,
        acceleration_proxy: 'https://ghfast.top/'
      });
    }
    setError('');
  }, [app, isOpen]);

  if (!isOpen) return null;

  const handleRegenSecret = () => {
    const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setFormData(prev => ({ ...prev, webhook_secret: randomSecret }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入应用名称');
      return;
    }
    if (!formData.github_repo.trim()) {
      setError('请输入 GitHub 仓库地址 (格式: owner/repo)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {app ? '编辑应用配置' : '接入新应用'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">配置 GitHub 仓库与更新分发策略</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* App Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              应用名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如: 我的跨平台桌面客户端"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* App ID / Slug */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              应用唯一标识 (App ID / Slug)
            </label>
            <input
              type="text"
              disabled={!!app}
              placeholder="留空则自动生成，如: my-app"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">客户端请求时以此 ID 作为区分，创建后不可更改</p>
          </div>

          {/* GitHub Repo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              GitHub 仓库路径 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="格式: 用户名/仓库名，如: username/repo-name"
              value={formData.github_repo}
              onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* GitHub Token */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>GitHub Personal Access Token (可选)</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">私有仓库需填</span>
            </label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (公开仓库可留空)"
              value={formData.github_token}
              onChange={(e) => setFormData({ ...formData, github_token: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Webhook 验证密钥 (Secret Token)</span>
              <button
                type="button"
                onClick={handleRegenSecret}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                重新生成
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.webhook_secret}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-amber-600 dark:text-amber-300 font-mono focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 pr-10"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">填入 GitHub 仓库 Webhook 配置中的 Secret 字段，用于防伪验签</p>
          </div>

          {/* Acceleration Proxy */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>客户端下载加速线路 (解决国内 GitHub Releases 下载慢)</span>
            </label>
            <select
              value={formData.acceleration_proxy}
              onChange={(e) => setFormData({ ...formData, acceleration_proxy: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
            >
              {availableProxies.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} {p.value !== 'direct' ? `(${p.value})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">应用描述 (可选)</label>
            <textarea
              rows={2}
              placeholder="简要描述该项目或发布用途..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? '保存中...' : (app ? '保存修改' : '确认接入')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
