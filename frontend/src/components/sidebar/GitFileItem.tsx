/**
 * GitFileItem Component
 * Individual git file item with status badge and stage/unstage button
 */

import { GitFileStatus } from '@/lib/api/gitApi';
import { Plus, Minus } from 'lucide-react';

interface GitFileItemProps {
  file: GitFileStatus;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onClick: (path: string) => void;
}

export default function GitFileItem({ file, onStage, onUnstage, onClick }: GitFileItemProps) {
  const getStatusBadge = () => {
    switch (file.status) {
      case 'modified':
        return <span className="text-yellow-500 font-semibold">M</span>;
      case 'added':
        return <span className="text-green-500 font-semibold">A</span>;
      case 'deleted':
        return <span className="text-red-500 font-semibold">D</span>;
      case 'untracked':
        return <span className="text-gray-500 font-semibold">?</span>;
      case 'renamed':
        return <span className="text-blue-500 font-semibold">R</span>;
      default:
        return null;
    }
  };

  const handleClick = () => {
    onClick(file.path);
  };

  const handleStageUnstage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.staged) {
      onUnstage(file.path);
    } else {
      onStage(file.path);
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 cursor-pointer group"
      onClick={handleClick}
      title={file.path}
    >
      {/* Status badge */}
      <div className="w-5 flex-shrink-0">{getStatusBadge()}</div>

      {/* File path */}
      <div className="flex-1 text-sm text-gray-300 truncate">{file.path}</div>

      {/* Stage/Unstage button */}
      <button
        onClick={handleStageUnstage}
        className="flex-shrink-0 p-1 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        title={file.staged ? 'Unstage file' : 'Stage file'}
      >
        {file.staged ? (
          <Minus size={14} className="text-gray-400" />
        ) : (
          <Plus size={14} className="text-gray-400" />
        )}
      </button>
    </div>
  );
}
