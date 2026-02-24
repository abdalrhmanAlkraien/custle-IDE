/**
 * GitHistory Component
 * Commit history display
 */

import { GitCommit } from '@/lib/api/gitApi';
import { GitCommit as GitCommitIcon } from 'lucide-react';

interface GitHistoryProps {
  commits: GitCommit[];
}

export default function GitHistory({ commits }: GitHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-800">
        History
      </div>

      {commits.length === 0 ? (
        <div className="px-3 py-4 text-sm text-gray-500 text-center">No commits yet</div>
      ) : (
        <div className="divide-y divide-gray-800">
          {commits.map((commit) => (
            <div
              key={commit.hash}
              className="px-3 py-2 hover:bg-gray-800 cursor-pointer group"
              title={`${commit.hash}\n${commit.author}\n${new Date(commit.date).toLocaleString()}`}
            >
              <div className="flex items-start gap-2">
                <GitCommitIcon size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300 truncate">{commit.message}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-mono">
                      {commit.hash.substring(0, 7)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(commit.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
