import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage } from '../types';
import * as terminalService from '../services/terminalService';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();
const clientSessions: Map<WebSocket, Set<string>> = new Map();

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    clientSessions.set(ws, new Set());

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
        if (message.type === 'terminal:create') {
          const { sessionId, cwd, cols, rows } = message as any;
          try {
            const session = terminalService.createSession(
              sessionId,
              ws,
              cwd || process.cwd(),
              cols || 80,
              rows || 24
            );

            // Track session for this client
            clientSessions.get(ws)?.add(sessionId);

            ws.send(JSON.stringify({
              type: 'terminal:created',
              sessionId,
              cwd: session.cwd,
            }));
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'terminal:error',
              sessionId,
              error: error.message,
            }));
          }
        } else if (message.type === 'terminal:input') {
          const { sessionId, data: inputData } = message as any;
          const success = terminalService.writeToSession(sessionId, inputData);
          if (!success) {
            ws.send(JSON.stringify({
              type: 'terminal:error',
              sessionId,
              error: 'Session not found',
            }));
          }
        } else if (message.type === 'terminal:resize') {
          const { sessionId, cols, rows } = message as any;
          const success = terminalService.resizeSession(sessionId, cols, rows);
          if (!success) {
            ws.send(JSON.stringify({
              type: 'terminal:error',
              sessionId,
              error: 'Session not found',
            }));
          }
        } else if (message.type === 'terminal:kill') {
          const { sessionId } = message as any;
          const success = terminalService.killSession(sessionId);
          clientSessions.get(ws)?.delete(sessionId);

          if (success) {
            ws.send(JSON.stringify({
              type: 'terminal:killed',
              sessionId,
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');

      // Kill all terminal sessions for this client
      const sessions = clientSessions.get(ws);
      if (sessions) {
        sessions.forEach((sessionId) => {
          terminalService.killSession(sessionId);
        });
        clientSessions.delete(ws);
      }

      clients.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);

      // Kill all terminal sessions for this client
      const sessions = clientSessions.get(ws);
      if (sessions) {
        sessions.forEach((sessionId) => {
          terminalService.killSession(sessionId);
        });
        clientSessions.delete(ws);
      }

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
