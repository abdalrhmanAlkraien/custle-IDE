'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, MoreVertical } from 'lucide-react';
import { type FileNode, filesApi } from '@/lib/api/filesApi';
import { getFileIcon, getFolderIcon, getFileIconColor } from '@/lib/fileIcons';
import { useIDEStore } from '@/store/ideStore';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  expandedFolders: Set<string>;
  onToggleExpand: (path: string) => void;
  onRefresh: () => void;
}

export function FileTreeItem({
  node,
  depth,
  expandedFolders,
  onToggleExpand,
  onRefresh,
}: FileTreeItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { openTab } = useIDEStore();

  const isExpanded = expandedFolders.has(node.path);
  const Icon = node.type === 'folder' ? getFolderIcon(isExpanded) : getFileIcon(node.name);
  const iconColor = node.type === 'file' ? getFileIconColor(node.name) : 'text-blue-400';

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showContextMenu]);

  const handleClick = async () => {
    if (node.type === 'folder') {
      onToggleExpand(node.path);
    } else {
      // Open file in editor
      try {
        const fileData = await filesApi.readFile(node.path);
        openTab({
          path: node.path,
          relativePath: node.relativePath,
          name: node.name,
          content: fileData.content,
          language: fileData.language,
        });
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    }
  };

  const handleDoubleClick = () => {
    // Start inline rename
    setIsRenaming(true);
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== node.name) {
      try {
        const dirPath = node.path.substring(0, node.path.lastIndexOf('/'));
        const newPath = `${dirPath}/${newName}`;
        await filesApi.renameFile(node.path, newPath);
        onRefresh();
      } catch (error) {
        console.error('Failed to rename:', error);
      }
    }
    setIsRenaming(false);
    setNewName(node.name);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(node.name);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      try {
        await filesApi.deleteFile(node.path);
        onRefresh();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
    setShowContextMenu(false);
  };

  const handleNewFile = async () => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const newPath = node.type === 'folder' ? `${node.path}/${fileName}` : `${node.path.substring(0, node.path.lastIndexOf('/'))}/${fileName}`;
        await filesApi.createFile(newPath);
        onRefresh();
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
    setShowContextMenu(false);
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const newPath = node.type === 'folder' ? `${node.path}/${folderName}` : `${node.path.substring(0, node.path.lastIndexOf('/'))}/${folderName}`;
        await filesApi.createFolder(newPath);
        onRefresh();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
    setShowContextMenu(false);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
    setShowContextMenu(false);
  };

  const itemCount = node.type === 'folder' && node.children ? node.children.length : 0;

  return (
    <>
      <div
        className="group flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer select-none"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse chevron for folders */}
        {node.type === 'folder' && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}

        {/* Icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleRenameKeyDown}
            className="flex-1 bg-gray-900 border border-blue-500 rounded px-1 py-0 text-sm text-white focus:outline-none"
          />
        ) : (
          <span className="flex-1 text-sm text-gray-200 truncate">{node.name}</span>
        )}

        {/* Item count badge for folders */}
        {node.type === 'folder' && itemCount > 0 && (
          <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
            {itemCount}
          </span>
        )}

        {/* Context menu button */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e as any);
          }}
        >
          <MoreVertical className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button
            onClick={handleNewFile}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            New File
          </button>
          <button
            onClick={handleNewFolder}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            New Folder
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            onClick={() => {
              setIsRenaming(true);
              setShowContextMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700"
          >
            Delete
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            onClick={handleCopyPath}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
          >
            Copy Path
          </button>
        </div>
      )}

      {/* Render children if folder is expanded */}
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </>
  );
}
