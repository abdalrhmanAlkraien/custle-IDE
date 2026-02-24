/**
 * BranchSwitcher Component
 * Branch dropdown with create/checkout functionality
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Plus } from 'lucide-react';
import { GitBranches } from '@/lib/api/gitApi';

interface BranchSwitcherProps {
  branches: GitBranches;
  onCheckout: (branch: string) => void;
  onCreate: (name: string) => void;
}

export default function BranchSwitcher({ branches, onCheckout, onCreate }: BranchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredLocal = branches.local.filter((branch) =>
    branch.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRemote = branches.remote.filter((branch) =>
    branch.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckout = (branch: string) => {
    onCheckout(branch);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateBranch = () => {
    if (newBranchName.trim()) {
      onCreate(newBranchName.trim());
      setNewBranchName('');
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current branch button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
      >
        <GitBranch size={16} className="text-gray-400" />
        <span className="flex-1 text-left text-gray-300">{branches.current}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search input */}
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-900 text-gray-300 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Local branches */}
          <div className="py-1">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
              Local Branches
            </div>
            {filteredLocal.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No local branches</div>
            ) : (
              filteredLocal.map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleCheckout(branch)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-700 transition-colors ${
                    branch === branches.current ? 'text-blue-400 font-semibold' : 'text-gray-300'
                  }`}
                >
                  {branch}
                  {branch === branches.current && (
                    <span className="ml-2 text-xs text-gray-500">(current)</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Remote branches */}
          {branches.remote.length > 0 && (
            <div className="py-1 border-t border-gray-700">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                Remote Branches
              </div>
              {filteredRemote.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No matching remote branches</div>
              ) : (
                filteredRemote.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => handleCheckout(branch)}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-700 transition-colors"
                  >
                    {branch}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Create new branch */}
          <div className="p-2 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New branch name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBranch();
                  }
                }}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-900 text-gray-300 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
                title="Create and checkout new branch"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
