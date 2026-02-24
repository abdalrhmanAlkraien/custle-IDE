'use client';

import React from 'react';
import { useIDEStore } from '@/store/ideStore';
import { useCompletionStore } from '@/store/completionStore';
import { GitBranch, AlertCircle, Info } from 'lucide-react';

export function StatusBar(): JSX.Element {
  const { tabs, activeTabId } = useIDEStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const completionStatus = useCompletionStore((state) => state.status);

  // AI indicator styling based on status
  const getAIIndicatorClass = () => {
    switch (completionStatus) {
      case 'fetching':
        return 'text-blue-400 animate-pulse';
      case 'accepted':
        return 'text-green-400';
      case 'dismissed':
        return 'text-gray-600';
      default: // idle
        return 'text-gray-500';
    }
  };

  const getAIIndicatorTitle = () => {
    switch (completionStatus) {
      case 'fetching':
        return 'AI: Fetching completion...';
      case 'accepted':
        return 'AI: Completion accepted';
      case 'dismissed':
        return 'AI: Completion dismissed';
      default:
        return 'AI: Ready';
    }
  };

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

      {/* Right: AI Indicator, Cursor Position and File Info */}
      <div className="flex items-center gap-3">
        {/* AI Autocomplete Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${getAIIndicatorClass()}`}
          title={getAIIndicatorTitle()}
        >
          <span className="font-semibold">AI</span>
          <span className="text-[10px]">✦</span>
        </div>

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
