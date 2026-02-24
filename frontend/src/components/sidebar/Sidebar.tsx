'use client';

import { Files, Search as SearchIcon, GitBranch, X } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { WorkspaceSelector } from './WorkspaceSelector';
import { FileTree } from './FileTree';
import { SearchPanel } from './SearchPanel';
import GitPanel from './GitPanel';

export function Sidebar() {
  const {
    activeSidebarPanel,
    setSidebarPanel,
    isSidebarOpen,
    toggleSidebar,
    workspacePath,
    workspaceName,
  } = useIDEStore();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 truncate">
          {workspacePath ? workspaceName : 'Explorer'}
        </h2>
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close Sidebar"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setSidebarPanel('files')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm transition-colors ${
            activeSidebarPanel === 'files'
              ? 'bg-gray-800 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Files className="w-4 h-4" />
          <span>Files</span>
        </button>

        <button
          onClick={() => setSidebarPanel('search')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm transition-colors ${
            activeSidebarPanel === 'search'
              ? 'bg-gray-800 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <SearchIcon className="w-4 h-4" />
          <span>Search</span>
        </button>

        <button
          onClick={() => setSidebarPanel('git')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm transition-colors ${
            activeSidebarPanel === 'git'
              ? 'bg-gray-800 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Git</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeSidebarPanel === 'files' && (
          <div className="h-full">
            {workspacePath ? <FileTree /> : <WorkspaceSelector />}
          </div>
        )}

        {activeSidebarPanel === 'search' && (
          <div className="h-full">
            {workspacePath ? (
              <SearchPanel />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center">
                <p className="text-gray-400 text-sm">
                  Open a workspace to search files
                </p>
              </div>
            )}
          </div>
        )}

        {activeSidebarPanel === 'git' && (
          <div className="h-full">
            {workspacePath ? (
              <GitPanel />
            ) : (
              <div className="flex items-center justify-center h-full p-4 text-center">
                <p className="text-gray-400 text-sm">
                  Open a workspace to use Git
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
