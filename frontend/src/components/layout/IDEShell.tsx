'use client';

import React from 'react';
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
  } = useIDEStore();

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
    </div>
  );
}
