const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentStep {
  type: 'tool_call' | 'tool_result' | 'thinking' | 'final_response';
  toolName?: string;
  args?: Record<string, string>;
  result?: {
    success: boolean;
    output?: string;
    error?: string;
  };
  content?: string;
  timestamp: string;
}

/**
 * Send a chat message (simple mode - no tools)
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  activeFilePath?: string,
  activeFileContent?: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      activeFilePath,
      activeFileContent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Chat request failed');
  }

  const data = await response.json();
  return data.response;
}

/**
 * Run agent with tools (SSE streaming)
 */
export async function runAgent(
  message: string,
  onStep: (step: AgentStep) => void,
  onError?: (error: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/agent/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Agent request failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        // SSE format: "data: <json>"
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove "data: " prefix

          if (data === '[DONE]') {
            return;
          }

          try {
            const step = JSON.parse(data) as AgentStep;
            onStep(step);

            // Check for error step
            if (step.type === 'final_response' && step.content?.includes('Error')) {
              onError?.(step.content);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', data, parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stop current agent execution
 */
export async function stopAgent(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/agent/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Stop request failed');
  }
}
