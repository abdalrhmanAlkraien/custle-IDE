'use client';

import React, { useState, useEffect } from 'react';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle
} from 'react-resizable-panels';
import { useIDEStore } from '@/store/ideStore';
import { TitleBar } from './TitleBar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { EditorArea } from '@/components/editor/EditorArea';
import { BottomPanel } from '@/components/terminal/BottomPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CommandPalette } from '@/components/modals/CommandPalette';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Toast } from '@/components/ui/Toast';
import { useKeyboard, type KeyboardShortcut } from '@/hooks/useKeyboard';
import { useToast } from '@/hooks/useToast';
import { filesApi } from '@/lib/api/filesApi';

export function IDEShell(): JSX.Element {
  const {
    isSidebarOpen,
    isChatOpen,
    isBottomOpen,
    sidebarWidth,
    chatWidth,
    bottomHeight,
    setSidebarWidth,
    setChatWidth,
    setBottomHeight,
    toggleSidebar,
    toggleBottom,
    toggleChat,
    tabs,
    activeTabId,
    closeTab,
    closeAllTabs,
    setActiveTab,
  } = useIDEStore();

  const toast = useToast();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save active file handler
  const saveActiveFile = async () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      toast.warning('No file open to save');
      return;
    }

    if (!activeTab.isDirty) {
      toast.info('No changes to save');
      return;
    }

    try {
      await filesApi.writeFile(activeTab.path, activeTab.content);
      useIDEStore.getState().markTabClean(activeTab.id);
      toast.success(`Saved ${activeTab.name}`);
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  // Save all files handler
  const saveAllFiles = async () => {
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    if (dirtyTabs.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      await Promise.all(
        dirtyTabs.map((tab) => filesApi.writeFile(tab.path, tab.content))
      );
      dirtyTabs.forEach((tab) => {
        useIDEStore.getState().markTabClean(tab.id);
      });
      toast.success(`Saved ${dirtyTabs.length} file(s)`);
    } catch (error: any) {
      toast.error(`Failed to save files: ${error.message}`);
    }
  };

  // Navigate to next/previous tab
  const nextTab = () => {
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  const prevTab = () => {
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex].id);
  };

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'p',
      ctrl: true,
      handler: () => setIsCommandPaletteOpen(true),
      description: 'Open command palette',
    },
    {
      key: 'P',
      ctrl: true,
      shift: true,
      handler: () => setIsCommandPaletteOpen(true),
      description: 'Open command palette',
    },
    {
      key: 'b',
      ctrl: true,
      handler: toggleSidebar,
      description: 'Toggle sidebar',
    },
    {
      key: 'j',
      ctrl: true,
      handler: toggleBottom,
      description: 'Toggle bottom panel',
    },
    {
      key: '\\',
      ctrl: true,
      handler: toggleChat,
      description: 'Toggle chat panel',
    },
    {
      key: '`',
      ctrl: true,
      handler: () => {
        if (!isBottomOpen) {
          toggleBottom();
        }
        // Focus terminal (handled by terminal component)
      },
      description: 'Focus terminal',
    },
    {
      key: 's',
      ctrl: true,
      handler: saveActiveFile,
      description: 'Save active file',
    },
    {
      key: 'S',
      ctrl: true,
      shift: true,
      handler: saveAllFiles,
      description: 'Save all files',
    },
    {
      key: 'w',
      ctrl: true,
      handler: () => {
        if (activeTabId) {
          closeTab(activeTabId);
        }
      },
      description: 'Close active tab',
    },
    {
      key: 'W',
      ctrl: true,
      shift: true,
      handler: () => {
        if (tabs.length > 0 && confirm('Close all tabs?')) {
          closeAllTabs();
        }
      },
      description: 'Close all tabs',
    },
    {
      key: 'Tab',
      ctrl: true,
      handler: nextTab,
      description: 'Next tab',
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      handler: prevTab,
      description: 'Previous tab',
    },
    {
      key: ',',
      ctrl: true,
      handler: () => setIsSettingsOpen(true),
      description: 'Open settings',
    },
    {
      key: 'Escape',
      handler: () => {
        setIsCommandPaletteOpen(false);
        setIsSettingsOpen(false);
      },
      description: 'Close modal/dialog',
    },
  ];

  // Register keyboard shortcuts
  useKeyboard(shortcuts);

  // Listen for open-settings custom event (from command palette)
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-0)]">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Resizable Panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Sidebar */}
            {isSidebarOpen && (
              <>
                <Panel
                  defaultSize={sidebarWidth}
                  minSize={200}
                  maxSize={500}
                  onResize={(size) => setSidebarWidth(size)}
                  className="bg-[var(--bg-1)]"
                >
                  <Sidebar />
                </Panel>
                <PanelResizeHandle className="w-[1px] bg-[var(--border)] hover:bg-[var(--accent)] transition-colors" />
              </>
            )}

            {/* Center: Editor + Bottom Panel */}
            <Panel>
              <PanelGroup direction="vertical">
                {/* Editor Area */}
                <Panel
                  defaultSize={isBottomOpen ? 100 - bottomHeight : 100}
                  className="bg-[var(--bg-0)]"
                >
                  <EditorArea />
                </Panel>

                {/* Bottom Panel */}
                {isBottomOpen && (
                  <>
                    <PanelResizeHandle className="h-[1px] bg-[var(--border)] hover:bg-[var(--accent)] transition-colors" />
                    <Panel
                      defaultSize={bottomHeight}
                      minSize={150}
                      maxSize={500}
                      onResize={(size) => setBottomHeight(size)}
                      className="bg-[var(--bg-1)]"
                    >
                      <div className="h-full border-t border-[var(--border)]">
                        <BottomPanel />
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* Chat Panel */}
            {isChatOpen && (
              <>
                <PanelResizeHandle className="w-[1px] bg-[var(--border)] hover:bg-[var(--accent)] transition-colors" />
                <Panel
                  defaultSize={chatWidth}
                  minSize={300}
                  maxSize={600}
                  onResize={(size) => setChatWidth(size)}
                  className="bg-[var(--bg-1)]"
                >
                  <div className="h-full border-l border-[var(--border)]">
                    <ChatPanel />
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
