'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Clock } from 'lucide-react';
import { filesApi } from '@/lib/api/filesApi';
import { useIDEStore } from '@/store/ideStore';

const RECENT_WORKSPACES_KEY = 'custle-recent-workspaces';
const MAX_RECENT = 5;

interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: string;
}

export function WorkspaceSelector() {
  const [folderPath, setFolderPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const { setWorkspace } = useIDEStore();

  // Load recent workspaces from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_WORKSPACES_KEY);
      if (stored) {
        setRecentWorkspaces(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent workspaces:', err);
    }
  }, []);

  const saveRecentWorkspace = (path: string, name: string) => {
    try {
      const existing = recentWorkspaces.filter((w) => w.path !== path);
      const updated = [
        { path, name, lastOpened: new Date().toISOString() },
        ...existing,
      ].slice(0, MAX_RECENT);

      setRecentWorkspaces(updated);
      localStorage.setItem(RECENT_WORKSPACES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save recent workspace:', err);
    }
  };

  const handleOpenWorkspace = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await filesApi.openWorkspace(path);

      // Update store
      setWorkspace(result.path, result.name);

      // Save to recent
      saveRecentWorkspace(result.path, result.name);
    } catch (err: any) {
      console.error('Failed to open workspace:', err);
      setError(err.response?.data?.error || err.message || 'Failed to open workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderPath.trim()) {
      handleOpenWorkspace(folderPath.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <FolderOpen className="w-20 h-20 text-blue-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Open a Folder to Start
            </h1>
            <p className="text-gray-400">
              Select a local folder to explore and edit files
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="folder-path" className="block text-sm font-medium text-gray-300 mb-2">
                Folder Path
              </label>
              <input
                id="folder-path"
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="/Users/yourname/projects/my-project"
                className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !folderPath.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 px-4 rounded transition-colors"
            >
              {loading ? 'Opening...' : 'Open Folder'}
            </button>
          </form>
        </div>

        {/* Recent Workspaces */}
        {recentWorkspaces.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              <span>Recent Workspaces</span>
            </div>

            <div className="space-y-2">
              {recentWorkspaces.map((workspace) => (
                <button
                  key={workspace.path}
                  onClick={() => handleOpenWorkspace(workspace.path)}
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded px-4 py-3 text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {workspace.name}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        {workspace.path}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
