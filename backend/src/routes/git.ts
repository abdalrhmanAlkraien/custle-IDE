import { Router, Request, Response } from 'express';
import * as gitService from '../services/gitService';
import { getCredentials } from '../services/githubService';
import { getCurrentWorkspace } from './workspace';

const router = Router();

/**
 * GET /api/git/status
 * Get comprehensive workspace git status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const workspace = getCurrentWorkspace();
    if (!workspace) {
      return res.json({ isRepo: false });
    }

    const status = await gitService.getWorkspaceGitStatus(workspace.path);
    return res.json(status);
  } catch (error: any) {
    console.error('Git status error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/git/diff?path=<file>
 * Get diff for a file (or all files if no path specified)
 */
router.get('/diff', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string | undefined;
    const diff = await gitService.getDiff(filePath);
    return res.json({ diff });
  } catch (error: any) {
    console.error('Git diff error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/git/log?limit=<number>
 * Get commit history
 */
router.get('/log', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const commits = await gitService.getLog(limit);
    return res.json({ commits });
  } catch (error: any) {
    console.error('Git log error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/git/branches
 * Get list of branches (local and remote)
 */
router.get('/branches', async (_req: Request, res: Response) => {
  try {
    const branches = await gitService.getBranches();
    return res.json(branches);
  } catch (error: any) {
    console.error('Git branches error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/stage
 * Stage files for commit
 * Body: { paths: string[] }
 */
router.post('/stage', async (req: Request, res: Response) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'paths array is required' });
    }

    const result = await gitService.stageFiles(paths);
    return res.json(result);
  } catch (error: any) {
    console.error('Git stage error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/unstage
 * Unstage files
 * Body: { paths: string[] }
 */
router.post('/unstage', async (req: Request, res: Response) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'paths array is required' });
    }

    const result = await gitService.unstageFiles(paths);
    return res.json(result);
  } catch (error: any) {
    console.error('Git unstage error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/commit
 * Commit staged changes
 * Body: { message: string }
 */
router.post('/commit', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'commit message is required' });
    }

    const result = await gitService.commit(message);
    return res.json(result);
  } catch (error: any) {
    console.error('Git commit error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/push
 * Push to remote repository
 * Uses GitHub PAT if available for HTTPS authentication
 * Body: { remote?: string, branch?: string }
 */
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { remote, branch } = req.body;

    // Check if GitHub credentials are available
    const githubCreds = getCredentials();

    if (githubCreds && githubCreds.token) {
      // Use PAT-authenticated push
      const result = await gitService.pushWithToken(
        githubCreds.token,
        remote || 'origin',
        branch
      );
      return res.json(result);
    } else {
      // Fall back to regular push (SSH or cached credentials)
      const result = await gitService.push(remote, branch);
      return res.json(result);
    }
  } catch (error: any) {
    console.error('Git push error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/pull
 * Pull from remote repository
 */
router.post('/pull', async (_req: Request, res: Response) => {
  try {
    const result = await gitService.pull();
    return res.json(result);
  } catch (error: any) {
    console.error('Git pull error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/checkout
 * Checkout a branch
 * Body: { branch: string }
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { branch } = req.body;

    if (!branch || typeof branch !== 'string' || branch.trim() === '') {
      return res.status(400).json({ error: 'branch name is required' });
    }

    const result = await gitService.checkout(branch);
    return res.json(result);
  } catch (error: any) {
    console.error('Git checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/branch/create
 * Create and checkout new branch
 * Body: { name: string }
 */
router.post('/branch/create', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'branch name is required' });
    }

    const result = await gitService.createBranch(name);
    return res.json(result);
  } catch (error: any) {
    console.error('Git create branch error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/stash
 * Stash current changes
 */
router.post('/stash', async (_req: Request, res: Response) => {
  try {
    const result = await gitService.stash();
    return res.json(result);
  } catch (error: any) {
    console.error('Git stash error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/stash/pop
 * Apply stashed changes
 */
router.post('/stash/pop', async (_req: Request, res: Response) => {
  try {
    const result = await gitService.stashPop();
    return res.json(result);
  } catch (error: any) {
    console.error('Git stash pop error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/git/clone
 * Clone a repository
 * Body: { url: string, path: string }
 */
router.post('/clone', async (req: Request, res: Response) => {
  try {
    const { url, path } = req.body;

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ error: 'repository URL is required' });
    }

    if (!path || typeof path !== 'string' || path.trim() === '') {
      return res.status(400).json({ error: 'target path is required' });
    }

    const result = await gitService.clone(url, path);
    return res.json(result);
  } catch (error: any) {
    console.error('Git clone error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
