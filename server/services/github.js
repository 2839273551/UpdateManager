const crypto = require('crypto');
const appService = require('./appService');
const releaseService = require('./releaseService');
const { parseChecksums, cleanVersion } = require('./semver');

/**
 * Verify GitHub webhook HMAC SHA256 signature
 */
function verifyWebhookSignature(secret, rawBody, signatureHeader) {
  if (!signatureHeader || !secret) return false;
  try {
    const [algorithm, signature] = signatureHeader.split('=');
    if (algorithm !== 'sha256' || !signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const expected = hmac.update(rawBody).digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Perform a GitHub API request with proper headers & optional token
 */
async function githubRequest(url, token) {
  const headers = {
    'User-Agent': 'GitDist-Update-Server/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch raw content of a release asset (e.g., checksums.txt)
 */
async function fetchAssetContent(downloadUrl, token) {
  try {
    const headers = { 'User-Agent': 'GitDist-Update-Server/1.0' };
    if (token) headers['Authorization'] = `token ${token}`;

    const res = await fetch(downloadUrl, { headers });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn(`Failed to fetch asset content from ${downloadUrl}:`, err.message);
    return null;
  }
}

/**
 * Sync releases from GitHub for a specific app
 */
async function syncAppReleases(appId) {
  const app = await appService.getApp(appId);
  if (!app) throw new Error(`App ${appId} not found`);

  const repo = app.github_repo;
  const token = app.github_token;

  const url = `https://api.github.com/repos/${repo}/releases?per_page=30`;
  const releases = await githubRequest(url, token);

  const syncedList = [];

  if (releases && releases.length > 0) {
    for (const ghRel of releases) {
      if (ghRel.draft) continue;

      let checksumMap = {};
      const checksumAsset = (ghRel.assets || []).find(a => {
        const n = a.name.toLowerCase();
        return n.endsWith('.sha256') || n.includes('checksum') || n.includes('sha256sum');
      });

      if (checksumAsset) {
        const content = await fetchAssetContent(checksumAsset.browser_download_url, token);
        if (content) {
          checksumMap = parseChecksums(content);
        }
      }

      const assets = (ghRel.assets || []).map(asset => {
        let sha256 = checksumMap[asset.name] || '';
        return {
          file_name: asset.name,
          file_size: asset.size,
          file_sha256: sha256,
          download_url: asset.browser_download_url,
          content_type: asset.content_type
        };
      });

      if (assets.length === 0) {
        assets.push({
          file_name: `${repo.split('/')[1]}-${ghRel.tag_name}.zip`,
          file_size: 0,
          file_sha256: '',
          download_url: `https://github.com/${repo}/archive/refs/tags/${ghRel.tag_name}.zip`,
          content_type: 'application/zip',
          platform: 'universal'
        });
      }

      const channel = ghRel.prerelease ? 'beta' : 'stable';

      const saved = await releaseService.createOrUpdateRelease({
        app_id: appId,
        version: ghRel.tag_name,
        tag_name: ghRel.tag_name,
        release_name: ghRel.name || ghRel.tag_name,
        changelog: ghRel.body || '',
        channel,
        is_mandatory: 0,
        is_active: 1,
        rollout_percentage: 100,
        github_release_id: ghRel.id,
        github_html_url: ghRel.html_url,
        published_at: ghRel.published_at || ghRel.created_at,
        assets
      });

      syncedList.push(saved);
    }
  } else {
    console.log(`[GitHub Sync] No releases found for ${repo}, fetching Git Tags instead...`);
    const tagsUrl = `https://api.github.com/repos/${repo}/tags?per_page=30`;
    const tags = await githubRequest(tagsUrl, token);

    for (const tag of (tags || [])) {
      const tagName = tag.name;
      const repoName = repo.split('/')[1] || 'app';
      const assets = [
        {
          file_name: `${repoName}-${tagName}.zip`,
          file_size: 0,
          file_sha256: '',
          download_url: `https://github.com/${repo}/archive/refs/tags/${tagName}.zip`,
          content_type: 'application/zip',
          platform: 'universal'
        }
      ];

      const saved = await releaseService.createOrUpdateRelease({
        app_id: appId,
        version: tagName,
        tag_name: tagName,
        release_name: `Release ${tagName}`,
        changelog: `版本标签 ${tagName} 自动生成`,
        channel: tagName.includes('beta') || tagName.includes('alpha') ? 'beta' : 'stable',
        is_mandatory: 0,
        is_active: 1,
        rollout_percentage: 100,
        github_release_id: null,
        github_html_url: `https://github.com/${repo}/releases/tag/${tagName}`,
        published_at: new Date().toISOString(),
        assets
      });

      syncedList.push(saved);
    }
  }

  return {
    success: true,
    count: syncedList.length,
    releases: syncedList
  };
}

module.exports = {
  verifyWebhookSignature,
  syncAppReleases
};
