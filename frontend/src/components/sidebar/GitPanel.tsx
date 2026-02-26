/**
 * GitPanel Component
 * Full source control panel with staged/unstaged changes, commit, push/pull, branch switcher, and history
 */

'use client';

import { useEffect, useState } from 'react';
import { useGitStore } from '@/store/gitStore';
import { useIDEStore } from '@/store/ideStore';
import GitFileItem from './GitFileItem';
import BranchSwitcher from './BranchSwitcher';
import GitHistory from './GitHistory';
import { ArrowUp, ArrowDown, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react';
import { getGitDiff } from '@/lib/api/gitApi';

export default function GitPanel() {
  const {
    status,
    history,
    branches,
    isLoading,
    error,
    refresh,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    commit,
    push,
    pull,
    checkout,
    createBranch,
    startAutoRefresh,
    stopAutoRefresh,
    setError,
  } = useGitStore();

  const openFile = useIDEStore((state) => state.openFile);
  const [commitMessage, setCommitMessage] = useState('');

  // Start auto-refresh on mount
  useEffect(() => {
    startAutoRefresh();
    return () => {
      stopAutoRefresh();
    };
  }, [startAutoRefresh, stopAutoRefresh]);

  const handleFileClick = async (path: string) => {
    try {
      // Get the diff for this file
      await getGitDiff(path);

      // Open the file in the editor
      // TODO: In a real implementation, we would open a diff editor using Monaco's createDiffEditor
      // For now, just open the file normally
      openFile(path);
    } catch (error: any) {
      console.error('Failed to get diff:', error);
      setError(error.message || 'Failed to get diff');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    await commit(commitMessage);
    if (!error) {
      setCommitMessage('');
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) return;

    await commit(commitMessage);
    if (!error) {
      setCommitMessage('');
      await push();
    }
  };

  const fileList = status?.changes || status?.files || [];
  const stagedFiles = fileList.filter((f) => f.staged);
  const unstagedFiles = fileList.filter((f) => !f.staged);
  const canCommit = stagedFiles.length > 0 && commitMessage.trim().length > 0;

  // Check if workspace is a git repository
  const isRepo = status?.isRepo ?? true; // Default to true for backwards compatibility

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-300">
      {/* Not a git repo message */}
      {!isRepo ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-400 mb-1">Not a Git Repository</h3>
            <p className="text-xs text-gray-500">
              Initialize git in this workspace to enable source control
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Header with push/pull/refresh */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-400 uppercase">Source Control</h2>
                {/* Repository info */}
                {status?.remoteOwner && status?.repoName && (
                  <div className="text-xs text-gray-500 truncate">
                    {status.remoteOwner}/{status.repoName}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={push}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                  title="Push"
                >
                  <ArrowUp size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={pull}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                  title="Pull"
                >
                  <ArrowDown size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={refresh}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Branch switcher */}
            {branches && (
              <BranchSwitcher
                branches={branches}
                onCheckout={checkout}
                onCreate={createBranch}
              />
            )}
          </div>

      {/* Error message */}
      {error && (
        <div className="flex-shrink-0 px-3 py-2 bg-red-900/20 border-b border-red-800 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged changes */}
        <div className="border-b border-gray-800">
          <div className="px-3 py-2 flex items-center justify-between bg-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">
              Staged Changes ({stagedFiles.length})
            </h3>
            {stagedFiles.length > 0 && (
              <button
                onClick={unstageAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300"
                title="Unstage all"
              >
                <Minus size={12} />
                <span>All</span>
              </button>
            )}
          </div>
          {stagedFiles.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No staged changes</div>
          ) : (
            <div>
              {stagedFiles.map((file) => (
                <GitFileItem
                  key={file.path}
                  file={file}
                  onStage={stageFile}
                  onUnstage={unstageFile}
                  onClick={handleFileClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Unstaged changes */}
        <div className="border-b border-gray-800">
          <div className="px-3 py-2 flex items-center justify-between bg-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase">
              Changes ({unstagedFiles.length})
            </h3>
            {unstagedFiles.length > 0 && (
              <button
                onClick={stageAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300"
                title="Stage all"
              >
                <Plus size={12} />
                <span>All</span>
              </button>
            )}
          </div>
          {unstagedFiles.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No changes</div>
          ) : (
            <div>
              {unstagedFiles.map((file) => (
                <GitFileItem
                  key={file.path}
                  file={file}
                  onStage={stageFile}
                  onUnstage={unstageFile}
                  onClick={handleFileClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Commit section */}
        <div className="px-3 py-3 border-b border-gray-800">
          <textarea
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-700 rounded focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCommit}
              disabled={!canCommit || isLoading}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
            >
              Commit
            </button>
            <button
              onClick={handleCommitAndPush}
              disabled={!canCommit || isLoading}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors flex items-center gap-1"
              title="Commit and Push"
            >
              <ArrowUp size={14} />
              <span>Push</span>
            </button>
          </div>
        </div>

        {/* History */}
        <GitHistory commits={history} />
      </div>

          {/* Status bar */}
          {status && (
            <div className="flex-shrink-0 px-3 py-1.5 border-t border-gray-800 text-xs text-gray-500">
              {status.ahead > 0 && <span>↑{status.ahead} </span>}
              {status.behind > 0 && <span>↓{status.behind} </span>}
              {status.ahead === 0 && status.behind === 0 && <span>Up to date</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
