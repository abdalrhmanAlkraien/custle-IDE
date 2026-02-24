import { useState, useCallback, useEffect } from 'react';
import { filesApi, type FileNode } from '../lib/api/filesApi';
import { useFileWatcher } from './useFileWatcher';
import { useIDEStore } from '../store/ideStore';

export function useFileTree() {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshOpenFile } = useIDEStore();

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newTree = await filesApi.getTree();
      setTree(newTree);
    } catch (err: any) {
      console.error('Failed to fetch tree:', err);
      setError(err.message || 'Failed to load file tree');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // WebSocket file watcher
  useFileWatcher({
    onTreeRefresh: () => {
      console.log('[useFileTree] Refreshing tree due to external change');
      fetchTree();
    },
    onFileChange: (event, path) => {
      console.log(`[useFileTree] File ${event}: ${path}`);

      // If the file is currently open in a tab, refresh it
      if (event === 'change') {
        refreshOpenFile(path);
      }

      // Refresh tree to show updated state
      fetchTree();
    },
    onConnected: () => {
      console.log('[useFileTree] WebSocket connected');
    },
    onDisconnected: () => {
      console.log('[useFileTree] WebSocket disconnected');
    },
  });

  return {
    tree,
    loading,
    error,
    fetchTree,
    setTree,
  };
}
