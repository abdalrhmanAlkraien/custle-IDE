'use client';

import React from 'react';
import { useIDEStore } from '@/store/ideStore';
import { Terminal, AlertCircle, FileText } from 'lucide-react';

export function TerminalPanel(): JSX.Element {
  const { activeBottomTab, setBottomTab } = useIDEStore();

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'output' as const, label: 'Output', icon: FileText },
  ];

  const getContent = (): string => {
    switch (activeBottomTab) {
      case 'terminal':
        return 'Real terminal (xterm.js + node-pty) will be implemented in Task 4.1';
      case 'problems':
        return 'Problems panel placeholder';
      case 'output':
        return 'Output panel placeholder';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-1)]">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 border-b border-[var(--border)]">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={`
                px-3 py-2 text-xs flex items-center gap-2 border-b-2 transition-colors
                ${activeBottomTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--text-0)]'
                  : 'border-transparent text-[var(--text-1)] hover:text-[var(--text-0)]'
                }
              `}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <Terminal size={48} className="text-[var(--text-2)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-1)]">{getContent()}</p>
        </div>
      </div>
    </div>
  );
}
