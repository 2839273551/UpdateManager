import React, { useState } from 'react';
import { 
  Package, 
  Download, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  ShieldAlert, 
  Sliders, 
  FileText,
  Calendar,
  Layers,
  Copy,
  Check
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ReleaseItem({ release, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingRollout, setEditingRollout] = useState(false);
  const [rolloutVal, setRolloutVal] = useState(release.rollout_percentage);
  const [copiedHash, setCopiedHash] = useState(null);

  const handleToggleActive = () => {
    onUpdate(release.id, { is_active: !release.is_active });
  };

  const handleToggleMandatory = () => {
    onUpdate(release.id, { is_mandatory: !release.is_mandatory });
  };

  const handleSaveRollout = () => {
    onUpdate(release.id, { rollout_percentage: rolloutVal });
    setEditingRollout(false);
  };

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const pubDate = release.published_at 
    ? new Date(release.published_at).toLocaleString('zh-CN', { hour12: false }) 
    : '未知时间';

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      release.is_active 
        ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm' 
        : 'bg-slate-100/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/60 opacity-80'
    }`}>
      {/* Top Banner & Info */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            release.is_active 
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' 
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
          }`}>
            <Package className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                v{release.version}
              </span>

              {/* Channel badge */}
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
                release.channel === 'beta' 
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' 
                  : (release.channel === 'nightly' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20')
              }`}>
                {release.channel}
              </span>

              {/* Mandatory badge */}
              {release.is_mandatory ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  强制升级
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  常规更新
                </span>
              )}

              {/* Rollout badge */}
              <span className="text-[10px] text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                灰度: {release.rollout_percentage}%
              </span>

              {/* Inactive tag */}
              {!release.is_active && (
                <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  已停用分发
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{release.release_name}</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                {pubDate}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active toggle */}
          <button
            onClick={handleToggleActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              release.is_active
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {release.is_active ? '分发中 (点击暂停)' : '已暂停 (点击启用)'}
          </button>

          {/* Mandatory toggle */}
          <button
            onClick={handleToggleMandatory}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              release.is_mandatory
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {release.is_mandatory ? '设为普通' : '设为强更'}
          </button>

          {/* Rollout slider toggle */}
          <button
            onClick={() => setEditingRollout(!editingRollout)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>调整灰度</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(release.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="删除此版本"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rollout adjust slider panel */}
      {editingRollout && (
        <div className="px-5 py-3 bg-blue-50/70 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-500/20 flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center space-x-3">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
              灰度推送比例: {rolloutVal}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rolloutVal}
              onChange={(e) => setRolloutVal(Number(e.target.value))}
              className="w-full max-w-xs accent-blue-600"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              (按客户端机器标识哈希散列推送)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveRollout}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              保存比例
            </button>
            <button
              onClick={() => setEditingRollout(false)}
              className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Assets & Files section */}
      <div className="p-5 space-y-3">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>分发产物资产 ({release.assets?.length || 0} 个文件)</span>
          {release.changelog && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-normal cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{expanded ? '收起更新日志' : '展开更新日志'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {release.assets && release.assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {release.assets.map((asset) => (
              <div
                key={asset.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                      {asset.platform}
                    </span>
                    <span className="text-slate-900 dark:text-white font-mono truncate" title={asset.file_name}>
                      {asset.file_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{formatBytes(asset.file_size)}</span>
                    <span>·</span>
                    <span className="text-indigo-600 dark:text-indigo-300">已分发 {asset.download_count || 0} 次</span>
                    {asset.file_sha256 && (
                      <>
                        <span>·</span>
                        <button
                          onClick={() => copyHash(asset.file_sha256, asset.id)}
                          className="text-amber-600 dark:text-amber-400/90 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          title="点击复制 SHA256"
                        >
                          {copiedHash === asset.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>SHA256: {asset.file_sha256.slice(0, 8)}...</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <a
                  href={`/api/v1/update/download/${asset.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white dark:bg-slate-700/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-600 dark:text-slate-200 hover:text-white dark:hover:text-white border border-slate-200 dark:border-transparent rounded-lg transition shadow-2xs shrink-0"
                  title="直接下载安装包"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">
            未检测到安装包文件 (可在 GitHub Release 页面上传 Assets 或手动添加)
          </div>
        )}

        {/* Expandable Changelog */}
        {expanded && release.changelog && (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {release.changelog}
          </div>
        )}
      </div>
    </div>
  );
}
