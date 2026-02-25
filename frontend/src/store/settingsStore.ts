import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface AISettings {
  defaultTemperature: number;
  maxTokens: number;
  autocompleteEnabled: boolean;
  debounceDelay: number;
}

export interface TerminalSettings {
  fontSize: number;
  shellPath: string;
}

export interface SettingsStore {
  // Editor settings
  editor: EditorSettings;
  setEditorSetting: <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => void;

  // Theme settings
  theme: 'neural-dark';
  setTheme: (theme: SettingsStore['theme']) => void;

  // AI settings
  ai: AISettings;
  setAISetting: <K extends keyof AISettings>(key: K, value: AISettings[K]) => void;

  // Terminal settings
  terminal: TerminalSettings;
  setTerminalSetting: <K extends keyof TerminalSettings>(
    key: K,
    value: TerminalSettings[K]
  ) => void;

  // Reset to defaults
  resetToDefaults: () => void;
}

const defaultSettings = {
  editor: {
    fontSize: 14,
    fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace",
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
  },
  theme: 'neural-dark' as const,
  ai: {
    defaultTemperature: 0.7,
    maxTokens: 2048,
    autocompleteEnabled: true,
    debounceDelay: 700,
  },
  terminal: {
    fontSize: 13,
    shellPath: '/bin/bash',
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setEditorSetting: (key, value) =>
        set((state) => ({
          editor: { ...state.editor, [key]: value },
        })),

      setTheme: (theme) => set({ theme }),

      setAISetting: (key, value) =>
        set((state) => ({
          ai: { ...state.ai, [key]: value },
        })),

      setTerminalSetting: (key, value) =>
        set((state) => ({
          terminal: { ...state.terminal, [key]: value },
        })),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'custle-ide-settings',
    }
  )
);
