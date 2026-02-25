'use client';

import { useState } from 'react';
import { useGitHubStore } from '@/store/githubStore';
import { Search, RefreshCw, GitBranch, Star, GitFork, Lock } from 'lucide-react';

export default function RepoList() {
  const { connected, repos, loading, refreshRepos } = useGitHubStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'private' | 'public'>('all');

  const filteredRepos = repos
    .filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filter === 'all' ||
                           (filter === 'private' && repo.private) ||
                           (filter === 'public' && !repo.private);
      return matchesSearch && matchesFilter;
    });

  if (!connected) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Connect to GitHub to view repositories
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter */}
      <div className="p-3 border-b border-gray-700 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={refreshRepos}
            disabled={loading}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50"
            title="Refresh repositories"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2">
          {(['all', 'public', 'private'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({
                f === 'all' ? repos.length :
                f === 'private' ? repos.filter(r => r.private).length :
                repos.filter(r => !r.private).length
              })
            </button>
          ))}
        </div>
      </div>

      {/* Repository List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRepos.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchTerm ? 'No repositories match your search' : 'No repositories found'}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredRepos.map((repo) => (
              <div key={repo.id} className="p-3 hover:bg-gray-800/50 cursor-pointer group">
                <div className="flex items-start gap-2">
                  <GitBranch className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-400 group-hover:underline truncate">
                        {repo.name}
                      </span>
                      {repo.private && <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </span>
                      {repo.fork && (
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          Fork
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
