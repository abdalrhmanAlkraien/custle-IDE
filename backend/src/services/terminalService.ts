import * as pty from 'node-pty';
import { WebSocket } from 'ws';

export interface TerminalSession {
  id: string;
  pty: pty.IPty;
  ws: WebSocket;
  cwd: string;
}

const sessions = new Map<string, TerminalSession>();

/**
 * Create a new PTY terminal session
 */
export function createSession(
  sessionId: string,
  ws: WebSocket,
  cwd: string,
  cols = 80,
  rows = 24
): TerminalSession {
  // Determine shell based on platform
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

  // Spawn PTY process
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols,
    rows,
    cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  });

  // Forward PTY output to WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'terminal:output',
        sessionId,
        data
      }));
    }
  });

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'terminal:exit',
        sessionId,
        exitCode,
        signal,
      }));
    }
    sessions.delete(sessionId);
  });

  const session: TerminalSession = { id: sessionId, pty: ptyProcess, ws, cwd };
  sessions.set(sessionId, session);

  return session;
}

/**
 * Write data to a terminal session
 */
export function writeToSession(sessionId: string, data: string): boolean {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.write(data);
    return true;
  }
  return false;
}

/**
 * Resize a terminal session
 */
export function resizeSession(sessionId: string, cols: number, rows: number): boolean {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.resize(cols, rows);
    return true;
  }
  return false;
}

/**
 * Kill a terminal session and clean up
 */
export function killSession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (session) {
    session.pty.kill();
    sessions.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Get a terminal session by ID
 */
export function getSession(sessionId: string): TerminalSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Get all active sessions
 */
export function getAllSessions(): TerminalSession[] {
  return Array.from(sessions.values());
}

/**
 * Kill all sessions (cleanup on server shutdown)
 */
export function killAllSessions(): void {
  sessions.forEach((session) => {
    session.pty.kill();
  });
  sessions.clear();
}
