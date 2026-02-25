'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, File, Command, ChevronRight } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { useFileTreeStore } from '@/store/fileTreeStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface FileItem {
  path: string;
  relativePath: string;
  name: string;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'file' | 'command'>('file');

  const ideStore = useIDEStore();
  const { fileTree } = useFileTreeStore();

  // Build commands list
  const commands: Command[] = [
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      description: 'Show/hide the sidebar',
      icon: <Command className="w-4 h-4" />,
      action: () => {
        ideStore.toggleSidebar();
        onClose();
      },
      keywords: ['sidebar', 'panel', 'files'],
    },
    {
      id: 'toggle-bottom',
      label: 'Toggle Bottom Panel',
      description: 'Show/hide the bottom panel',
      icon: <Command className="w-4 h-4" />,
      action: () => {
        ideStore.toggleBottom();
        onClose();
      },
      keywords: ['bottom', 'panel', 'terminal'],
    },
    {
      id: 'toggle-chat',
      label: 'Toggle Chat Panel',
      description: 'Show/hide the AI chat panel',
      icon: <Command className="w-4 h-4" />,
      action: () => {
        ideStore.toggleChat();
        onClose();
      },
      keywords: ['chat', 'ai', 'agent'],
    },
    {
      id: 'close-all-tabs',
      label: 'Close All Tabs',
      description: 'Close all open editor tabs',
      icon: <Command className="w-4 h-4" />,
      action: () => {
        ideStore.closeAllTabs();
        onClose();
      },
      keywords: ['close', 'tabs', 'editor'],
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      description: 'Open settings panel',
      icon: <Command className="w-4 h-4" />,
      action: () => {
        // Settings modal will be triggered from parent
        onClose();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-settings'));
        }, 100);
      },
      keywords: ['settings', 'preferences', 'config'],
    },
  ];

  // Extract all files from file tree recursively
  const getAllFiles = useCallback((): FileItem[] => {
    const files: FileItem[] = [];
    const workspacePath = ideStore.workspacePath || '';

    const traverse = (nodes: any[], parentPath: string = '') => {
      if (!nodes) return;
      for (const node of nodes) {
        const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        if (node.type === 'file') {
          files.push({
            path: node.path || `${workspacePath}/${fullPath}`,
            relativePath: fullPath,
            name: node.name,
          });
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children, fullPath);
        }
      }
    };

    if (fileTree && fileTree.length > 0) {
      traverse(fileTree);
    }

    return files;
  }, [fileTree, ideStore.workspacePath]);

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): number => {
    if (!query) return 1;
    text = text.toLowerCase();
    query = query.toLowerCase();

    let score = 0;
    let textIndex = 0;
    let queryIndex = 0;
    let consecutiveMatches = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        score += 1 + consecutiveMatches * 2; // Bonus for consecutive matches
        consecutiveMatches++;
        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    // Return 0 if not all query characters were found
    if (queryIndex < query.length) return 0;

    // Normalize score by length
    return score / text.length;
  };

  // Filter and sort items based on query
  const filteredItems = () => {
    const cleanQuery = query.replace(/^>/, '').trim();

    if (mode === 'file') {
      const files = getAllFiles();
      if (!cleanQuery) {
        // Show recent files (open tabs)
        return ideStore.tabs.slice(-10).reverse().map(tab => ({
          type: 'file' as const,
          path: tab.path,
          relativePath: tab.relativePath,
          name: tab.name,
          score: 1,
        }));
      }

      return files
        .map(file => ({
          type: 'file' as const,
          ...file,
          score: fuzzyMatch(file.relativePath, cleanQuery),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    } else {
      // Command mode
      if (!cleanQuery) {
        return commands.map(cmd => ({ type: 'command' as const, ...cmd, score: 1 }));
      }

      return commands
        .map(cmd => {
          const labelScore = fuzzyMatch(cmd.label, cleanQuery);
          const keywordScore = Math.max(
            0,
            ...(cmd.keywords || []).map(kw => fuzzyMatch(kw, cleanQuery))
          );
          return {
            type: 'command' as const,
            ...cmd,
            score: Math.max(labelScore, keywordScore * 0.8),
          };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
    }
  };

  const items = filteredItems();

  // Handle query changes and mode switching
  useEffect(() => {
    if (query.startsWith('>')) {
      setMode('command');
    } else {
      setMode('file');
    }
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          handleItemSelect(items[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, items, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setMode('file');
    }
  }, [isOpen]);

  const handleItemSelect = (item: any) => {
    if (item.type === 'file') {
      ideStore.openFile(item.path);
      onClose();
    } else if (item.type === 'command') {
      item.action();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg shadow-2xl w-[640px] max-w-[90vw] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-5 h-5 text-[var(--text-2)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'command'
                ? 'Type a command...'
                : "Search files or type '>' for commands..."
            }
            className="flex-1 bg-transparent text-[var(--text-0)] text-base outline-none placeholder:text-[var(--text-3)]"
            autoFocus
          />
          <div className="text-xs text-[var(--text-3)] font-mono">
            {mode === 'file' ? 'Files' : 'Commands'}
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-2)]">
              {query ? 'No results found' : mode === 'file' ? 'No recent files' : 'No commands available'}
            </div>
          ) : (
            <div className="py-2">
              {items.map((item, index) => (
                <div
                  key={item.type === 'file' ? item.path : item.id}
                  className={`
                    px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors
                    ${
                      index === selectedIndex
                        ? 'bg-[var(--accent)]/20'
                        : 'hover:bg-[var(--bg-3)]'
                    }
                  `}
                  onClick={() => handleItemSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {item.type === 'file' ? (
                    <>
                      <File className="w-4 h-4 text-[var(--text-2)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--text-0)] truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-[var(--text-2)] truncate">
                          {item.relativePath}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {item.icon || <Command className="w-4 h-4 text-[var(--text-2)] flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--text-0)]">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-[var(--text-2)]">{item.description}</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-3)]" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-4 text-xs text-[var(--text-3)]">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-[10px] font-mono">
              ↑↓
            </kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-[10px] font-mono">
              Enter
            </kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-[10px] font-mono">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add keyframes for animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scaleIn {
      from {
        transform: scale(0.98) translateY(-10px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
    .animate-scaleIn {
      animation: scaleIn 0.15s ease-out;
    }
  `;
  if (!document.head.querySelector('style[data-command-palette]')) {
    style.setAttribute('data-command-palette', 'true');
    document.head.appendChild(style);
  }
}
