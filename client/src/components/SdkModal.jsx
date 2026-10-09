import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code2, Terminal, Cpu, FileCode2 } from 'lucide-react';

export default function SdkModal({ isOpen, onClose, app, serverUrl }) {
  const [activeTab, setActiveTab] = useState('python');
  const [snippets, setSnippets] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && app) {
      setLoading(true);
      fetch(`/api/snippets/${app.id}`)
        .then(res => res.json())
        .then(data => {
          setSnippets(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, app]);

  if (!isOpen || !app) return null;

  const currentCode = snippets ? snippets[activeTab] : '';

  const handleCopy = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'python', label: 'Python (客户端更新脚本)', icon: Code2 },
    { id: 'nodejs', label: 'Node.js / Electron', icon: FileCode2 },
    { id: 'golang', label: 'Go (单文件自更新)', icon: Cpu },
    { id: 'csharp', label: 'C# / .NET', icon: Terminal },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                客户端程序对接代码示例
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                针对应用 <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">{app.name}</span> 的完整更新与自替换逻辑
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

        {/* Tab Selection */}
        <div className="flex items-center space-x-1 px-6 pt-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 bg-white dark:bg-blue-500/5'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="p-6 flex-1 flex flex-col overflow-hidden bg-slate-900 dark:bg-slate-950/80 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-mono">
              包含完整功能：版本检测、渠道过滤、SHA256哈希防篡改校验、自动下载与执行重启
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制全部' : '一键复制代码'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                加载代码模板中...
              </div>
            ) : (
              <pre className="select-all whitespace-pre font-mono">{currentCode}</pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            API 端点：
            <code className="text-blue-600 dark:text-blue-400 ml-1 font-mono">GET {serverUrl}/api/v1/update/check</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg transition cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
