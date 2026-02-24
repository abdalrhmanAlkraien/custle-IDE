'use client';

import { useState, useEffect } from 'react';
import { FileTreeItem } from './FileTreeItem';
import { useFileTree } from '@/hooks/useFileTree';
import { Loader2 } from 'lucide-react';

export function FileTree() {
  const { tree, loading, error, fetchTree } = useFileTree();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Auto-expand root folder when tree loads
  useEffect(() => {
    if (tree && !expandedFolders.has(tree.path)) {
      setExpandedFolders(new Set([tree.path]));
    }
  }, [tree]);

  const handleToggleExpand = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm">
        <p>Failed to load file tree:</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!tree) {
    return null;
  }

  return (
    <div className="overflow-y-auto h-full">
      <FileTreeItem
        node={tree}
        depth={0}
        expandedFolders={expandedFolders}
        onToggleExpand={handleToggleExpand}
        onRefresh={fetchTree}
      />
    </div>
  );
}
