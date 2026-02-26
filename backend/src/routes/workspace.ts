import { Router, Request, Response } from 'express';
import { buildTree } from '../services/fileService';
import { startWatching, stopWatching } from '../services/watcherService';
import { broadcast } from '../websocket/wsServer';
import { setWorkspaceRoot } from './agent';
import { initGit, getWorkspaceGitStatus } from '../services/gitService';
import { browseDirectory } from '../services/workspaceService';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Current workspace state
let currentWorkspace: { path: string; name: string } | null = null;

/**
 * GET /api/workspace
 * Returns current workspace info
 */
router.get('/', (_req: Request, res: Response) => {
  res.json(currentWorkspace);
});

/**
 * POST /api/workspace/open
 * Opens a workspace and returns the file tree
 */
router.post('/open', async (req: Request, res: Response) => {
  try {
    const { path: workspacePath } = req.body;

    if (!workspacePath || typeof workspacePath !== 'string') {
      res.status(400).json({ error: 'Missing or invalid path' });
      return;
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(workspacePath);

    // Check if directory exists
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' });
        return;
      }
    } catch (error) {
      res.status(404).json({ error: 'Directory not found' });
      return;
    }

    // Close existing workspace if any
    if (currentWorkspace) {
      await stopWatching();
    }

    // Set new workspace
    const name = path.basename(absolutePath);
    currentWorkspace = {
      path: absolutePath,
      name,
    };

    // Set workspace root for agent
    setWorkspaceRoot(absolutePath);

    // Initialize git for this workspace
    initGit(absolutePath);

    // Build file tree
    const tree = await buildTree(absolutePath, absolutePath);

    // Get git status for workspace
    const git = await getWorkspaceGitStatus(absolutePath);

    // Start file watcher
    startWatching(absolutePath, broadcast);

    res.json({
      path: absolutePath,
      name,
      tree,
      git,
    });
  } catch (error: any) {
    console.error('Error opening workspace:', error);
    res.status(500).json({ error: error.message || 'Failed to open workspace' });
  }
});

/**
 * POST /api/workspace/close
 * Closes the current workspace
 */
router.post('/close', async (_req: Request, res: Response) => {
  try {
    await stopWatching();
    currentWorkspace = null;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error closing workspace:', error);
    res.status(500).json({ error: error.message || 'Failed to close workspace' });
  }
});

/**
 * GET /api/workspace/tree
 * Returns the file tree for the current workspace
 */
router.get('/tree', async (_req: Request, res: Response) => {
  try {
    if (!currentWorkspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    // Check if workspace directory still exists
    try {
      const stats = await fs.stat(currentWorkspace.path);
      if (!stats.isDirectory()) {
        // Workspace path exists but is not a directory anymore
        await stopWatching();
        currentWorkspace = null;
        res.status(404).json({ error: 'Workspace directory no longer exists' });
        return;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Workspace directory was deleted
        await stopWatching();
        currentWorkspace = null;
        res.status(404).json({ error: 'Workspace directory no longer exists' });
        return;
      }
      throw error;
    }

    const tree = await buildTree(currentWorkspace.path, currentWorkspace.path);

    res.json(tree);
  } catch (error: any) {
    console.error('Error building tree:', error);
    res.status(500).json({ error: error.message || 'Failed to build tree' });
  }
});

/**
 * GET /api/workspace/browse
 * Browse directories for folder picker
 * No path traversal restriction - intentional (user browsing their own machine)
 */
router.get('/browse', async (req: Request, res: Response) => {
  try {
    const { path: dirPath } = req.query;

    const result = await browseDirectory(dirPath as string | undefined);

    return res.json(result);
  } catch (error: any) {
    if (error.message === 'Path does not exist') {
      return res.status(400).json({ error: 'Path does not exist' });
    }
    if (error.message === 'Not a directory') {
      return res.status(400).json({ error: 'Not a directory' });
    }
    if (error.message === 'Permission denied') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    console.error('Error browsing directory:', error);
    return res.status(500).json({ error: error.message || 'Failed to browse directory' });
  }
});

/**
 * Get current workspace (for use in other routes)
 */
export function getCurrentWorkspace(): { path: string; name: string } | null {
  return currentWorkspace;
}

export default router;
