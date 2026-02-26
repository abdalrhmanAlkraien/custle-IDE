'use client';

import React from 'react';
import { useModelStore } from '@/store/modelStore';
import { ModelConfigModal } from '../modals/ModelConfigModal';
import MenuBar from '../titlebar/MenuBar';

export function TitleBar(): JSX.Element {
  const { activeConfig, isConnected, isModalOpen, openModal, closeModal, setActiveConfig } = useModelStore();

  return (
    <>
      <div className="h-[38px] bg-[var(--bg-1)] border-b border-[var(--border)] flex items-center justify-between px-3 no-select">
        {/* Left: Logo and Menu */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)] text-lg">⬡</span>
            <span className="text-[var(--text-0)] font-medium text-sm">NeuralIDE</span>
          </div>

          <MenuBar />
        </div>

        {/* Center: Workspace Name (optional) */}
        <div className="text-xs text-[var(--text-2)]">
          {/* Will show workspace name here later */}
        </div>

        {/* Right: Model Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-3)] border border-[var(--border)] hover:bg-[var(--bg-2)] transition-colors cursor-pointer"
            title={`${activeConfig.name} - ${isConnected ? 'Connected' : 'Disconnected'} (click to configure)`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[var(--green)]' : 'bg-[var(--text-2)]'
              }`}
            />
            <span className="text-xs text-[var(--text-1)] font-mono">
              {activeConfig.name}
            </span>
          </button>
        </div>
      </div>

      {/* Model Configuration Modal */}
      <ModelConfigModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfigSaved={(config) => {
          setActiveConfig(config);
          closeModal();
        }}
      />
    </>
  );
}
