/**
 * Editor Tabs Component
 *
 * Tab bar with:
 * - Language-colored dots
 * - Dirty indicators (●)
 * - Drag-to-reorder
 * - Context menu (Close, Close Others, Close All, Copy Path)
 * - Middle-click to close
 * - Active tab highlighting
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { getLanguageColor } from '@/lib/languageMap';

export function EditorTabs() {
  const tabs = useIDEStore((state) => state.tabs);
  const activeTabId = useIDEStore((state) => state.activeTabId);
  const setActiveTab = useIDEStore((state) => state.setActiveTab);
  const closeTab = useIDEStore((state) => state.closeTab);
  const closeAllTabs = useIDEStore((state) => state.closeAllTabs);
  const closeOtherTabs = useIDEStore((state) => state.closeOtherTabs);
  const reorderTabs = useIDEStore((state) => state.reorderTabs);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [contextMenu]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder tabs
    reorderTabs(draggedIndex, index);
    setDraggedIndex(index);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Handle close button click
  const handleCloseClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();

    const tab = tabs.find((t) => t.id === tabId);
    if (tab && tab.isDirty) {
      const confirmed = window.confirm(
        `"${tab.name}" has unsaved changes. Close anyway?`
      );
      if (!confirmed) return;
    }

    closeTab(tabId);
  };

  // Handle middle-click (close tab)
  const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      // Middle mouse button
      e.preventDefault();
      const tab = tabs.find((t) => t.id === tabId);
      if (tab && tab.isDirty) {
        const confirmed = window.confirm(
          `"${tab.name}" has unsaved changes. Close anyway?`
        );
        if (!confirmed) return;
      }
      closeTab(tabId);
    }
  };

  // Handle right-click (context menu)
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  // Context menu actions
  const handleClose = () => {
    if (contextMenu) {
      closeTab(contextMenu.tabId);
      setContextMenu(null);
    }
  };

  const handleCloseOthers = () => {
    if (contextMenu) {
      closeOtherTabs(contextMenu.tabId);
      setContextMenu(null);
    }
  };

  const handleCloseAll = () => {
    const confirmed = tabs.some((t) => t.isDirty)
      ? window.confirm('Some files have unsaved changes. Close all anyway?')
      : true;

    if (confirmed) {
      closeAllTabs();
      setContextMenu(null);
    }
  };

  const handleCopyPath = () => {
    if (contextMenu) {
      const tab = tabs.find((t) => t.id === contextMenu.tabId);
      if (tab) {
        navigator.clipboard.writeText(tab.path);
        setContextMenu(null);
      }
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center overflow-x-auto bg-[#0d0d14] border-b border-[#2a2a3d] scrollbar-thin scrollbar-thumb-[#2a2a3d] scrollbar-track-transparent">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const languageColor = getLanguageColor(tab.language);

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTabClick(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              className={`
                group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                border-r border-[#2a2a3d] min-w-[120px] max-w-[200px]
                ${
                  isActive
                    ? 'bg-[#16161f] border-t-2 border-t-[#7b68ee]'
                    : 'bg-[#0d0d14] border-t-2 border-t-transparent hover:bg-[#16161f]'
                }
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              {/* Language indicator dot */}
              <div className={`w-2 h-2 rounded-full ${languageColor} flex-shrink-0`} />

              {/* Filename */}
              <span
                className={`text-xs truncate flex-1 ${
                  isActive ? 'text-[#eeeef5]' : 'text-[#9999bb]'
                }`}
              >
                {tab.name}
              </span>

              {/* Dirty indicator (unsaved changes) */}
              {tab.isDirty && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffb86c] flex-shrink-0" />
              )}

              {/* Close button */}
              <button
                onClick={(e) => handleCloseClick(e, tab.id)}
                className={`
                  flex-shrink-0 p-0.5 rounded hover:bg-[#2a2a3d] transition-colors
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
              >
                <X className="w-3 h-3 text-[#9999bb] hover:text-[#eeeef5]" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-48 py-1 bg-[#16161f] border border-[#2a2a3d] rounded shadow-lg"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <ContextMenuItem onClick={handleClose}>Close</ContextMenuItem>
          <ContextMenuItem onClick={handleCloseOthers}>
            Close Others
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCloseAll}>Close All</ContextMenuItem>
          <div className="h-px bg-[#2a2a3d] my-1" />
          <ContextMenuItem onClick={handleCopyPath}>Copy Path</ContextMenuItem>
        </div>
      )}
    </>
  );
}

interface ContextMenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
}

function ContextMenuItem({ onClick, children }: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1.5 text-left text-xs text-[#eeeef5] hover:bg-[#2a2a3d] transition-colors"
    >
      {children}
    </button>
  );
}
