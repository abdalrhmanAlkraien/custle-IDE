import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SafeModelConfig } from '@/lib/api/modelApi';

// Model Store interface
export interface ModelStore {
  activeConfig: SafeModelConfig;
  isConnected: boolean;
  isChecking: boolean;
  isModalOpen: boolean;

  setActiveConfig: (config: SafeModelConfig) => void;
  setConnected: (value: boolean) => void;
  setChecking: (value: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
}

// Default model configuration
const defaultConfig: SafeModelConfig = {
  id: 'default',
  name: 'No Model',
  provider: 'openai-compatible',
  baseUrl: '',
  model: '',
  maxTokens: 4096,
  temperature: 0.7,
};

// Create the store with persistence
export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      activeConfig: defaultConfig,
      isConnected: false,
      isChecking: false,
      isModalOpen: false,

      setActiveConfig: (config: SafeModelConfig) =>
        set({ activeConfig: config }),

      setConnected: (value: boolean) =>
        set({ isConnected: value }),

      setChecking: (value: boolean) =>
        set({ isChecking: value }),

      openModal: () =>
        set({ isModalOpen: true }),

      closeModal: () =>
        set({ isModalOpen: false }),
    }),
    {
      name: 'custle-ide-model-store',
      // Only persist activeConfig, not connection or modal status
      partialize: (state) => ({
        activeConfig: state.activeConfig,
      }),
    }
  )
);
