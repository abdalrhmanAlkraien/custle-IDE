'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Code, Palette, Cpu, Terminal, Keyboard } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { IDE_SHORTCUTS } from '@/hooks/useKeyboard';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'editor' | 'theme' | 'ai' | 'terminal' | 'keybindings';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const settings = useSettingsStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: 'Editor', icon: <Code className="w-4 h-4" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="w-4 h-4" /> },
    { id: 'ai', label: 'AI', icon: <Cpu className="w-4 h-4" /> },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
    { id: 'keybindings', label: 'Keybindings', icon: <Keyboard className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg shadow-2xl w-[800px] max-w-[90vw] h-[600px] max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-0)]">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-2)] hover:text-[var(--text-0)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-[var(--border)] py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-r-2 border-[var(--accent)]'
                      : 'text-[var(--text-1)] hover:bg-[var(--bg-3)] hover:text-[var(--text-0)]'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'editor' && <EditorSettings />}
            {activeTab === 'theme' && <ThemeSettings />}
            {activeTab === 'ai' && <AISettings />}
            {activeTab === 'terminal' && <TerminalSettings />}
            {activeTab === 'keybindings' && <KeybindingsSettings />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={() => {
              if (confirm('Reset all settings to defaults?')) {
                settings.resetToDefaults();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-[var(--red)] hover:bg-[var(--red)]/10 rounded transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-bright)] rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Editor Settings Tab
function EditorSettings() {
  const { editor, setEditorSetting } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-[var(--text-0)] mb-4">Editor Settings</h3>

      <SettingRow label="Font Size" description="Editor font size in pixels">
        <input
          type="number"
          min="10"
          max="24"
          value={editor.fontSize}
          onChange={(e) => setEditorSetting('fontSize', parseInt(e.target.value))}
          className="w-20 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Font Family" description="Editor font family">
        <input
          type="text"
          value={editor.fontFamily}
          onChange={(e) => setEditorSetting('fontFamily', e.target.value)}
          className="flex-1 max-w-md px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Tab Size" description="Number of spaces for indentation">
        <select
          value={editor.tabSize}
          onChange={(e) => setEditorSetting('tabSize', parseInt(e.target.value))}
          className="w-32 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        >
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="8">8 spaces</option>
        </select>
      </SettingRow>

      <SettingRow label="Word Wrap" description="Wrap long lines">
        <input
          type="checkbox"
          checked={editor.wordWrap}
          onChange={(e) => setEditorSetting('wordWrap', e.target.checked)}
          className="w-4 h-4 accent-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Minimap" description="Show code minimap">
        <input
          type="checkbox"
          checked={editor.minimap}
          onChange={(e) => setEditorSetting('minimap', e.target.checked)}
          className="w-4 h-4 accent-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Line Numbers" description="Show line numbers">
        <input
          type="checkbox"
          checked={editor.lineNumbers}
          onChange={(e) => setEditorSetting('lineNumbers', e.target.checked)}
          className="w-4 h-4 accent-[var(--accent)]"
        />
      </SettingRow>
    </div>
  );
}

// Theme Settings Tab
function ThemeSettings() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-[var(--text-0)] mb-4">Theme Settings</h3>

      <SettingRow label="Color Theme" description="Choose your preferred color theme">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="w-48 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        >
          <option value="neural-dark">Neural Dark (Default)</option>
        </select>
      </SettingRow>

      <div className="mt-6 p-4 bg-[var(--bg-3)] border border-[var(--border)] rounded-lg">
        <p className="text-sm text-[var(--text-1)]">
          More themes coming soon! The Neural Dark theme is optimized for extended coding sessions with
          reduced eye strain.
        </p>
      </div>
    </div>
  );
}

