'use client';

import React from 'react';
import { User, Bot } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/api/chatApi';

interface ChatMessageProps {
  message: ChatMessageType;
  onInsertCode?: (code: string) => void;
}

export default function ChatMessage({ message, onInsertCode }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Parse message content to extract code blocks
  const parseContent = (content: string) => {
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
  };

  const parts = parseContent(message.content);

  return (
    <div
      className={`flex gap-3 p-4 ${
        isUser ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-purple-500 text-white'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>

        <div className="space-y-3">
          {parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <div
                  key={index}
                  className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words"
                >
                  {part.content}
                </div>
              );
            } else {
              return (
                <div key={index} className="relative group">
                  <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-950 px-3 py-1.5 rounded-t">
                    <span className="text-xs text-gray-400">{part.language}</span>
                    {onInsertCode && (
                      <button
                        onClick={() => onInsertCode(part.content)}
                        className="text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Insert
                      </button>
                    )}
                  </div>
                  <pre className="bg-gray-900 dark:bg-gray-950 px-3 py-2 rounded-b overflow-x-auto">
                    <code className="text-sm text-gray-100 font-mono">
                      {part.content}
                    </code>
                  </pre>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
