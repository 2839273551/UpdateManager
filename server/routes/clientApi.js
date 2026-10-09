const express = require('express');
const router = express.Router();
const releaseService = require('../services/releaseService');

/**
 * Check for updates
 * GET /api/v1/update/check?app_id=xxx&version=1.0.0&platform=windows_x64&channel=stable&client_id=xxx
 */
router.get('/check', async (req, res) => {
  const appId = req.query.app_id || req.query.app;
  const version = req.query.version || req.query.current_version;
  const platform = req.query.platform || 'universal';
  const channel = req.query.channel || 'stable';
  const clientId = req.query.client_id || '';

  if (!appId) {
    return res.status(400).json({ error: 'Missing required parameter: app_id', has_update: false });
  }

  if (!version) {
    return res.status(400).json({ error: 'Missing required parameter: version', has_update: false });
  }

  // Derive client IP and server base URL
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  try {
    const result = await releaseService.findUpdateForClient({
      appId,
      currentVersion: version,
      platform,
      channel,
      clientId,
      clientIp,
      baseUrl
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message, has_update: false });
  }
});

/**
 * Download asset and record telemetry
 * GET /api/v1/update/download/:assetId
 */
router.get('/download/:assetId', async (req, res) => {
  const { assetId } = req.params;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const userAgent = req.get('user-agent') || '';
  const clientId = req.query.client_id || '';

  try {
    const downloadUrl = await releaseService.recordAndGetDownloadUrl(assetId, {
      ip: clientIp,
      userAgent,
      clientId
    });

    if (!downloadUrl) {
      return res.status(404).send('Update asset not found');
    }

    // Redirect client to target accelerated/direct URL
    return res.redirect(302, downloadUrl);
  } catch (err) {
    return res.status(500).send('Error processing download');
  }
});

/**
 * Client report (telemetry)
 * POST /api/v1/update/report
 */
router.post('/report', (req, res) => {
  const { app_id, version, status, error_message, client_id } = req.body || {};
  console.log(`[Update Report] App: ${app_id}, Version: ${version}, Status: ${status}, Client: ${client_id}`);
  if (error_message) {
    console.warn(`[Update Report Error] ${error_message}`);
  }
  return res.json({ success: true });
});

module.exports = router;
