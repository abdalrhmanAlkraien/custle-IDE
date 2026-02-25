'use client';

import { useState } from 'react';
import { useGitHubStore } from '@/store/githubStore';

export default function GitHubConnect() {
  const { connected, username, avatar_url, name, loading, error, connect, disconnect } = useGitHubStore();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    try {
      await connect(token);
      setToken(''); // Clear token after successful connection
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect from GitHub?')) {
      await disconnect();
    }
  };

  if (connected) {
    return (
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          {avatar_url && (
            <img src={avatar_url} alt={username || ''} className="w-10 h-10 rounded-full" />
          )}
          <div className="flex-1">
            <div className="font-medium text-white">{name || username}</div>
            <div className="text-sm text-gray-400">@{username}</div>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-medium text-white mb-3">Connect to GitHub</h3>
      <form onSubmit={handleConnect} className="space-y-3">
        <div>
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="GitHub Personal Access Token"
            className="w-full px-3 py-2 text-sm bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <label className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showToken}
              onChange={(e) => setShowToken(e.target.checked)}
              className="rounded"
            />
            Show token
          </label>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>

        <a
          href="https://github.com/settings/tokens/new?scopes=repo"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-blue-400 hover:underline text-center"
        >
          Generate new token
        </a>
      </form>
    </div>
  );
}
