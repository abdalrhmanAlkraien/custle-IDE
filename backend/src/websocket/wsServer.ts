import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage } from '../types';
import { terminalService } from '../services/terminalService';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    // Track sessions and unsubscribers for this client
    const clientSessions = new Set<string>();
    const unsubscribers = new Map<string, () => void>();

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        // Handle ping/pong
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Terminal message handlers
        switch (message.type) {
          case 'terminal:create': {
            const { sessionId, cwd, cols, rows } = message as any;
            try {
              const session = terminalService.create(
                sessionId,
                cwd,
                cols || 80,
                rows || 24
              );

              // Track session for this client
              clientSessions.add(sessionId);

              // Stream PTY output → WebSocket
              const unsub = terminalService.onOutput(sessionId, (data) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: 'terminal:output',
                      sessionId,
                      data,
                    })
                  );
                }
              });
              unsubscribers.set(sessionId, unsub);

              ws.send(
                JSON.stringify({
                  type: 'terminal:created',
                  sessionId,
                  pid: session.pty.pid,
                })
              );
            } catch (error: any) {
              ws.send(
                JSON.stringify({
                  type: 'terminal:error',
                  sessionId,
                  error: error.message,
                })
              );
            }
            break;
          }

          case 'terminal:input': {
            const { sessionId, data: inputData } = message as any;
            try {
              terminalService.write(sessionId, inputData);
            } catch (error: any) {
              ws.send(
                JSON.stringify({
                  type: 'terminal:error',
                  sessionId,
                  error: error.message,
                })
              );
            }
            break;
          }

          case 'terminal:resize': {
            const { sessionId, cols, rows } = message as any;
            try {
              terminalService.resize(sessionId, cols, rows);
            } catch (error: any) {
              ws.send(
                JSON.stringify({
                  type: 'terminal:error',
                  sessionId,
                  error: error.message,
                })
              );
            }
            break;
          }

          case 'terminal:kill': {
            const { sessionId } = message as any;
            try {
              // Unsubscribe from output
              unsubscribers.get(sessionId)?.();
              unsubscribers.delete(sessionId);

              // Kill the session
              terminalService.kill(sessionId);
              clientSessions.delete(sessionId);

              ws.send(
                JSON.stringify({
                  type: 'terminal:killed',
                  sessionId,
                })
              );
            } catch (error: any) {
              ws.send(
                JSON.stringify({
                  type: 'terminal:error',
                  sessionId,
                  error: error.message,
                })
              );
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');

      // Clean up all sessions for this client
      for (const sessionId of clientSessions) {
        unsubscribers.get(sessionId)?.();
        terminalService.kill(sessionId);
      }
      clientSessions.clear();
      unsubscribers.clear();

      clients.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);

      // Clean up all sessions for this client
      for (const sessionId of clientSessions) {
        unsubscribers.get(sessionId)?.();
        terminalService.kill(sessionId);
      }
      clientSessions.clear();
      unsubscribers.clear();

      clients.delete(ws);
    });
  });

  console.log('WebSocket server initialized');
}

/**
 * Broadcast a message to all connected clients
 */
export function broadcast(message: WebSocketMessage): void {
  const data = JSON.stringify(message);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

/**
 * Get the number of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Close all WebSocket connections and shutdown server
 */
export function closeWebSocketServer(): void {
  clients.forEach((client) => {
    client.close();
  });
  clients.clear();

  if (wss) {
    wss.close();
    wss = null;
  }

  console.log('WebSocket server closed');
}
