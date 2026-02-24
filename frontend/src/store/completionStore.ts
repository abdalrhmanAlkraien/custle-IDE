/**
 * Completion Store
 * Tracks AI autocomplete status for status bar indicator
 */

import { create } from 'zustand';

export type CompletionStatus = 'idle' | 'fetching' | 'accepted' | 'dismissed';

interface CompletionStore {
  status: CompletionStatus;
  lastCompletion: string | null;

  // Actions
  setStatus: (status: CompletionStatus) => void;
  setFetching: () => void;
  setAccepted: (completion: string) => void;
  setDismissed: () => void;
  setIdle: () => void;
}

export const useCompletionStore = create<CompletionStore>((set) => ({
  status: 'idle',
  lastCompletion: null,

  setStatus: (status) => set({ status }),

  setFetching: () => set({ status: 'fetching' }),

  setAccepted: (completion) => {
    set({ status: 'accepted', lastCompletion: completion });
    // Auto-return to idle after 2 seconds
    setTimeout(() => {
      set((state) => (state.status === 'accepted' ? { status: 'idle' } : state));
    }, 2000);
  },

  setDismissed: () => {
    set({ status: 'dismissed' });
    // Auto-return to idle after 1 second
    setTimeout(() => {
      set((state) => (state.status === 'dismissed' ? { status: 'idle' } : state));
    }, 1000);
  },

  setIdle: () => set({ status: 'idle' }),
}));
