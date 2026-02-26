/**
 * Git Store
 * Zustand store for git state management
 */

import { create } from 'zustand';
import * as gitApi from '@/lib/api/gitApi';

interface GitStore {
  // State
  status: gitApi.GitStatus | null;
  history: gitApi.GitCommit[];
  branches: gitApi.GitBranches | null;
  isLoading: boolean;
  selectedFile: string | null;
  error: string | null;
  refreshInterval: NodeJS.Timeout | null;

  // Actions
  refresh: () => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (name: string) => Promise<void>;
  selectFile: (path: string | null) => void;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  setError: (error: string | null) => void;
}

export const useGitStore = create<GitStore>((set, get) => ({
  // Initial state
  status: null,
  history: [],
  branches: null,
  isLoading: false,
  selectedFile: null,
  error: null,
  refreshInterval: null,

  // Refresh all git data
  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await gitApi.getGitStatus();

      // If not a git repo, clear everything
      if (!status.isRepo) {
        set({
          status: null,
          history: [],
          branches: null,
          isLoading: false,
        });
        return;
      }

      // Otherwise load full git data
      const [log, branches] = await Promise.all([
        gitApi.getGitLog(50),
        gitApi.getGitBranches(),
      ]);

      set({
        status,
        history: log.commits,
        branches,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Git refresh error:', error);
      set({
        error: error.message || 'Failed to refresh git status',
        isLoading: false,
      });
    }
  },

  // Stage a single file
  stageFile: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.stageFiles([path]);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to stage file', isLoading: false });
      }
    } catch (error: any) {
      console.error('Stage file error:', error);
      set({ error: error.message || 'Failed to stage file', isLoading: false });
    }
  },

  // Unstage a single file
  unstageFile: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.unstageFiles([path]);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to unstage file', isLoading: false });
      }
    } catch (error: any) {
      console.error('Unstage file error:', error);
      set({ error: error.message || 'Failed to unstage file', isLoading: false });
    }
  },

  // Stage all files
  stageAll: async () => {
    const { status } = get();
    if (!status) return;

    const fileList = status.changes || status.files || [];
    const unstagedFiles = fileList.filter((f) => !f.staged).map((f) => f.path);
    if (unstagedFiles.length === 0) return;

    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.stageFiles(unstagedFiles);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to stage files', isLoading: false });
      }
    } catch (error: any) {
      console.error('Stage all error:', error);
      set({ error: error.message || 'Failed to stage files', isLoading: false });
    }
  },

  // Unstage all files
  unstageAll: async () => {
    const { status } = get();
    if (!status) return;

    const fileList = status.changes || status.files || [];
    const stagedFiles = fileList.filter((f) => f.staged).map((f) => f.path);
    if (stagedFiles.length === 0) return;

    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.unstageFiles(stagedFiles);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to unstage files', isLoading: false });
      }
    } catch (error: any) {
      console.error('Unstage all error:', error);
      set({ error: error.message || 'Failed to unstage files', isLoading: false });
    }
  },

  // Commit staged changes
  commit: async (message: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.commit(message);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to commit', isLoading: false });
      }
    } catch (error: any) {
      console.error('Commit error:', error);
      set({ error: error.message || 'Failed to commit', isLoading: false });
    }
  },

  // Push to remote
  push: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.push();
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to push', isLoading: false });
      }
    } catch (error: any) {
      console.error('Push error:', error);
      set({ error: error.message || 'Failed to push', isLoading: false });
    }
  },

  // Pull from remote
  pull: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.pull();
      if (result.success) {
        await get().refresh();
      } else if (result.conflicts && result.conflicts.length > 0) {
        set({
          error: `Merge conflicts in: ${result.conflicts.join(', ')}`,
          isLoading: false,
        });
      } else {
        set({ error: result.error || 'Failed to pull', isLoading: false });
      }
    } catch (error: any) {
      console.error('Pull error:', error);
      set({ error: error.message || 'Failed to pull', isLoading: false });
    }
  },

  // Checkout branch
  checkout: async (branch: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.checkout(branch);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to checkout branch', isLoading: false });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      set({ error: error.message || 'Failed to checkout branch', isLoading: false });
    }
  },

  // Create and checkout new branch
  createBranch: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await gitApi.createBranch(name);
      if (result.success) {
        await get().refresh();
      } else {
        set({ error: result.error || 'Failed to create branch', isLoading: false });
      }
    } catch (error: any) {
      console.error('Create branch error:', error);
      set({ error: error.message || 'Failed to create branch', isLoading: false });
    }
  },

  // Select a file for diff view
  selectFile: (path: string | null) => {
    set({ selectedFile: path });
  },

  // Start auto-refresh (every 30 seconds)
  startAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval) return; // Already running

    const interval = setInterval(() => {
      get().refresh();
    }, 30000); // 30 seconds

    set({ refreshInterval: interval });

    // Initial refresh
    get().refresh();
  },

  // Stop auto-refresh
  stopAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      set({ refreshInterval: null });
    }
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },
}));
