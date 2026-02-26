import * as pty from 'node-pty';
import os from 'os';

export interface PtySession {
  id: string;
  pty: pty.IPty;
  cwd: string;
  outputBuffer: string; // rolling last 8KB of output for agent reads
  outputListeners: Set<(data: string) => void>;
}

export interface ExecuteResult {
  output: string;
  exitCode: number | null;
}

class TerminalService {
  private sessions = new Map<string, PtySession>();
  private readonly MAX_BUFFER_SIZE = 8192; // 8KB

  /**
   * Create a new PTY session
   * shell: /bin/zsh on macOS, /bin/bash on Linux, powershell.exe on Windows
   * cwd: workspace root if provided, os.homedir() otherwise
   */
  create(sessionId: string, cwd?: string, cols = 80, rows = 24): PtySession {
    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // Determine shell based on platform
    const shell =
      os.platform() === 'win32'
        ? 'powershell.exe'
        : os.platform() === 'darwin'
        ? '/bin/zsh'
        : '/bin/bash';

    const workingDir = cwd || os.homedir();

    // Spawn PTY process
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    const session: PtySession = {
      id: sessionId,
      pty: ptyProcess,
      cwd: workingDir,
      outputBuffer: '',
      outputListeners: new Set(),
    };

    // Capture output for buffer and listeners
    ptyProcess.onData((data) => {
      // Add to rolling buffer (keep last 8KB)
      session.outputBuffer += data;
      if (session.outputBuffer.length > this.MAX_BUFFER_SIZE) {
        session.outputBuffer = session.outputBuffer.slice(-this.MAX_BUFFER_SIZE);
      }

      // Notify all listeners
      session.outputListeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error('Error in output listener:', err);
        }
      });
    });

    // Handle PTY exit
    ptyProcess.onExit(() => {
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Write raw input (keystrokes) to PTY stdin
   */
  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }
    session.pty.write(data);
  }

  /**
   * Resize PTY (called when terminal panel resizes)
   */
  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }
    session.pty.resize(cols, rows);
  }

  /**
   * Kill PTY session and clean up
   */
  kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.outputListeners.clear();
      session.pty.kill();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Subscribe to PTY output for a session
   * Returns unsubscribe function
   */
  onOutput(sessionId: string, cb: (data: string) => void): () => void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    session.outputListeners.add(cb);

    // Return unsubscribe function
    return () => {
      session.outputListeners.delete(cb);
    };
  }

  /**
   * Execute a command and capture output (for AI agent)
   * Writes command + newline to PTY, collects output until markers detected
   * Timeout: 30 seconds
   * Returns: { output: string, exitCode: number | null }
   */
  async execute(sessionId: string, command: string): Promise<ExecuteResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    const startMarker = `__CUSTLE_START_${Date.now()}__`;
    const endMarker = `__CUSTLE_END_${Date.now()}__`;

    // Use markers to reliably delimit output
    // The semicolon after command ensures we capture exit code even if command fails
    const fullCommand = `echo "${startMarker}" && ${command} ; echo "${endMarker} $?"`;

    return new Promise((resolve) => {
      let capturing = false;
      let output = '';
      let exitCode: number | null = null;
      const timeout = setTimeout(() => {
        unsub();
        resolve({ output: output.trim(), exitCode });
      }, 30000);

      const unsub = this.onOutput(sessionId, (data) => {
        // Look for start marker
        if (data.includes(startMarker)) {
          capturing = true;
          // Remove the start marker from output
          const parts = data.split(startMarker);
          if (parts.length > 1) {
            output += parts[1];
          }
          return;
        }

        // Look for end marker
        if (data.includes(endMarker)) {
          // Extract exit code from marker line
          const match = data.match(new RegExp(`${endMarker}\\s*(\\d+)`));
          exitCode = match ? parseInt(match[1]) : null;

          // Add any output before the end marker
          const parts = data.split(endMarker);
          if (parts.length > 0 && capturing) {
            output += parts[0];
          }

          clearTimeout(timeout);
          unsub();
          resolve({ output: output.trim(), exitCode });
          return;
        }

        // Capture output between markers
        if (capturing) {
          output += data;
        }
      });

      // Send the command
      session.pty.write(fullCommand + '\r');
    });
  }

  /**
   * Get all active sessions
   */
  getSessions(): { id: string; cwd: string; outputBuffer: string }[] {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      cwd: session.cwd,
      outputBuffer: session.outputBuffer,
    }));
  }

  /**
   * Get a single session
   */
  getSession(sessionId: string): PtySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Kill all sessions (called on backend shutdown)
   */
  killAll(): void {
    this.sessions.forEach((session) => {
      session.outputListeners.clear();
      session.pty.kill();
    });
    this.sessions.clear();
  }
}

// Singleton instance
export const terminalService = new TerminalService();

// Cleanup on process exit
process.on('exit', () => terminalService.killAll());
process.on('SIGTERM', () => {
  terminalService.killAll();
  process.exit(0);
});
process.on('SIGINT', () => {
  terminalService.killAll();
  process.exit(0);
});
