const express = require('express');
const router = express.Router();
const appService = require('../services/appService');
const releaseService = require('../services/releaseService');
const { verifyWebhookSignature } = require('../services/github');
const { parseChecksums } = require('../services/semver');

router.post('/:appId', async (req, res) => {
  const { appId } = req.params;
  const app = await appService.getApp(appId);

  if (!app) {
    return res.status(404).json({ error: `App ${appId} not found` });
  }

  const event = req.headers['x-github-event'];
  const signature = req.headers['x-hub-signature-256'];

  // GitHub sends ping event upon webhook creation
  if (event === 'ping') {
    return res.status(200).json({ msg: 'Webhook ping received successfully!' });
  }

  // Verify HMAC signature if secret is configured
  if (app.webhook_secret) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(app.webhook_secret, rawBody, signature);
    if (!isValid) {
      console.warn(`[Webhook] Invalid signature for app ${appId}`);
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  // Handle tag creation event
  if (event === 'create' && req.body.ref_type === 'tag') {
    const tagName = req.body.ref;
    console.log(`[Webhook] Tag created: ${tagName} for ${app.github_repo}`);
    const repo = app.github_repo;
    const repoName = repo.split('/')[1] || 'app';
    const assets = [{
      file_name: `${repoName}-${tagName}.zip`,
      file_size: 0,
      file_sha256: '',
      download_url: `https://github.com/${repo}/archive/refs/tags/${tagName}.zip`,
      content_type: 'application/zip',
      platform: 'universal'
    }];
    const saved = await releaseService.createOrUpdateRelease({
      app_id: appId,
      version: tagName,
      tag_name: tagName,
      release_name: `Release ${tagName}`,
      changelog: `标签 ${tagName} 自动触发发版`,
      channel: tagName.includes('beta') || tagName.includes('alpha') ? 'beta' : 'stable',
      is_mandatory: 0,
      is_active: 1,
      rollout_percentage: 100,
      published_at: new Date().toISOString(),
      assets
    });
    return res.json({ msg: 'Tag release created successfully', version: saved.version });
  }

  // Handle release event
  if (event === 'release') {
    const action = req.body.action;
    const ghRel = req.body.release;

    console.log(`[Webhook] Received release event action: ${action} for ${app.github_repo}`);

    if (action === 'deleted') {
      const rels = await releaseService.listReleases(appId);
      const existing = rels.find(r => r.tag_name === ghRel.tag_name);
      if (existing) {
        await releaseService.updateRelease(existing.id, { is_active: false });
      }
      return res.json({ msg: 'Release deactivated' });
    }

    if (['published', 'created', 'edited', 'prereleased'].includes(action)) {
      if (ghRel.draft) {
        return res.json({ msg: 'Ignored draft release' });
      }

      // Check if any asset contains checksums
      let checksumMap = {};
      const checksumAsset = (ghRel.assets || []).find(a => {
        const n = a.name.toLowerCase();
        return n.endsWith('.sha256') || n.includes('checksum') || n.includes('sha256sum');
      });

      if (checksumAsset) {
        try {
          const resp = await fetch(checksumAsset.browser_download_url);
          if (resp.ok) {
            const text = await resp.text();
            checksumMap = parseChecksums(text);
          }
        } catch (e) {
          console.warn('[Webhook] Failed to fetch checksums:', e.message);
        }
      }

      const assets = (ghRel.assets || []).map(asset => ({
        file_name: asset.name,
        file_size: asset.size,
        file_sha256: checksumMap[asset.name] || '',
        download_url: asset.browser_download_url,
        content_type: asset.content_type
      }));

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
        published_at: ghRel.published_at || new Date().toISOString(),
        assets
      });

      console.log(`[Webhook] Successfully saved release ${saved.version} for ${appId}`);
      return res.json({ msg: 'Release processed successfully', version: saved.version });
    }
  }

  return res.json({ msg: `Ignored event: ${event}` });
});

module.exports = router;
