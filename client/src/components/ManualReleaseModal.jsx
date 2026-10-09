import React, { useState } from 'react';
import { X, PackagePlus, Plus, Trash2, Info } from 'lucide-react';

export default function ManualReleaseModal({ isOpen, onClose, appId, onCreated }) {
  const [formData, setFormData] = useState({
    version: '',
    release_name: '',
    channel: 'stable',
    is_mandatory: false,
    rollout_percentage: 100,
    changelog: '',
    assets: [
      {
        file_name: '',
        platform: 'windows_x64',
        download_url: '',
        file_size: 0,
        file_sha256: ''
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddAsset = () => {
    setFormData(prev => ({
      ...prev,
      assets: [
        ...prev.assets,
        { file_name: '', platform: 'windows_x64', download_url: '', file_size: 0, file_sha256: '' }
      ]
    }));
  };

  const handleRemoveAsset = (index) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }));
  };

  const handleAssetChange = (index, field, value) => {
    setFormData(prev => {
      const next = [...prev.assets];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, assets: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.version.trim()) {
      setError('请输入版本号 (如 1.0.0)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('gitdist_token') || '';
      const res = await fetch(`/api/admin/apps/${appId}/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '创建版本失败');
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">手动登记新版本</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">无需 GitHub Release，直接向客户端分发版本包</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                版本号 (SemVer) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例如: 1.0.0 或 v1.0.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">版本标题 / 别名</label>
              <input
                type="text"
                placeholder="例如: 1.0.0 正式版发布"
                value={formData.release_name}
                onChange={(e) => setFormData({ ...formData, release_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">发布渠道</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              >
                <option value="stable">Stable (稳定渠道)</option>
                <option value="beta">Beta (公测渠道)</option>
                <option value="nightly">Nightly (预览渠道)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                灰度分发比例 ({formData.rollout_percentage}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.rollout_percentage}
                onChange={(e) => setFormData({ ...formData, rollout_percentage: Number(e.target.value) })}
                className="w-full accent-blue-600 mt-2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_mandatory_cb"
              checked={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
            />
            <label htmlFor="is_mandatory_cb" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              设为<strong>强制更新</strong>（旧版本客户端必须升级才能运行）
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">更新日志 (Changelog Markdown)</label>
            <textarea
              rows={3}
              placeholder="### 新特性&#10;- 支持自动更新&#10;- 优化启动速度"
              value={formData.changelog}
              onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
            />
          </div>

          {/* Assets Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">安装包产物资产 (Assets)</label>
              <button
                type="button"
                onClick={handleAddAsset}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加产物</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.assets.map((asset, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative">
                  {formData.assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(index)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="文件名称，如 MyApp-Setup.exe"
                        value={asset.file_name}
                        onChange={(e) => handleAssetChange(index, 'file_name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <select
                        value={asset.platform}
                        onChange={(e) => handleAssetChange(index, 'platform', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="windows_x64">Windows x64</option>
                        <option value="windows_x86">Windows x86</option>
                        <option value="mac_arm64">macOS ARM64 (Apple Silicon)</option>
                        <option value="mac_x64">macOS x64 (Intel)</option>
                        <option value="linux_x64">Linux x64</option>
                        <option value="universal">Universal (全平台通用)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="url"
                      required
                      placeholder="直链下载地址 (https://...)"
                      value={asset.download_url}
                      onChange={(e) => handleAssetChange(index, 'download_url', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="SHA256 哈希值 (可选，用于安全防篡改)"
                      value={asset.file_sha256}
                      onChange={(e) => handleAssetChange(index, 'file_sha256', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-amber-700 dark:text-amber-300 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? '发布中...' : '确认发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
