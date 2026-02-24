📄 Task 4.1 — Real Terminal with node-pty
=========================================

🎯 Objective
------------
Integrate xterm.js in the frontend with node-pty on the backend for a
real, fully functional terminal connected to the local machine's shell
via WebSocket.

📂 File Locations
=================
```shell
backend/src/services/terminalService.ts
frontend/src/components/terminal/TerminalPanel.tsx
frontend/src/components/terminal/XTerminal.tsx
frontend/src/components/terminal/BottomPanel.tsx
frontend/src/hooks/useTerminal.ts
```

1️⃣ terminalService.ts (backend)
==================================
```typescript
import * as pty from 'node-pty';
import { WebSocket } from 'ws';

interface TerminalSession {
  id: string;
  pty: pty.IPty;
  ws: WebSocket;
  cwd: string;
}

const sessions = new Map<string, TerminalSession>();

export function createSession(
  sessionId: string,
  ws: WebSocket,
  cwd: string,
  cols = 80,
  rows = 24
): TerminalSession {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols, rows, cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'terminal:output', sessionId, data }));
    }
  });

  const session = { id: sessionId, pty: ptyProcess, ws, cwd };
  sessions.set(sessionId, session);
  return session;
}

export function writeToSession(sessionId: string, data: string) {
  sessions.get(sessionId)?.pty.write(data);
}

export function resizeSession(sessionId: string, cols: number, rows: number) {
  sessions.get(sessionId)?.pty.resize(cols, rows);
}

export function killSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session) { session.pty.kill(); sessions.delete(sessionId); }
}
```

Handle in wsServer.ts:
- On WS message `terminal:input` → writeToSession
- On WS message `terminal:resize` → resizeSession
- On WS close → killSession

2️⃣ useTerminal.ts (frontend)
==============================
```typescript
// Connect to WS, create terminal session on mount
// On mount: send { type: 'terminal:create', sessionId, cwd: workspacePath }
// Route incoming messages to xterm terminal instance
// On unmount: send { type: 'terminal:kill', sessionId }
// Expose: write(data), resize(cols, rows), clear()
```

3️⃣ XTerminal.tsx (frontend, dynamic ssr:false)
================================================
```typescript
// xterm Terminal options:
{
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13, lineHeight: 1.4,
  theme: {
    background: '#0d0d14', foreground: '#eeeef5',
    cursor: '#7b68ee', cursorAccent: '#0d0d14',
    selectionBackground: '#3d358040',
    black: '#0d0d14', red: '#ff5555', green: '#50fa7b',
    yellow: '#ffb86c', blue: '#7b68ee', magenta: '#ff79c6',
    cyan: '#8be9fd', white: '#eeeef5',
    brightBlack: '#55556b', brightRed: '#ff6e6e',
    brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff', brightMagenta: '#ff92df',
    brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  allowTransparency: true, cursorBlink: true,
  scrollback: 10000, bellStyle: 'none',
}
// Load FitAddon → fit on mount and on resize (ResizeObserver)
// Load WebLinksAddon → clickable URLs
// On key: send to WS as terminal:input
```

4️⃣ BottomPanel.tsx
===================
Tab bar: [Terminal] [Problems] [Output] [Debug Console]
- Terminal tab: XTerminal
- "+" button: create new terminal session (multiple terminals)
- Terminal tabs: each session has its own tab with session name
- Kill button (×) per terminal tab
- Problems tab: empty for now, "No problems detected"
- Maximize button: expand bottom panel to fill editor area

🧪 Test Scenarios
=================

### Scenario 1: Terminal opens
- Open bottom panel → Terminal tab
- Expected: Real shell prompt for your machine appears (bash/zsh)

### Scenario 2: Run real command
- Type "ls -la" in terminal
- Expected: Real directory listing of workspace path

### Scenario 3: Run npm command
- Type "node --version"
- Expected: Real Node.js version from your machine

### Scenario 4: Terminal resize
- Drag bottom panel taller
- Expected: Terminal columns/rows adjust, no garbled text

### Scenario 5: Multiple terminals
- Click "+" next to terminal tabs
- Expected: New shell session opens in new tab

### Scenario 6: Agent uses terminal
- In agent mode, ask to run a command
- Expected: Output appears in terminal panel AND in agent step card

🔒 Non-Functional Requirements
===============================
- xterm must be dynamic imported (ssr: false)
- PTY must be killed when terminal tab is closed
- Terminal cwd must start at workspace root

✅ Deliverable
==============
```shell
Real terminal connected to local machine shell via WebSocket + node-pty
```

📊 Acceptance Criteria
======================
- [ ] Real shell commands execute
- [ ] Terminal resize works (no garbled output)
- [ ] Multiple terminal sessions work
- [ ] Agent can use terminal
- [ ] PTY sessions cleaned up on close
- [ ] No TypeScript errors

⏱️ Estimated Duration: 60-75 minutes
🔗 Dependencies: Task 1.1, Task 1.2
🔗 Blocks: Task 3.2 (agent terminal access)