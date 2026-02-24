'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Bot, Loader2, StopCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import AgentStepCard from './AgentStepCard';
import { sendChatMessage, runAgent, stopAgent } from '@/lib/api/chatApi';
import type { ChatMessage as ChatMessageType, AgentStep } from '@/lib/api/chatApi';
import { useIDEStore } from '@/store/ideStore';

type ChatMode = 'chat' | 'agent';

interface DisplayItem {
  type: 'message' | 'agent_step';
  id: string;
  data: ChatMessageType | AgentStep;
}

export function ChatPanel(): JSX.Element {
  const [mode, setMode] = useState<ChatMode>('chat');
  const [input, setInput] = useState('');
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get active file from store
  const activeFile = useIDEStore((state) =>
    state.tabs.find((tab) => tab.id === state.activeTabId)
  );

  // Auto-scroll to bottom on new items
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      role: 'user',
      content: input.trim(),
    };

    // Add user message to display
    setItems((prev) => [
      ...prev,
      {
        type: 'message',
        id: `msg-${Date.now()}`,
        data: userMessage,
      },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'chat') {
        // Chat mode - simple request/response
        const messages: ChatMessageType[] = [
          ...items
            .filter((item) => item.type === 'message')
            .map((item) => item.data as ChatMessageType),
          userMessage,
        ];

        const response = await sendChatMessage(
          messages,
          activeFile?.path,
          activeFile?.content
        );

        // Add assistant response
        setItems((prev) => [
          ...prev,
          {
            type: 'message',
            id: `msg-${Date.now()}`,
            data: {
              role: 'assistant',
              content: response,
            },
          },
        ]);
      } else {
        // Agent mode - SSE streaming with tools
        setIsAgentRunning(true);
        abortControllerRef.current = new AbortController();

        await runAgent(
          userMessage.content,
          (step: AgentStep) => {
            // Add agent step to display
            setItems((prev) => [
              ...prev,
              {
                type: 'agent_step',
                id: `step-${Date.now()}-${Math.random()}`,
                data: step,
              },
            ]);

            // If final response, add as message
            if (step.type === 'final_response' && step.content) {
              setItems((prev) => [
                ...prev,
                {
                  type: 'message',
                  id: `msg-${Date.now()}`,
                  data: {
                    role: 'assistant',
                    content: step.content!,
                  },
                },
              ]);
            }
          },
          (error: string) => {
            console.error('Agent error:', error);
          },
          abortControllerRef.current.signal
        );

        setIsAgentRunning(false);
        abortControllerRef.current = null;
      }
    } catch (error: any) {
      console.error('Chat/Agent error:', error);

      // Add error message
      setItems((prev) => [
        ...prev,
        {
          type: 'message',
          id: `msg-${Date.now()}`,
          data: {
            role: 'assistant',
            content: `Error: ${error.message || 'Request failed'}`,
          },
        },
      ]);

      setIsAgentRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stop agent
  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    try {
      await stopAgent();
    } catch (error) {
      console.error('Stop agent error:', error);
    }

    setIsAgentRunning(false);
    setIsLoading(false);
  };

  // Handle insert code from message
  const handleInsertCode = (code: string) => {
    // TODO: Insert code at cursor position in active editor
    console.log('Insert code:', code);
  };

  // Clear chat
  const handleClear = () => {
    setItems([]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            AI Assistant
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                mode === 'chat'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                mode === 'agent'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Bot size={12} />
              Agent
            </button>
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              {mode === 'chat' ? (
                <MessageSquare size={32} className="text-gray-400" />
              ) : (
                <Bot size={32} className="text-gray-400" />
              )}
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              {mode === 'chat' ? 'Start a conversation' : 'Start an agent task'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {mode === 'chat'
                ? 'Ask questions, get code suggestions, or discuss your project.'
                : 'Give a task and the agent will autonomously use tools to complete it.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => {
              if (item.type === 'message') {
                return (
                  <ChatMessage
                    key={item.id}
                    message={item.data as ChatMessageType}
                    onInsertCode={handleInsertCode}
                  />
                );
              } else {
                return (
                  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800">
                    <AgentStepCard step={item.data as AgentStep} />
                  </div>
                );
              }
            })}

            {/* Loading indicator */}
            {isLoading && !isAgentRunning && (
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="relative">
        {isAgentRunning && (
          <div className="absolute top-0 left-0 right-0 -mt-12 px-3">
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <StopCircle size={16} />
              Stop Agent
            </button>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
          placeholder={
            mode === 'chat'
              ? 'Ask a question...'
              : 'Describe a task for the agent...'
          }
        />
      </div>
    </div>
  );
}
