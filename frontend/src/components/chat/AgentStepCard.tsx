'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, Terminal, FileText } from 'lucide-react';
import type { AgentStep } from '@/lib/api/chatApi';

interface AgentStepCardProps {
  step: AgentStep;
}

export default function AgentStepCard({ step }: AgentStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render thinking or final_response steps
  if (step.type === 'thinking' || step.type === 'final_response') {
    return null;
  }

  const isToolCall = step.type === 'tool_call';
  const isToolResult = step.type === 'tool_result';

  // Tool icon mapping
  const getToolIcon = (toolName?: string) => {
    if (!toolName) return <Terminal size={14} />;

    if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
      return <FileText size={14} />;
    }
    return <Terminal size={14} />;
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Expand/collapse icon */}
        <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        {/* Tool icon */}
        <div className="flex-shrink-0 text-blue-500 dark:text-blue-400">
          {getToolIcon(step.toolName)}
        </div>

        {/* Tool name and status */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {step.toolName || 'Unknown Tool'}
            </span>

            {isToolResult && (
              <div className="flex-shrink-0">
                {step.result?.success ? (
                  <CheckCircle size={14} className="text-green-500" />
                ) : (
                  <XCircle size={14} className="text-red-500" />
                )}
              </div>
            )}

            {isToolCall && (
              <div className="flex-shrink-0">
                <Loader2 size={14} className="text-blue-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Args preview (for tool calls) */}
          {isToolCall && step.args && Object.keys(step.args).length > 0 && (
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              {Object.entries(step.args)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          {formatTime(step.timestamp)}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
          {/* Tool call args */}
          {isToolCall && step.args && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Arguments:
              </div>
              <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(step.args, null, 2)}
              </pre>
            </div>
          )}

          {/* Tool result */}
          {isToolResult && step.result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Result:
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${
                  step.result.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {step.result.success ? 'Success' : 'Error'}
                </div>
              </div>
              <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                {step.result.output || step.result.error || 'No output'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
