import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { shouldIgnore } from '../utils/pathSecurity';
import { WebSocketMessage } from '../types';

type BroadcastFunction = (message: WebSocketMessage) => void;

let watcher: FSWatcher | null = null;
let currentWorkspaceRoot: string | null = null;

/**
 * Start watching a workspace directory for file changes
 */
export function startWatching(
  workspaceRoot: string,
  broadcast: BroadcastFunction
): void {
  // Stop existing watcher if any
  stopWatching();

  currentWorkspaceRoot = workspaceRoot;

  // Create chokidar watcher with ignore patterns
  watcher = chokidar.watch(workspaceRoot, {
    ignored: (filePath: string) => {
      const baseName = path.basename(filePath);
      const isDir = filePath.endsWith(path.sep);

      // Don't ignore the root
      if (filePath === workspaceRoot) {
        return false;
      }

      return shouldIgnore(baseName, isDir);
    },
    persistent: true,
    ignoreInitial: true, // Don't emit events for initial scan
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  // File added
  watcher.on('add', (filePath: string) => {
    broadcast({
      type: 'file:change',
      event: 'add',
      path: filePath,
    });
  });

  // File changed
  watcher.on('change', (filePath: string) => {
    broadcast({
      type: 'file:change',
      event: 'change',
      path: filePath,
    });
  });

  // File deleted
  watcher.on('unlink', (filePath: string) => {
    broadcast({
      type: 'file:change',
      event: 'unlink',
      path: filePath,
    });
  });

  // Directory added
  watcher.on('addDir', (_dirPath: string) => {
    // Trigger tree refresh for folder additions
    broadcast({
      type: 'tree:refresh',
    });
  });

  // Directory deleted
  watcher.on('unlinkDir', (dirPath: string) => {
    // Check if the root workspace itself was deleted
    if (dirPath === workspaceRoot) {
      console.log('Workspace root directory was deleted, stopping watcher');
      stopWatching();
      broadcast({
        type: 'workspace:deleted',
      });
      return;
    }

    // Trigger tree refresh for folder deletions
    broadcast({
      type: 'tree:refresh',
    });
  });

  // Error handling
  watcher.on('error', (error: Error) => {
    console.error('File watcher error:', error);
    // If error is ENOENT, the watched directory was likely deleted
    if ((error as any).code === 'ENOENT') {
      console.log('Watched directory no longer exists, stopping watcher');
      stopWatching();
    }
  });

  console.log(`File watcher started for: ${workspaceRoot}`);
}

/**
 * Stop the file watcher
 */
export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
    currentWorkspaceRoot = null;
    console.log('File watcher stopped');
  }
}

/**
 * Get the currently watched workspace root
 */
export function getCurrentWorkspaceRoot(): string | null {
  return currentWorkspaceRoot;
}
