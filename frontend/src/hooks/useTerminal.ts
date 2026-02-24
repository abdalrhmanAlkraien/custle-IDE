import { useEffect, useRef, useCallback } from 'react';
import { useIDEStore } from '@/store/ideStore';

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS || 'ws://localhost:3001';

export interface TerminalHandle {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  clear: () => void;
  dispose: () => void;
}

export function useTerminal(
  sessionId: string,
  onData: (data: string) => void,
  onExit?: (exitCode: number) => void
): TerminalHandle {
  const wsRef = useRef<WebSocket | null>(null);
  const workspacePath = useIDEStore((state) => state.workspacePath);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected, creating terminal session:', sessionId);

      // Create terminal session
      ws.send(JSON.stringify({
        type: 'terminal:create',
        sessionId,
        cwd: workspacePath || process.cwd(),
        cols: 80,
        rows: 24,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.sessionId !== sessionId) {
          return; // Ignore messages for other sessions
        }

        switch (message.type) {
          case 'terminal:created':
            console.log('Terminal session created:', sessionId);
            break;

          case 'terminal:output':
            onData(message.data);
            break;

          case 'terminal:exit':
            console.log('Terminal exited:', message.exitCode);
            if (onExit) {
              onExit(message.exitCode || 0);
            }
            break;

          case 'terminal:error':
            console.error('Terminal error:', message.error);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'terminal:kill',
          sessionId,
        }));
      }
      ws.close();
    };
  }, [sessionId, workspacePath, onData, onExit]);

  const write = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'terminal:input',
        sessionId,
        data,
      }));
    }
  }, [sessionId]);

  const resize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'terminal:resize',
        sessionId,
        cols,
        rows,
      }));
    }
  }, [sessionId]);

  const clear = useCallback(() => {
    // Send clear command (Ctrl+L equivalent)
    write('\x0c');
  }, [write]);

  const dispose = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'terminal:kill',
        sessionId,
      }));
    }
  }, [sessionId]);

  return { write, resize, clear, dispose };
}
