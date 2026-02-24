import { Router, Request, Response } from 'express';
import {
  readFile,
  writeFile,
  createPath,
  deletePath,
  renamePath,
  searchFiles,
} from '../services/fileService';
import { getCurrentWorkspace } from './workspace';
import { PathTraversalError } from '../utils/pathSecurity';

const router = Router();

/**
 * GET /api/files/read?path=<absolute_path>
 * Read a file and return its content with metadata
 */
router.get('/read', async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Missing or invalid path parameter' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    const fileData = await readFile(path, workspace.path);

    res.json(fileData);
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message || 'Failed to read file' });
  }
});

/**
 * POST /api/files/write
 * Write content to a file
 */
router.post('/write', async (req: Request, res: Response) => {
  try {
    const { path, content } = req.body;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Missing or invalid path' });
      return;
    }

    if (content === undefined || content === null) {
      res.status(400).json({ error: 'Missing content' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    await writeFile(path, String(content), workspace.path);

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error writing file:', error);
    res.status(500).json({ error: error.message || 'Failed to write file' });
  }
});

/**
 * POST /api/files/create
 * Create a new file or folder
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { path, type } = req.body;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Missing or invalid path' });
      return;
    }

    if (type !== 'file' && type !== 'folder') {
      res.status(400).json({ error: 'Invalid type (must be "file" or "folder")' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    await createPath(path, type, workspace.path);

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error creating path:', error);
    res.status(500).json({ error: error.message || 'Failed to create path' });
  }
});

/**
 * DELETE /api/files/delete
 * Delete a file or folder
 */
router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;

    if (!path || typeof path !== 'string') {
      res.status(400).json({ error: 'Missing or invalid path' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    // Safety check: don't allow deleting workspace root
    if (path === workspace.path) {
      res.status(400).json({ error: 'Cannot delete workspace root' });
      return;
    }

    await deletePath(path, workspace.path);

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error deleting path:', error);
    res.status(500).json({ error: error.message || 'Failed to delete path' });
  }
});

/**
 * POST /api/files/rename
 * Rename or move a file/folder
 */
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { oldPath, newPath } = req.body;

    if (!oldPath || typeof oldPath !== 'string') {
      res.status(400).json({ error: 'Missing or invalid oldPath' });
      return;
    }

    if (!newPath || typeof newPath !== 'string') {
      res.status(400).json({ error: 'Missing or invalid newPath' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    await renamePath(oldPath, newPath, workspace.path);

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error renaming path:', error);
    res.status(500).json({ error: error.message || 'Failed to rename path' });
  }
});

/**
 * GET /api/files/search?q=<query>&root=<path>
 * Search for text in files
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, root } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Missing or invalid query parameter' });
      return;
    }

    const workspace = getCurrentWorkspace();
    if (!workspace) {
      res.status(400).json({ error: 'No workspace open' });
      return;
    }

    const searchRoot = (root && typeof root === 'string') ? root : workspace.path;

    const results = await searchFiles(q, searchRoot, workspace.path);

    res.json({ results });
  } catch (error: any) {
    if (error instanceof PathTraversalError) {
      res.status(403).json({ error: 'Path traversal detected' });
      return;
    }

    console.error('Error searching files:', error);
    res.status(500).json({ error: error.message || 'Failed to search files' });
  }
});

export default router;
