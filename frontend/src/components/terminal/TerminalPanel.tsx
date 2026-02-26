'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useIDEStore } from '@/store/ideStore';
import { Terminal, AlertCircle, FileText } from 'lucide-react';

// Dynamic import — xterm CANNOT be imported at module level
const XTermWrapper = dynamic(() => import('./XTermWrapper'), { ssr: false });

interface TerminalPanelProps {
  sessionId?: string; // allows multiple terminal tabs
}

export function TerminalPanel({ sessionId: propSessionId }: TerminalPanelProps = {}): JSX.Element {
  const sessionId = propSessionId || 'default';
  const { activeBottomTab, setBottomTab, workspace } = useIDEStore();

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'output' as const, label: 'Output', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeBottomTab) {
      case 'terminal':
        return (
          <div className="h-full flex flex-col bg-[#1e1e1e]">
            <XTermWrapper sessionId={sessionId} cwd={workspace?.path} />
          </div>
        );
      case 'problems':
        return (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle size={48} className="text-[var(--text-2)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-1)]">Problems panel placeholder</p>
            </div>
          </div>
        );
      case 'output':
        return (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="text-[var(--text-2)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-1)]">Output panel placeholder</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-1)]">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 border-b border-[var(--border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={`
                px-3 py-2 text-xs flex items-center gap-2 border-b-2 transition-colors
                ${
                  activeBottomTab === tab.id
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
      {renderContent()}
    </div>
  );
}
