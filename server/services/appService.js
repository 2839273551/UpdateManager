const crypto = require('crypto');
const semver = require('semver');
const db = require('../db');

function generateSecret() {
  return crypto.randomBytes(24).toString('hex');
}

async function listApps() {
  const apps = await db.all(`
    SELECT 
      a.*,
      (SELECT COUNT(*) FROM releases r WHERE r.app_id = a.id) AS release_count,
      (SELECT COALESCE(SUM(ra.download_count), 0) 
       FROM release_assets ra 
       JOIN releases r ON ra.release_id = r.id 
       WHERE r.app_id = a.id) AS total_downloads
    FROM apps a
    ORDER BY a.created_at DESC
  `);

  for (const app of apps) {
    const rels = await db.all('SELECT version FROM releases WHERE app_id = ? AND is_active = 1', [app.id]);
    const vers = rels.map(r => r.version).filter(v => semver.valid(semver.coerce(v)));
    vers.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce(b)));
    app.latest_version = vers.length > 0 ? vers[0] : null;
  }
  return apps;
}

async function getApp(id) {
  return await db.get('SELECT * FROM apps WHERE id = ?', [id]);
}

async function createApp({ id, name, description, github_repo, github_token, webhook_secret, acceleration_proxy }) {
  const appId = id ? id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  const secret = webhook_secret ? webhook_secret.trim() : generateSecret();

  await db.run(`
    INSERT INTO apps (id, name, description, github_repo, github_token, webhook_secret, acceleration_proxy, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    appId,
    name.trim(),
    (description || '').trim(),
    github_repo.trim().replace(/^https?:\/\/github\.com\//, ''),
    (github_token || '').trim(),
    secret,
    acceleration_proxy || 'https://ghfast.top/',
    now,
    now
  ]);

  return await getApp(appId);
}

async function updateApp(id, data) {
  const app = await getApp(id);
  if (!app) return null;

  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  await db.run(`
    UPDATE apps 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        github_repo = COALESCE(?, github_repo),
        github_token = COALESCE(?, github_token),
        webhook_secret = COALESCE(?, webhook_secret),
        acceleration_proxy = COALESCE(?, acceleration_proxy),
        updated_at = ?
    WHERE id = ?
  `, [
    data.name !== undefined ? data.name.trim() : null,
    data.description !== undefined ? data.description.trim() : null,
    data.github_repo !== undefined ? data.github_repo.trim().replace(/^https?:\/\/github\.com\//, '') : null,
    data.github_token !== undefined ? data.github_token.trim() : null,
    data.webhook_secret !== undefined ? data.webhook_secret.trim() : null,
    data.acceleration_proxy !== undefined ? data.acceleration_proxy : null,
    now,
    id
  ]);

  return await getApp(id);
}

async function deleteApp(id) {
  const result = await db.run('DELETE FROM apps WHERE id = ?', [id]);
  return result.changes > 0;
}

async function getAppStats(id) {
  const totalRow = await db.get(`
    SELECT COALESCE(SUM(ra.download_count), 0) AS count 
    FROM release_assets ra 
    JOIN releases r ON ra.release_id = r.id 
    WHERE r.app_id = ?
  `, [id]);
  const totalDownloads = totalRow ? Number(totalRow.count) : 0;

  const relCountRow = await db.get('SELECT COUNT(*) AS count FROM releases WHERE app_id = ?', [id]);
  const releaseCount = relCountRow ? Number(relCountRow.count) : 0;

  const intervalSql = db.type === 'mysql'
    ? 'timestamp >= NOW() - INTERVAL 14 DAY'
    : "timestamp >= datetime('now', '-14 days')";

  const recentDownloads = await db.all(`
    SELECT DATE(timestamp) as date, COUNT(*) as count
    FROM download_logs
    WHERE app_id = ? AND ${intervalSql}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `, [id]);

  const platformDistribution = await db.all(`
    SELECT ra.platform, SUM(ra.download_count) as count
    FROM release_assets ra
    JOIN releases r ON ra.release_id = r.id
    WHERE r.app_id = ?
    GROUP BY ra.platform
  `, [id]);

  return {
    totalDownloads,
    releaseCount,
    recentDownloads,
    platformDistribution
  };
}

module.exports = {
  listApps,
  getApp,
  createApp,
  updateApp,
  deleteApp,
  getAppStats,
  generateSecret
};
