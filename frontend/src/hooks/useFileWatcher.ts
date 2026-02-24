import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  event?: string;
  path?: string;
  sessionId?: string;
  data?: string;
}

interface FileWatcherCallbacks {
  onTreeRefresh?: () => void;
  onFileChange?: (event: 'add' | 'change' | 'unlink', path: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useFileWatcher(callbacks: FileWatcherCallbacks) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const wsUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(
      /^http/,
      'ws'
    );

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[FileWatcher] Connected to WebSocket');
        reconnectAttemptsRef.current = 0;
        callbacks.onConnected?.();

        // Send ping to keep connection alive
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'tree:refresh':
              console.log('[FileWatcher] Tree refresh requested');
              callbacks.onTreeRefresh?.();
              break;

            case 'file:change':
              if (message.event && message.path) {
                console.log(`[FileWatcher] File ${message.event}: ${message.path}`);
                callbacks.onFileChange?.(
                  message.event as 'add' | 'change' | 'unlink',
                  message.path
                );
              }
              break;

            case 'pong':
              // Keep-alive response
              break;

            default:
              // Ignore unknown message types
              break;
          }
        } catch (error) {
          console.error('[FileWatcher] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[FileWatcher] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('[FileWatcher] Disconnected from WebSocket');
        callbacks.onDisconnected?.();

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[FileWatcher] Reconnecting in ${delay}ms...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[FileWatcher] Failed to create WebSocket:', error);
    }
  }, [callbacks]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect,
    disconnect,
  };
}
