'use client';

import React, { useState, lazy, Suspense } from 'react';
import { useIDEStore } from '@/store/ideStore';
import { Terminal, AlertCircle, FileText, Plus, X, Maximize2 } from 'lucide-react';

// Dynamic import for XTerminal (ssr: false)
const XTerminal = lazy(() => import('./XTerminal').then(mod => ({ default: mod.XTerminal })));

interface TerminalTab {
  id: string;
  name: string;
  sessionId: string;
}

export function BottomPanel(): JSX.Element {
  const { activeBottomTab, setBottomTab } = useIDEStore();
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    { id: 'term-1', name: 'Terminal 1', sessionId: 'term-1' },
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('term-1');
  const [isMaximized, setIsMaximized] = useState(false);

  const mainTabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: Terminal },
    { id: 'problems' as const, label: 'Problems', icon: AlertCircle },
    { id: 'output' as const, label: 'Output', icon: FileText },
  ];

  // Create new terminal
  const handleNewTerminal = () => {
    const newId = `term-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      name: `Terminal ${terminalTabs.length + 1}`,
      sessionId: newId,
    };
    setTerminalTabs([...terminalTabs, newTab]);
    setActiveTerminalId(newId);
  };

  // Close terminal
  const handleCloseTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (terminalTabs.length === 1) {
      // Don't close the last terminal
      return;
    }

    const newTabs = terminalTabs.filter(tab => tab.id !== id);
    setTerminalTabs(newTabs);

    // If closing active terminal, switch to first one
    if (activeTerminalId === id && newTabs.length > 0) {
      setActiveTerminalId(newTabs[0].id);
    }
  };

  const renderTerminalContent = () => {
    const activeTab = terminalTabs.find(tab => tab.id === activeTerminalId);
    if (!activeTab) return null;

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Terminal size={48} className="text-gray-400 animate-pulse" />
        </div>
      }>
        <XTerminal
          key={activeTab.sessionId}
          sessionId={activeTab.sessionId}
          onExit={(exitCode) => {
            console.log('Terminal exited with code:', exitCode);
          }}
        />
      </Suspense>
    );
  };

  const renderContent = () => {
    switch (activeBottomTab) {
      case 'terminal':
        return (
          <div className="flex-1 flex flex-col h-full">
            {/* Terminal Tabs */}
            <div className="flex items-center gap-1 px-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {terminalTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTerminalId(tab.id)}
                  className={`
                    px-3 py-1.5 text-xs flex items-center gap-2 border-b-2 transition-colors group
                    ${activeTerminalId === tab.id
                      ? 'border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <Terminal size={12} />
                  <span>{tab.name}</span>
                  {terminalTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTerminal(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
                    >
                      <X size={10} />
                    </button>
                  )}
                </button>
              ))}

              {/* New Terminal Button */}
              <button
                onClick={handleNewTerminal}
                className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="New Terminal"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-hidden">
              {renderTerminalContent()}
            </div>
          </div>
        );

      case 'problems':
        return (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No problems detected</p>
            </div>
          </div>
        );

      case 'output':
        return (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Output panel</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Main Tab Bar */}
      <div className="flex items-center justify-between px-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {mainTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setBottomTab(tab.id)}
                className={`
                  px-3 py-2 text-xs flex items-center gap-2 border-b-2 transition-colors
                  ${activeBottomTab === tab.id
                    ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Maximize Button */}
        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Panel Content */}
      {renderContent()}
    </div>
  );
}
