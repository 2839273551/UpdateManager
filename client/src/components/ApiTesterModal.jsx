import React, { useState } from 'react';
import { X, Play, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Download, ShieldCheck } from 'lucide-react';

export default function ApiTesterModal({ isOpen, onClose, app }) {
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('windows_x64');
  const [channel, setChannel] = useState('stable');
  const [clientId, setClientId] = useState('client-test-001');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  if (!isOpen || !app) return null;

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const token = localStorage.getItem('gitdist_token') || '';
      const res = await fetch('/api/admin/test-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appId: app.id,
          currentVersion,
          platform,
          channel,
          clientId
        })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
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
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">客户端更新检测 API 在线测试</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                模拟客户端向服务端发起更新检测，即时验证版本对比与策略命中
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户端当前版本号</label>
              <input
                type="text"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                placeholder="例如: 1.0.0"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户端运行平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              >
                <option value="windows_x64">Windows (64位)</option>
                <option value="windows_x86">Windows (32位)</option>
                <option value="mac_arm64">macOS (Apple Silicon M1/M2/M3)</option>
                <option value="mac_x64">macOS (Intel x64)</option>
                <option value="linux_x64">Linux (x86_64)</option>
                <option value="universal">通用/全部 (Universal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">分发渠道 (Channel)</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
              >
                <option value="stable">Stable (仅稳定版)</option>
                <option value="beta">Beta (接收测试版与稳定版)</option>
                <option value="nightly">Nightly (全量渠道)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                客户端机器标识 (Client ID / UUID)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="用于测试灰度发布命中分桶"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? '正在检测...' : '立即模拟发送检查更新请求'}</span>
            </button>
          </div>

          {/* Test Result Display */}
          {response && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">返回响应结果：</h4>

              {response.has_update ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>成功命中新版本：v{response.latest_version}</span>
                    </div>
                    {response.mandatory && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[10px] font-bold">
                        ⚠️ 强制更新 (Mandatory)
                      </span>
                    )}
                  </div>
                  {response.asset && (
                    <div className="text-xs space-y-1 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 font-mono">
                      <div>匹配安装包: <strong className="text-slate-900 dark:text-white">{response.asset.file_name}</strong></div>
                      <div>平台架构: <span className="text-slate-600 dark:text-slate-300">{response.asset.platform}</span></div>
                      <div>文件哈希: <span className="text-amber-600 dark:text-amber-300">{response.asset.file_sha256 || '未设定'}</span></div>
                      <div className="pt-1">
                        <a
                          href={response.asset.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          下载链接: {response.asset.download_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{response.message || '无需更新（当前已是最新或未在灰度比例内）'}</span>
                </div>
              )}

              {/* Raw JSON */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto max-h-48">
                <pre>{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-xs transition cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
