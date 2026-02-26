'use client';

import { useState, useEffect } from 'react';
import { Folder, Home, ChevronRight, X, HardDrive } from 'lucide-react';

interface BrowseDir {
  name: string;
  path: string;
  hasChildren: boolean;
}

interface QuickAccessDir {
  name: string;
  path: string;
}

interface BrowseResult {
  current: string;
  parent: string | null;
  dirs: BrowseDir[];
  quickAccess: QuickAccessDir[];
}

interface FolderBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function FolderBrowser({ isOpen, onClose, onSelect }: FolderBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [dirs, setDirs] = useState<BrowseDir[]>([]);
  const [quickAccess, setQuickAccess] = useState<QuickAccessDir[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = async (path?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = path
        ? `http://localhost:3001/api/workspace/browse?path=${encodeURIComponent(path)}`
        : 'http://localhost:3001/api/workspace/browse';

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to browse directory');
      }

      const data: BrowseResult = await response.json();

      setCurrentPath(data.current);
      setDirs(data.dirs);
      setQuickAccess(data.quickAccess);
      setParentPath(data.parent);
    } catch (err: any) {
      console.error('Browse error:', err);
      setError(err.message || 'Failed to browse directory');
    } finally {
      setLoading(false);
    }
  };

  // Load home directory when modal opens
  useEffect(() => {
    if (isOpen && !currentPath) {
      fetchDirectory();
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    fetchDirectory(path);
  };

  const handleUp = () => {
    if (parentPath) {
      fetchDirectory(parentPath);
    }
  };

  const handleSelect = () => {
    if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  };

  const handleQuickAccess = (path: string) => {
    fetchDirectory(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Select Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Path + Up Button */}
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 text-sm text-gray-300 font-mono truncate">
              {currentPath || 'Loading...'}
            </div>
            {parentPath && (
              <button
                onClick={handleUp}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
              >
                Up
              </button>
            )}
          </div>
        </div>

        {/* Quick Access */}
        {quickAccess.length > 0 && (
          <div className="p-4 border-b border-gray-700">
            <div className="text-xs font-medium text-gray-400 mb-2">Quick Access</div>
            <div className="flex flex-wrap gap-2">
              {quickAccess.map((qa) => (
                <button
                  key={qa.path}
                  onClick={() => handleQuickAccess(qa.path)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Home className="w-3.5 h-3.5" />
                  {qa.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">{error}</div>
          ) : dirs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No subdirectories</div>
          ) : (
            <div className="space-y-1">
              {dirs.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => handleNavigate(dir.path)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-900/30 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600 rounded transition-colors disabled:opacity-50 text-left"
                >
                  <Folder className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="flex-1 text-white truncate">{dir.name}</span>
                  {dir.hasChildren && (
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700 bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!currentPath || loading}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
          >
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
}
