import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, ArrowRight, BellRing } from 'lucide-react';

export default function WebhookGuideModal({ isOpen, onClose, app, serverUrl }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!isOpen || !app) return null;

  const webhookUrl = `${serverUrl}/api/webhook/github/${app.id}`;
  const webhookSecret = app.webhook_secret;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                配置 GitHub Webhook 自动推送
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                关联应用: <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">{app.name} ({app.id})</span>
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Copy Cards */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                ① Payload URL (回调接收地址)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUrl ? '已复制' : '复制'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                ② Secret (HMAC SHA256 签名密钥)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(webhookSecret, 'secret')}
                  className="px-3.5 py-2 bg-amber-50 dark:bg-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSecret ? '已复制' : '复制'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              GitHub 仓库配置具体步骤：
            </h4>
            
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                打开你的 GitHub 仓库:
                <a
                  href={`https://github.com/${app.github_repo}/settings/hooks`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-mono ml-1 font-medium"
                >
                  github.com/{app.github_repo}/settings/hooks
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>点击右上角 <strong className="text-slate-900 dark:text-white">Add webhook</strong> 按钮。</li>
              <li>
                在 <strong className="text-slate-900 dark:text-white">Payload URL</strong> 栏粘贴上方提供的专属地址。
              </li>
              <li>
                在 <strong className="text-slate-900 dark:text-white">Content type</strong> 下拉框务必选择 <strong className="text-slate-900 dark:text-white font-mono">application/json</strong>。
              </li>
              <li>
                在 <strong className="text-slate-900 dark:text-white">Secret</strong> 栏粘贴上方的签名密钥。
              </li>
              <li>
                在 <strong className="text-slate-900 dark:text-white">Which events would you like to trigger this webhook?</strong> 选择：
                <div className="mt-1.5 pl-3 py-1.5 border-l-2 border-blue-500 bg-white dark:bg-slate-900/50 rounded-r text-slate-700 dark:text-slate-300">
                  勾选 <strong>"Let me select individual events."</strong>，并在下方列表中只勾选 <strong className="text-slate-900 dark:text-white">Releases</strong>。
                </div>
              </li>
              <li>
                确保勾选底部的 <strong>Active</strong>，最后点击绿色按钮 <strong className="text-slate-900 dark:text-white">Add webhook</strong>。
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-medium transition cursor-pointer"
          >
            完成配置
          </button>
        </div>
      </div>
    </div>
  );
}