// AI Settings Tab
function AISettings() {
  const { ai, setAISetting } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-[var(--text-0)] mb-4">AI Settings</h3>

      <SettingRow
        label="Default Temperature"
        description="Controls randomness in AI responses (0.0 = focused, 1.0 = creative)"
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={ai.defaultTemperature}
            onChange={(e) => setAISetting('defaultTemperature', parseFloat(e.target.value))}
            className="flex-1 max-w-xs accent-[var(--accent)]"
          />
          <span className="w-12 text-sm text-[var(--text-0)]">
            {ai.defaultTemperature.toFixed(1)}
          </span>
        </div>
      </SettingRow>

      <SettingRow label="Max Tokens" description="Maximum tokens for AI responses">
        <input
          type="number"
          min="256"
          max="8192"
          step="256"
          value={ai.maxTokens}
          onChange={(e) => setAISetting('maxTokens', parseInt(e.target.value))}
          className="w-32 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Autocomplete Enabled" description="Enable AI inline autocomplete">
        <input
          type="checkbox"
          checked={ai.autocompleteEnabled}
          onChange={(e) => setAISetting('autocompleteEnabled', e.target.checked)}
          className="w-4 h-4 accent-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow
        label="Debounce Delay (ms)"
        description="Delay before triggering autocomplete"
      >
        <input
          type="number"
          min="300"
          max="2000"
          step="100"
          value={ai.debounceDelay}
          onChange={(e) => setAISetting('debounceDelay', parseInt(e.target.value))}
          className="w-32 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        />
      </SettingRow>
    </div>
  );
}

// Terminal Settings Tab
function TerminalSettings() {
  const { terminal, setTerminalSetting } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-[var(--text-0)] mb-4">Terminal Settings</h3>

      <SettingRow label="Font Size" description="Terminal font size in pixels">
        <input
          type="number"
          min="10"
          max="20"
          value={terminal.fontSize}
          onChange={(e) => setTerminalSetting('fontSize', parseInt(e.target.value))}
          className="w-20 px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
        />
      </SettingRow>

      <SettingRow label="Shell Path" description="Default shell executable">
        <input
          type="text"
          value={terminal.shellPath}
          onChange={(e) => setTerminalSetting('shellPath', e.target.value)}
          className="flex-1 max-w-md px-3 py-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded text-sm text-[var(--text-0)] outline-none focus:border-[var(--accent)]"
          placeholder="/bin/bash"
        />
      </SettingRow>
    </div>
  );
}

// Keybindings Settings Tab
function KeybindingsSettings() {
  const shortcuts = Object.values(IDE_SHORTCUTS);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-[var(--text-0)] mb-4">Keyboard Shortcuts</h3>

      <p className="text-sm text-[var(--text-2)] mb-4">
        Keyboard shortcuts are currently read-only. Custom keybinding support coming soon!
      </p>

      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => {
          const s = shortcut as any;
          return (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-[var(--bg-3)] border border-[var(--border)] rounded"
            >
              <span className="text-sm text-[var(--text-0)]">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {s.ctrl && (
                  <kbd className="px-2 py-1 bg-[var(--bg-4)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-1)]">
                    Ctrl
                  </kbd>
                )}
                {s.shift && (
                  <kbd className="px-2 py-1 bg-[var(--bg-4)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-1)]">
                    Shift
                  </kbd>
                )}
                {s.alt && (
                  <kbd className="px-2 py-1 bg-[var(--bg-4)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-1)]">
                    Alt
                  </kbd>
                )}
                <kbd className="px-2 py-1 bg-[var(--bg-4)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-1)]">
                  {shortcut.key}
                </kbd>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper component for setting rows
interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text-0)]">{label}</div>
        <div className="text-xs text-[var(--text-2)] mt-0.5">{description}</div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// Add keyframes for animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    .animate-scaleIn {
      animation: scaleIn 0.2s ease-out;
    }
  `;
  if (!document.head.querySelector('style[data-settings-modal]')) {
    style.setAttribute('data-settings-modal', 'true');
    document.head.appendChild(style);
  }
}
