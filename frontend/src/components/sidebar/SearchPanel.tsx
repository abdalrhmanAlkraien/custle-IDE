'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Loader2 } from 'lucide-react';
import { filesApi, type SearchResult } from '@/lib/api/filesApi';
import { useIDEStore } from '@/store/ideStore';

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const { openTab } = useIDEStore();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        let searchQuery = query;
        if (!useRegex) {
          // Escape special regex characters if not using regex mode
          searchQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // Note: Backend currently always searches case-insensitively with 'gi' flags
        // The caseSensitive toggle is not yet implemented in the backend API
        // TODO: Update backend to support case-sensitive parameter

        const searchResults = await filesApi.searchFiles(searchQuery);
        setResults(searchResults);
      } catch (err: any) {
        console.error('Search failed:', err);
        setError(err.response?.data?.error || err.message || 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, caseSensitive, useRegex]);

  const handleMatchClick = async (result: SearchResult, _lineNumber: number) => {
    try {
      const fileData = await filesApi.readFile(result.path);
      openTab({
        path: result.path,
        relativePath: result.relativePath,
        name: result.relativePath.split('/').pop() || 'file',
        content: fileData.content,
        language: fileData.language,
      });

      // TODO: Scroll to line number in Monaco editor
      // This will be implemented in Task 2.3
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const totalResults = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-gray-900 border border-gray-600 rounded pl-10 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Options */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              caseSensitive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Aa
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              useRegex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            .*
          </button>
        </div>
      </div>

      {/* Results Count */}
      {query.trim() && !loading && (
        <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
          {totalResults} result{totalResults !== 1 ? 's' : ''} in {results.length} file
          {results.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 text-red-400 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!query.trim() && !loading && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Search className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">Type to search across all files</p>
        </div>
      )}

      {/* Results */}
      {!loading && query.trim() && results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-gray-400 text-sm">No results found</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {results.map((result) => (
            <div key={result.path} className="border-b border-gray-800">
              {/* File Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">
                  {result.relativePath}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {result.matches.length}
                </span>
              </div>

              {/* Matches */}
              <div>
                {result.matches.map((match, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMatchClick(result, match.lineNumber)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0 w-8">
                        {match.lineNumber}
                      </span>
                      <code className="text-xs text-gray-300 flex-1 font-mono overflow-x-auto">
                        {match.content}
                      </code>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
