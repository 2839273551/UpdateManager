const crypto = require('crypto');
const semver = require('semver');
const db = require('../db');
const { cleanVersion, isNewerVersion, detectPlatform } = require('./semver');

async function listReleases(appId) {
  const releases = await db.all('SELECT * FROM releases WHERE app_id = ?', [appId]);

  // Sort by SemVer descending
  releases.sort((a, b) => {
    const va = semver.coerce(a.version);
    const vb = semver.coerce(b.version);
    if (va && vb) {
      return semver.rcompare(va, vb);
    }
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const allAssets = await db.all(`
    SELECT ra.* FROM release_assets ra
    JOIN releases r ON ra.release_id = r.id
    WHERE r.app_id = ?
    ORDER BY ra.platform ASC
  `, [appId]);

  return releases.map(rel => {
    return {
      ...rel,
      is_mandatory: Boolean(rel.is_mandatory),
      is_active: Boolean(rel.is_active),
      assets: allAssets.filter(a => a.release_id === rel.id)
    };
  });
}

async function getRelease(id) {
  const rel = await db.get('SELECT * FROM releases WHERE id = ?', [id]);
  if (!rel) return null;
  const assets = await db.all('SELECT * FROM release_assets WHERE release_id = ?', [id]);
  return {
    ...rel,
    is_mandatory: Boolean(rel.is_mandatory),
    is_active: Boolean(rel.is_active),
    assets
  };
}

async function createOrUpdateRelease({
  app_id,
  version,
  tag_name,
  release_name,
  changelog,
  channel = 'stable',
  is_mandatory = 0,
  is_active = 1,
  rollout_percentage = 100,
  github_release_id = null,
  github_html_url = '',
  published_at,
  assets = []
}) {
  const normalizedVer = cleanVersion(version || tag_name) || tag_name;
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  const pubDate = (published_at ? new Date(published_at).toISOString() : new Date().toISOString()).replace('T', ' ').replace('Z', '').split('.')[0];

  // Check if release with same app_id and tag_name/version exists
  const existing = await db.get(
    'SELECT id FROM releases WHERE app_id = ? AND (tag_name = ? OR version = ?)',
    [app_id, tag_name, normalizedVer]
  );

  let releaseId;

  if (existing) {
    releaseId = existing.id;
    await db.run(`
      UPDATE releases SET
        version = ?,
        tag_name = ?,
        release_name = ?,
        changelog = ?,
        channel = ?,
        github_release_id = COALESCE(?, github_release_id),
        github_html_url = COALESCE(?, github_html_url),
        published_at = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      normalizedVer,
      tag_name,
      release_name || tag_name,
      changelog || '',
      channel,
      github_release_id,
      github_html_url,
      pubDate,
      now,
      releaseId
    ]);
  } else {
    const info = await db.run(`
      INSERT INTO releases (
        app_id, version, tag_name, release_name, changelog, channel,
        is_mandatory, is_active, rollout_percentage, github_release_id,
        github_html_url, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      app_id,
      normalizedVer,
      tag_name,
      release_name || tag_name,
      changelog || '',
      channel,
      is_mandatory ? 1 : 0,
      is_active ? 1 : 0,
      rollout_percentage,
      github_release_id,
      github_html_url,
      pubDate,
      now,
      now
    ]);
    releaseId = info.lastInsertRowid;
  }

  // Upsert assets
  if (Array.isArray(assets) && assets.length > 0) {
    for (const asset of assets) {
      const platform = asset.platform || detectPlatform(asset.file_name);
      if (platform === 'metadata') continue;

      const existAsset = await db.get(
        'SELECT id FROM release_assets WHERE release_id = ? AND file_name = ?',
        [releaseId, asset.file_name]
      );

      if (existAsset) {
        await db.run(`
          UPDATE release_assets SET
            platform = ?,
            file_size = ?,
            file_sha256 = COALESCE(NULLIF(?, ''), file_sha256),
            download_url = ?,
            content_type = ?
          WHERE id = ?
        `, [
          platform,
          asset.file_size || 0,
          asset.file_sha256 || '',
          asset.download_url,
          asset.content_type || '',
          existAsset.id
        ]);
      } else {
        await db.run(`
          INSERT INTO release_assets (
            release_id, platform, file_name, file_size, file_sha256, download_url, content_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          releaseId,
          platform,
          asset.file_name,
          asset.file_size || 0,
          asset.file_sha256 || '',
          asset.download_url,
          asset.content_type || '',
          now
        ]);
      }
    }
  }

  return await getRelease(releaseId);
}

async function updateRelease(id, patch) {
  const rel = await getRelease(id);
  if (!rel) return null;

  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  const fields = [];
  const params = [];

  if (patch.is_mandatory !== undefined) {
    fields.push('is_mandatory = ?');
    params.push(patch.is_mandatory ? 1 : 0);
  }
  if (patch.is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(patch.is_active ? 1 : 0);
  }
  if (patch.rollout_percentage !== undefined) {
    fields.push('rollout_percentage = ?');
    params.push(Math.max(0, Math.min(100, Number(patch.rollout_percentage))));
  }
  if (patch.changelog !== undefined) {
    fields.push('changelog = ?');
    params.push(patch.changelog);
  }
  if (patch.channel !== undefined) {
    fields.push('channel = ?');
    params.push(patch.channel);
  }
  if (patch.version !== undefined) {
    fields.push('version = ?');
    params.push(cleanVersion(patch.version) || patch.version);
  }

  if (fields.length === 0) return rel;

  fields.push('updated_at = ?');
  params.push(now);
  params.push(id);

  await db.run(`UPDATE releases SET ${fields.join(', ')} WHERE id = ?`, params);
  return await getRelease(id);
}

async function deleteRelease(id) {
  const res = await db.run('DELETE FROM releases WHERE id = ?', [id]);
  return res.changes > 0;
}

function isClientInRollout(identifier, releaseVersion, percentage) {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const key = `${identifier}:${releaseVersion}`;
  const hash = crypto.createHash('md5').update(key).digest('hex');
  const bucket = parseInt(hash.slice(0, 4), 16) % 100;
  return bucket < percentage;
}

async function findUpdateForClient({ appId, currentVersion, platform, channel = 'stable', clientId = '', clientIp = '', baseUrl = '' }) {
  const app = await db.get('SELECT * FROM apps WHERE id = ?', [appId]);
  if (!app) {
    return { error: 'App not found', has_update: false };
  }

  const cleanCurrent = cleanVersion(currentVersion);
  if (!cleanCurrent) {
    return { error: 'Invalid current version format. Expected semver like 1.0.0', has_update: false };
  }

  let channelQuery = "channel = 'stable'";
  if (channel === 'beta') {
    channelQuery = "(channel = 'stable' OR channel = 'beta')";
  } else if (channel === 'nightly') {
    channelQuery = '1 = 1';
  }

  const allActiveReleases = await db.all(`
    SELECT * FROM releases 
    WHERE app_id = ? AND is_active = 1 AND ${channelQuery}
    ORDER BY published_at DESC, id DESC
  `, [appId]);

  if (allActiveReleases.length === 0) {
    return { has_update: false, message: 'No active releases found' };
  }

  const sortedReleases = allActiveReleases.filter(r => cleanVersion(r.version)).sort((a, b) => {
    return semver.rcompare(cleanVersion(a.version), cleanVersion(b.version));
  });

  const clientIdentifier = clientId || clientIp || 'default_client';

  let targetRelease = null;
  let isMandatoryUpdate = false;

  for (const rel of sortedReleases) {
    const relVer = cleanVersion(rel.version);
    if (!semver.gt(relVer, cleanCurrent)) {
      break;
    }

    if (rel.is_mandatory) {
      isMandatoryUpdate = true;
    }

    if (!targetRelease) {
      if (isClientInRollout(clientIdentifier, relVer, rel.rollout_percentage)) {
        targetRelease = rel;
      }
    }
  }

  if (!targetRelease) {
    return {
      has_update: false,
      current_version: cleanCurrent,
      message: 'Already on the latest available version'
    };
  }

  const assets = await db.all('SELECT * FROM release_assets WHERE release_id = ?', [targetRelease.id]);

  let matchedAsset = null;
  const reqPlatform = (platform || 'universal').toLowerCase();

  matchedAsset = assets.find(a => a.platform.toLowerCase() === reqPlatform);

  if (!matchedAsset) {
    matchedAsset = assets.find(a => {
      const p = a.platform.toLowerCase();
      if (reqPlatform.includes('win') && p.includes('win')) return true;
      if (reqPlatform.includes('mac') && (p.includes('mac') || p.includes('darwin'))) return true;
      if (reqPlatform.includes('linux') && p.includes('linux')) return true;
      return false;
    });
  }

  if (!matchedAsset) {
    matchedAsset = assets.find(a => a.platform === 'universal') || assets[0];
  }

  let downloadUrl = '';
  if (matchedAsset) {
    downloadUrl = `${baseUrl}/api/v1/update/download/${matchedAsset.id}`;
  }

  return {
    has_update: true,
    latest_version: targetRelease.version,
    release_name: targetRelease.release_name || `v${targetRelease.version}`,
    changelog: targetRelease.changelog || '',
    published_at: targetRelease.published_at,
    mandatory: isMandatoryUpdate || Boolean(targetRelease.is_mandatory),
    asset: matchedAsset ? {
      id: matchedAsset.id,
      file_name: matchedAsset.file_name,
      file_size: matchedAsset.file_size,
      file_sha256: matchedAsset.file_sha256 || '',
      platform: matchedAsset.platform,
      download_url: downloadUrl
    } : null
  };
}

async function recordAndGetDownloadUrl(assetId, clientInfo = {}) {
  const asset = await db.get(`
    SELECT ra.*, r.app_id, r.version, a.acceleration_proxy
    FROM release_assets ra
    JOIN releases r ON ra.release_id = r.id
    JOIN apps a ON r.app_id = a.id
    WHERE ra.id = ?
  `, [assetId]);

  if (!asset) return null;

  await db.run('UPDATE release_assets SET download_count = download_count + 1 WHERE id = ?', [assetId]);

  const now = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
  await db.run(`
    INSERT INTO download_logs (app_id, version, platform, ip, user_agent, client_id, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    asset.app_id,
    asset.version,
    asset.platform,
    clientInfo.ip || '',
    clientInfo.userAgent || '',
    clientInfo.clientId || '',
    now
  ]);

  let targetUrl = asset.download_url;
  const proxy = asset.acceleration_proxy;

  if (proxy && proxy !== 'direct' && targetUrl.startsWith('https://github.com/')) {
    const proxyPrefix = proxy.endsWith('/') ? proxy : `${proxy}/`;
    targetUrl = `${proxyPrefix}${targetUrl}`;
  }

  return targetUrl;
}

module.exports = {
  listReleases,
  getRelease,
  createOrUpdateRelease,
  updateRelease,
  deleteRelease,
  findUpdateForClient,
  recordAndGetDownloadUrl
};
