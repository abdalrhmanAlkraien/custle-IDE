'use client';

import { useState, useEffect } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import GitHubConnect from './GitHubConnect';
import RepoList from './RepoList';

type Tab = 'source-control' | 'github';

export default function GitPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('source-control');
  const { checkStatus } = useGitHubStore();

  // Check GitHub status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('source-control')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'source-control'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Source Control
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'github'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          GitHub
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'source-control' ? (
          <div className="h-full p-4">
            <p className="text-sm text-gray-400">
              Source Control panel (from Task 5.2)
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <GitHubConnect />
            <RepoList />
          </div>
        )}
      </div>
    </div>
  );
}
