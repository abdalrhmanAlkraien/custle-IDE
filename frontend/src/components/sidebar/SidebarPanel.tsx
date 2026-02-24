'use client';

import React from 'react';
import { useIDEStore } from '@/store/ideStore';
import { Files, Search, GitBranch, Settings } from 'lucide-react';

export function SidebarPanel(): JSX.Element {
  const { activeSidebarPanel } = useIDEStore();

  const getPanelContent = (): { icon: React.ElementType; title: string; description: string } => {
    switch (activeSidebarPanel) {
      case 'files':
        return {
          icon: Files,
          title: 'Explorer',
          description: 'File tree will be implemented in Task 2.2',
        };
      case 'search':
        return {
          icon: Search,
          title: 'Search',
          description: 'Search functionality placeholder',
        };
      case 'git':
        return {
          icon: GitBranch,
          title: 'Source Control',
          description: 'Git integration will be implemented in Task 5.2',
        };
      case 'extensions':
        return {
          icon: Settings,
          title: 'Extensions',
          description: 'Extensions panel placeholder',
        };
    }
  };

  const { icon: Icon, title, description } = getPanelContent();

  return (
    <div className="h-full flex flex-col bg-[var(--bg-1)]">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[var(--text-1)]" />
          <h2 className="text-xs font-semibold text-[var(--text-0)] uppercase tracking-wide">
            {title}
          </h2>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <Icon size={48} className="text-[var(--text-2)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-1)]">{description}</p>
        </div>
      </div>
    </div>
  );
}
