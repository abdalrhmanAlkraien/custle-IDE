import express from 'express';
import {
  validateToken,
  saveCredentials,
  getCredentials,
  deleteCredentials,
  fetchAndSaveRepos,
  getCachedRepos
} from '../services/githubService';

const router = express.Router();

/**
 * POST /api/github/connect
 * Validates token via GitHub API, saves credentials, fetches and caches all repos
 */
router.post('/connect', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate token with GitHub API
    const user = await validateToken(token);

    // Save credentials
    saveCredentials(token, user);

    // Fetch and cache all repos
    const repoCount = await fetchAndSaveRepos(token);

    // SECURITY: Never return token in response - only username, avatar_url, name
    return res.json({
      username: user.login,
      avatar_url: user.avatar_url,
      name: user.name,
      repo_count: repoCount
    });
  } catch (error: any) {
    if (error.message === 'Invalid GitHub token') {
      return res.status(401).json({ error: 'Invalid GitHub token' });
    }
    console.error('GitHub connect error:', error);
    return res.status(500).json({ error: 'Failed to connect to GitHub' });
  }
});

/**
 * GET /api/github/status
 * Returns current connection status
 */
router.get('/status', (_req, res) => {
  try {
    const credentials = getCredentials();

    if (!credentials) {
      return res.json({ connected: false });
    }

    // SECURITY: Never return token - only username, avatar_url, name
    return res.json({
      connected: true,
      username: credentials.username,
      avatar_url: credentials.avatar_url,
      name: credentials.name
    });
  } catch (error: any) {
    console.error('GitHub status error:', error);
    return res.status(500).json({ error: 'Failed to check GitHub status' });
  }
});

/**
 * GET /api/github/repos
 * Returns cached repos from DB
 */
router.get('/repos', (_req, res) => {
  try {
    const credentials = getCredentials();

    if (!credentials) {
      return res.status(401).json({ error: 'Not connected to GitHub' });
    }

    const repos = getCachedRepos();

    return res.json({
      repos,
      count: repos.length
    });
  } catch (error: any) {
    console.error('GitHub repos error:', error);
    return res.status(500).json({ error: 'Failed to load repositories' });
  }
});

/**
 * POST /api/github/repos/refresh
 * Re-fetches repos from GitHub API and updates cache
 */
router.post('/repos/refresh', async (_req, res) => {
  try {
    const credentials = getCredentials();

    if (!credentials) {
      return res.status(401).json({ error: 'Not connected to GitHub' });
    }

    const repoCount = await fetchAndSaveRepos(credentials.token);

    return res.json({
      repo_count: repoCount,
      refreshed_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('GitHub refresh error:', error);
    return res.status(500).json({ error: 'Failed to refresh repositories' });
  }
});

/**
 * DELETE /api/github/disconnect
 * Removes credentials and cached repos
 */
router.delete('/disconnect', (_req, res) => {
  try {
    deleteCredentials();

    return res.json({ success: true });
  } catch (error: any) {
    console.error('GitHub disconnect error:', error);
    return res.status(500).json({ error: 'Failed to disconnect from GitHub' });
  }
});

export default router;
