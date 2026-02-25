import { create } from 'zustand';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
  fork: boolean;
}

interface GitHubState {
  connected: boolean;
  username: string | null;
  avatar_url: string | null;
  name: string | null;
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;

  // Actions
  checkStatus: () => Promise<void>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshRepos: () => Promise<void>;
}

export const useGitHubStore = create<GitHubState>((set) => ({
  connected: false,
  username: null,
  avatar_url: null,
  name: null,
  repos: [],
  loading: false,
  error: null,

  checkStatus: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/github/status');
      const data = await response.json();

      if (data.connected) {
        set({
          connected: true,
          username: data.username,
          avatar_url: data.avatar_url,
          name: data.name,
          error: null
        });

        // Fetch repos if connected
        const reposResponse = await fetch('http://localhost:3001/api/github/repos');
        const reposData = await reposResponse.json();
        set({ repos: reposData.repos || [] });
      } else {
        set({ connected: false, username: null, avatar_url: null, name: null, repos: [] });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to check GitHub status' });
    }
  },

  connect: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to GitHub');
      }

      const data = await response.json();
      set({
        connected: true,
        username: data.username,
        avatar_url: data.avatar_url,
        name: data.name,
        loading: false,
        error: null
      });

      // Fetch repos after connection
      const reposResponse = await fetch('http://localhost:3001/api/github/repos');
      const reposData = await reposResponse.json();
      set({ repos: reposData.repos || [] });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to connect to GitHub' });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await fetch('http://localhost:3001/api/github/disconnect', {
        method: 'DELETE'
      });

      set({
        connected: false,
        username: null,
        avatar_url: null,
        name: null,
        repos: [],
        error: null
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to disconnect from GitHub' });
    }
  },

  refreshRepos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://localhost:3001/api/github/repos/refresh', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh repositories');
      }

      // Fetch updated repos
      const reposResponse = await fetch('http://localhost:3001/api/github/repos');
      const reposData = await reposResponse.json();
      set({ repos: reposData.repos || [], loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to refresh repositories' });
    }
  }
}));
