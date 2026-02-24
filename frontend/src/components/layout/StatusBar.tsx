'use client';

import React from 'react';
import { useIDEStore } from '@/store/ideStore';
import { GitBranch, AlertCircle, Info } from 'lucide-react';

export function StatusBar(): JSX.Element {
  const { tabs, activeTabId } = useIDEStore();
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="h-[22px] bg-[var(--bg-2)] border-t border-[var(--border)] flex items-center justify-between px-2 text-xs text-[var(--text-1)] no-select">
      {/* Left: Git Branch and Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:bg-[var(--bg-3)] px-2 py-0.5 rounded cursor-pointer">
          <GitBranch size={12} />
          <span>main</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={12} />
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Right: Cursor Position and File Info */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span>Ln {activeTab.cursorLine}, Col {activeTab.cursorCol}</span>
            <span>{activeTab.language}</span>
            <span>UTF-8</span>
            <span>LF</span>
          </>
        )}
      </div>
    </div>
  );
}
