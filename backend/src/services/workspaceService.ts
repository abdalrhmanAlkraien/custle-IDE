import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export interface BrowseDir {
  name: string;
  path: string;
  hasChildren: boolean;
}

export interface QuickAccessDir {
  name: string;
  path: string;
}

export interface BrowseResult {
  current: string;
  parent: string | null;
  dirs: BrowseDir[];
  quickAccess: QuickAccessDir[];
}

/**
 * Browse a directory and return subdirectories (not files)
 * Used for folder picker UI
 *
 * @param dirPath - Optional path to browse. If omitted, uses OS home directory
 * @returns BrowseResult with current path, parent, subdirectories, and quick access shortcuts
 */
export async function browseDirectory(dirPath?: string): Promise<BrowseResult> {
  const target = dirPath ? path.resolve(dirPath) : os.homedir();

  // Validate path exists
  let stat;
  try {
    stat = await fs.stat(target);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('Path does not exist');
    }
    if (error.code === 'EACCES') {
      throw new Error('Permission denied');
    }
    throw error;
  }

  // Validate it's a directory
  if (!stat.isDirectory()) {
    throw new Error('Not a directory');
  }

  // Read directory entries
  const entries = await fs.readdir(target, { withFileTypes: true }).catch(() => []);

  // Filter to directories only and check if they have children
  const dirs: BrowseDir[] = await Promise.all(
    entries
      .filter(e => e.isDirectory())
      .map(async e => {
        const fullPath = path.join(target, e.name);

        // Check if directory has subdirectories (simplified: check if any children exist)
        let hasChildren = false;
        try {
          const children = await fs.readdir(fullPath);
          hasChildren = children.length > 0;
        } catch {
          // Permission denied or other error - assume no children
          hasChildren = false;
        }

        return {
          name: e.name,
          path: fullPath,
          hasChildren
        };
      })
  );

  // Sort directories alphabetically (case-insensitive)
  dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  // Calculate parent directory
  const parentDir = path.dirname(target);
  const parent = parentDir !== target ? parentDir : null;

  // Build quick access shortcuts
  const home = os.homedir();
  const quickAccessPaths: QuickAccessDir[] = [
    { name: 'Home', path: home },
    { name: 'Desktop', path: path.join(home, 'Desktop') },
    { name: 'Documents', path: path.join(home, 'Documents') },
    { name: 'Downloads', path: path.join(home, 'Downloads') },
  ];

  // Filter quick access to only existing directories
  const quickAccess: QuickAccessDir[] = [];
  for (const qa of quickAccessPaths) {
    try {
      const qaStat = await fs.stat(qa.path);
      if (qaStat.isDirectory()) {
        quickAccess.push(qa);
      }
    } catch {
      // Directory doesn't exist - skip it
    }
  }

  return {
    current: target,
    parent,
    dirs,
    quickAccess
  };
}
