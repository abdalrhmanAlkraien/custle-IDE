'use client';

import React from 'react';
import { useIDEStore } from '@/store/ideStore';
import {
  Files,
  Search,
  GitBranch,
  Settings
} from 'lucide-react';

export function ActivityBar(): JSX.Element {
  const { activeSidebarPanel, setSidebarPanel } = useIDEStore();

  const buttons = [
    { id: 'files' as const, icon: Files, label: 'Explorer' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'git' as const, icon: GitBranch, label: 'Source Control' },
    { id: 'extensions' as const, icon: Settings, label: 'Extensions' },
  ];

  return (
    <div className="w-[46px] bg-[var(--bg-2)] border-r border-[var(--border)] flex flex-col items-center py-2 gap-1 no-select">
      {buttons.map((button) => {
        const Icon = button.icon;
        const isActive = activeSidebarPanel === button.id;

        return (
          <button
            key={button.id}
            onClick={() => setSidebarPanel(button.id)}
            className={`
              w-[38px] h-[38px] flex items-center justify-center rounded
              transition-colors
              ${isActive
                ? 'bg-[var(--bg-4)] text-[var(--accent)]'
                : 'text-[var(--text-1)] hover:bg-[var(--bg-3)]'
              }
            `}
            title={button.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}
