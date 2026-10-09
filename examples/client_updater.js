/**
 * GitDist 客户端自动更新示例程序 (Node.js / Electron 适用)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const CONFIG = {
  server: 'http://103.231.59.78:3000',
  appId: 'wk',
  currentVersion: '8.5.0',
  platform: 'universal',
  channel: 'stable'
};

async function checkForUpdate() {
  const url = `${CONFIG.server}/api/v1/update/check?app_id=${CONFIG.appId}&version=${CONFIG.currentVersion}&platform=${CONFIG.platform}&channel=${CONFIG.channel}`;
  console.log(`[GitDist] 正在检查更新: ${url}`);
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const data = await res.json();

  if (!data.has_update) {
    console.log('[GitDist] 当前已是最新版本！');
    return null;
  }

  console.log(`[GitDist] 发现新版本: v${data.latest_version}`);
  console.log(`[GitDist] 强制更新: ${data.mandatory ? '是' : '否'}`);
  console.log('[GitDist] 更新日志:\n' + data.changelog);
  return data;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载失败: ${res.statusText}`);
  const fileStream = fs.createWriteStream(destPath);
  
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fileStream.write(Buffer.from(value));
  }
  fileStream.end();
}

function verifySha256(filePath, expectedSha256) {
  if (!expectedSha256) return true;
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  const actual = hash.digest('hex').toLowerCase();
  return actual === expectedSha256.toLowerCase();
}

async function run() {
  try {
    const update = await checkForUpdate();
    if (!update || !update.asset) return;

    const asset = update.asset;
    const dest = path.join(__dirname, `update_${asset.file_name}`);
    console.log(`[GitDist] 开始下载: ${asset.file_name} -> ${dest}`);
    
    await downloadFile(asset.download_url, dest);
    console.log('[GitDist] 下载完成，开始校验 SHA256...');

    if (!verifySha256(dest, asset.file_sha256)) {
      console.error('[GitDist] SHA256 校验失败，文件损坏！');
      fs.unlinkSync(dest);
      return;
    }

    console.log('[GitDist] 校验成功，启动新版本安装程序...');
    if (process.platform === 'win32') {
      spawn(dest, [], { detached: true, stdio: 'ignore' }).unref();
      process.exit(0);
    }
  } catch (err) {
    console.error('[GitDist] 更新出错:', err.message);
  }
}

run();
