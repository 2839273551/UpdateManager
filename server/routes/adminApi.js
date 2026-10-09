const express = require('express');
const router = express.Router();
const appService = require('../services/appService');
const releaseService = require('../services/releaseService');
const githubService = require('../services/github');
const config = require('../config');
const db = require('../db');

// List all apps
router.get('/apps', async (req, res) => {
  try {
    const apps = await appService.listApps();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create app
router.post('/apps', async (req, res) => {
  try {
    const { id, name, description, github_repo, github_token, webhook_secret, acceleration_proxy } = req.body;
    if (!name || !github_repo) {
      return res.status(400).json({ error: 'Name and GitHub Repo (owner/repo) are required' });
    }
    const app = await appService.createApp({
      id,
      name,
      description,
      github_repo,
      github_token,
      webhook_secret,
      acceleration_proxy
    });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get app details & stats
router.get('/apps/:id', async (req, res) => {
  try {
    const app = await appService.getApp(req.params.id);
    if (!app) return res.status(404).json({ error: 'App not found' });
    const stats = await appService.getAppStats(req.params.id);
    res.json({ app, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update app
router.put('/apps/:id', async (req, res) => {
  try {
    const app = await appService.updateApp(req.params.id, req.body);
    if (!app) return res.status(404).json({ error: 'App not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete app
router.delete('/apps/:id', async (req, res) => {
  try {
    const success = await appService.deleteApp(req.params.id);
    if (!success) return res.status(404).json({ error: 'App not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual sync from GitHub
router.post('/apps/:id/sync', async (req, res) => {
  try {
    const result = await githubService.syncAppReleases(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Manual sync failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// List releases of an app
router.get('/apps/:id/releases', async (req, res) => {
  try {
    const releases = await releaseService.listReleases(req.params.id);
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create manual release
router.post('/apps/:id/releases', async (req, res) => {
  try {
    const { version, release_name, changelog, channel, is_mandatory, is_active, rollout_percentage, assets } = req.body;
    if (!version) {
      return res.status(400).json({ error: 'Version is required' });
    }
    const release = await releaseService.createOrUpdateRelease({
      app_id: req.params.id,
      version,
      tag_name: version.startsWith('v') ? version : `v${version}`,
      release_name: release_name || `Version ${version}`,
      changelog: changelog || '',
      channel: channel || 'stable',
      is_mandatory: is_mandatory ? 1 : 0,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
      rollout_percentage: rollout_percentage !== undefined ? Number(rollout_percentage) : 100,
      assets: assets || []
    });
    res.status(201).json(release);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update release
router.put('/releases/:id', async (req, res) => {
  try {
    const updated = await releaseService.updateRelease(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Release not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete release
router.delete('/releases/:id', async (req, res) => {
  try {
    const success = await releaseService.deleteRelease(Number(req.params.id));
    if (!success) return res.status(404).json({ error: 'Release not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulator test
router.post('/test-check', async (req, res) => {
  try {
    const { appId, currentVersion, platform, channel, clientId } = req.body;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const result = await releaseService.findUpdateForClient({
      appId,
      currentVersion,
      platform,
      channel,
      clientId,
      baseUrl
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System info
router.get('/system', async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const appRow = await db.get('SELECT COUNT(*) as count FROM apps');
    const totalApps = appRow ? Number(appRow.count) : 0;

    const relRow = await db.get('SELECT COUNT(*) as count FROM releases');
    const totalReleases = relRow ? Number(relRow.count) : 0;

    const downRow = await db.get('SELECT COALESCE(SUM(download_count), 0) as count FROM release_assets');
    const totalDownloads = downRow ? Number(downRow.count) : 0;

    res.json({
      version: '1.0.0',
      baseUrl,
      availableProxies: config.AVAILABLE_PROXIES,
      stats: {
        totalApps,
        totalReleases,
        totalDownloads
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
