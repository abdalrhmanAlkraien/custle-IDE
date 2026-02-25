# Task 7.3: Real Terminal Connection + AI Agent Terminal Access

**Phase**: Phase 7 — GitHub Integration & Core Fixes  
**Task Number**: 7.3  
**Status**: ⏳ PENDING  
**Dependencies**: 4.1 (Terminal stub), 3.2 (AI Agent Panel)  
**Blocks**: Nothing  
**Estimated Duration**: 80-100 minutes  
**Estimated Cost**: ~$0.50 (Implementation: $0.36, Testing: $0.14)

---

## Objective

Fix the terminal so users can actually type commands and see output. Then expose that same terminal to the AI agent so it can read output, write commands, and execute them — giving the agent real shell access with full read/write/create/update permissions on the workspace.

---

## Background — What's Broken

Task 4.1 created the terminal panel scaffold but the WebSocket connection between `TerminalPanel.tsx` and `terminalService.ts` is not wired correctly. Symptoms:
- Terminal renders but keystrokes do nothing
- No output appears
- Backend may not be spawning the PTY process
- WebSocket messages not routing to the terminal handler

---

## Architecture Overview

```
Browser (xterm.js)
    ↕  WebSocket ws://localhost:3001
Backend (wsServer.ts)
    ↕  message routing
terminalService.ts (node-pty)
    ↕  PTY spawn
/bin/bash or /bin/zsh (real shell)
```

```
AI Agent (agentService.ts)
    ↓  calls tool: terminal_execute(command)
terminalService.ts
    ↓  writes to PTY stdin
    ↓  waits for output (timeout)
    ↓  returns stdout/stderr to agent
    ↓  agent response streamed to ChatPanel
```

The **same PTY session** is shared between user and agent. When the agent runs a command, the user sees it in their terminal in real-time.

---

## Requirements

### 1. Fix `backend/src/services/terminalService.ts`

Complete rewrite/fix of the terminal service. Must implement:

```typescript
import * as pty from 'node-pty';
import os from 'os';

interface PtySession {
  id: string;
  pty: pty.IPty;
  cwd: string;
  outputBuffer: string;      // rolling last 8KB of output for agent reads
  outputListeners: Set<(data: string) => void>;
}

class TerminalService {
  private sessions = new Map<string, PtySession>();

  // Create a new PTY session
  // shell: /bin/zsh on macOS, /bin/bash on Linux
  // cwd: workspace root if open, os.homedir() otherwise
  create(sessionId: string, cwd?: string): PtySession

  // Write raw input (keystrokes) to PTY stdin
  write(sessionId: string, data: string): void

  // Resize PTY (called when terminal panel resizes)
  resize(sessionId: string, cols: number, rows: number): void

  // Kill PTY session and clean up
  kill(sessionId: string): void

  // Subscribe to PTY output for a session
  // Returns unsubscribe function
  onOutput(sessionId: string, cb: (data: string) => void): () => void

  // Execute a command and capture output (for AI agent)
  // Writes command + newline to PTY, collects output until prompt returns
  // Timeout: 30 seconds
  // Returns: { output: string, exitCode: number | null }
  async execute(sessionId: string, command: string): Promise<ExecuteResult>

  // Get all active sessions
  getSessions(): { id: string; cwd: string }[]

  // Kill all sessions (called on backend shutdown)
  killAll(): void
}

export const terminalService = new TerminalService();
```

**PTY spawn config:**
```typescript
const shell = os.platform() === 'win32' ? 'powershell.exe'
            : os.platform() === 'darwin' ? '/bin/zsh'
            : '/bin/bash';

const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: cwd || os.homedir(),
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
  }
});
```

**Output buffer (for agent):**
- Keep rolling last 8192 chars of output in `outputBuffer`
- Used by agent's `terminal_read` tool and `execute()` method

**PTY cleanup:**
```typescript
// On WebSocket disconnect — kill the session
// On process.exit — kill all sessions
process.on('exit', () => terminalService.killAll());
process.on('SIGTERM', () => terminalService.killAll());
```

### 2. Fix `backend/src/websocket/wsServer.ts`

The WebSocket message router must handle terminal messages correctly:

```typescript
// Message types the WS server must handle:

// Client → Server
{ type: 'terminal:create', sessionId: string, cwd?: string }
{ type: 'terminal:input',  sessionId: string, data: string }
{ type: 'terminal:resize', sessionId: string, cols: number, rows: number }
{ type: 'terminal:kill',   sessionId: string }

// Server → Client
{ type: 'terminal:output', sessionId: string, data: string }
{ type: 'terminal:created', sessionId: string, pid: number }
{ type: 'terminal:error',  sessionId: string, error: string }
{ type: 'terminal:exit',   sessionId: string, exitCode: number }

// File watcher (existing — do not break)
{ type: 'file:change', event: string, path: string }
{ type: 'tree:refresh' }
```

**Complete wsServer.ts handler:**
```typescript
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { terminalService } from '../services/terminalService';
import { watcherService } from '../services/watcherService';

export function attachWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientSessions = new Set<string>();      // sessions owned by this WS client
    const unsubscribers = new Map<string, () => void>();

    ws.on('message', (raw) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      switch (msg.type) {

        case 'terminal:create': {
          const { sessionId, cwd } = msg;
          try {
            const session = terminalService.create(sessionId, cwd);
            clientSessions.add(sessionId);

            // Stream PTY output → WebSocket
            const unsub = terminalService.onOutput(sessionId, (data) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'terminal:output', sessionId, data }));
              }
            });
            unsubscribers.set(sessionId, unsub);

            ws.send(JSON.stringify({
              type: 'terminal:created',
              sessionId,
              pid: session.pty.pid
            }));
          } catch (err: any) {
            ws.send(JSON.stringify({
              type: 'terminal:error',
              sessionId,
              error: err.message
            }));
          }
          break;
        }

        case 'terminal:input': {
          const { sessionId, data } = msg;
          terminalService.write(sessionId, data);
          break;
        }

        case 'terminal:resize': {
          const { sessionId, cols, rows } = msg;
          terminalService.resize(sessionId, cols, rows);
          break;
        }

        case 'terminal:kill': {
          const { sessionId } = msg;
          unsubscribers.get(sessionId)?.();
          unsubscribers.delete(sessionId);
          terminalService.kill(sessionId);
          clientSessions.delete(sessionId);
          break;
        }
      }
    });

    // Clean up all sessions for this client on disconnect
    ws.on('close', () => {
      for (const sessionId of clientSessions) {
        unsubscribers.get(sessionId)?.();
        terminalService.kill(sessionId);
      }
      clientSessions.clear();
      unsubscribers.clear();
    });
  });
}
```

### 3. Fix `frontend/src/components/terminal/TerminalPanel.tsx`

The terminal component must:
1. Use `dynamic` import for xterm (ssr: false)
2. On mount: open WebSocket, send `terminal:create`
3. Pipe xterm keystrokes → `terminal:input` WS messages
4. Pipe `terminal:output` WS messages → xterm write
5. Handle resize with ResizeObserver → `terminal:resize`
6. On unmount: send `terminal:kill`, close WS

```typescript
'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useIdeStore } from '@/store/ideStore';

// Dynamic import — xterm CANNOT be imported at module level
const XTermWrapper = dynamic(() => import('./XTermWrapper'), { ssr: false });

interface TerminalPanelProps {
  sessionId?: string;   // allows multiple terminal tabs
}

export default function TerminalPanel({ sessionId: propSessionId }: TerminalPanelProps) {
  const sessionId = propSessionId || 'default';
  const workspace = useIdeStore(s => s.workspace);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <XTermWrapper
        sessionId={sessionId}
        cwd={workspace?.path}
      />
    </div>
  );
}
```

### 4. Create `frontend/src/components/terminal/XTermWrapper.tsx`

This is the actual xterm.js component (kept separate so TerminalPanel can dynamic-import it cleanly):

```typescript
'use client';
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface XTermWrapperProps {
  sessionId: string;
  cwd?: string;
}

export default function XTermWrapper({ sessionId, cwd }: XTermWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create xterm instance
    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#1e1e1e',
        brightBlack: '#808080',
        // ... VS Code Dark+ colors
      },
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitRef.current = fitAddon;

    // 2. Open WebSocket
    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      // Request PTY session
      ws.send(JSON.stringify({ type: 'terminal:create', sessionId, cwd }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'terminal:output' && msg.sessionId === sessionId) {
        term.write(msg.data);
      }
      if (msg.type === 'terminal:error' && msg.sessionId === sessionId) {
        term.writeln(`\r\n\x1b[31mError: ${msg.error}\x1b[0m\r\n`);
      }
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[31mWebSocket connection failed. Is the backend running?\x1b[0m\r\n');
    };

    // 3. Pipe keystrokes → backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:input', sessionId, data }));
      }
    });

    // 4. Handle resize
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'terminal:resize',
          sessionId,
          cols: term.cols,
          rows: term.rows,
        }));
      }
    });
    observer.observe(containerRef.current);

    // 5. Cleanup
    return () => {
      observer.disconnect();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal:kill', sessionId }));
        ws.close();
      }
      term.dispose();
    };
  }, [sessionId, cwd]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full p-1"
      style={{ minHeight: 0 }}   // critical for flexbox sizing
    />
  );
}
```

### 5. Multi-Tab Terminal Support

Add terminal tab bar above the terminal panel. The IDE layout should support multiple terminal instances:

```
┌────────────────────────────────────────────────────┐
│ + bash  × │  bash 2  ×  │  [+]                     │  ← tab bar
├────────────────────────────────────────────────────┤
│                                                    │
│  user@mac custle-IDE % npm run dev                 │
│  > custle-ide@0.1.0 dev                            │
│  > next dev                                        │
│   ▲ Next.js 14.2.0                                 │
│  - Local: http://localhost:3000                    │
│  ✓ Ready in 2.1s                                   │
│  _                                                 │
└────────────────────────────────────────────────────┘
```

Create `frontend/src/components/terminal/TerminalTabs.tsx`:
```typescript
// Manages list of terminal sessions
// Each tab has: id (uuid), label ("bash", "bash 2", etc.)
// "+" button creates new session
// "×" button kills session
// Active tab shown in TerminalPanel
```

State in `ideStore.ts` (or new `terminalStore.ts`):
```typescript
interface TerminalTab {
  id: string;       // session ID (uuid)
  label: string;    // display name
}

terminalTabs: TerminalTab[]
activeTerminalId: string | null
addTerminalTab: () => void       // creates new tab with uuid
removeTerminalTab: (id) => void  // kills session + removes tab
setActiveTerminal: (id) => void
```

### 6. AI Agent Terminal Access

Add terminal tools to `backend/src/services/agentService.ts`.

The agent already has a tool loop. Add these three tools:

#### Tool: `terminal_execute`
```typescript
{
  name: 'terminal_execute',
  description: 'Execute a shell command in the user\'s terminal and return the output. Use this to run scripts, install packages, compile code, run tests, or any shell operation.',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute. Examples: "npm install", "ls -la", "python script.py"'
      },
      session_id: {
        type: 'string',
        description: 'Terminal session ID. Use "default" if only one terminal is open.'
      }
    },
    required: ['command']
  }
}
```

Handler:
```typescript
case 'terminal_execute': {
  const { command, session_id = 'default' } = input;
  
  // Ensure session exists (create if needed, with workspace cwd)
  let session = terminalService.getSessions().find(s => s.id === session_id);
  if (!session) {
    terminalService.create(session_id, workspaceService.getWorkspacePath());
    // Brief delay for shell to initialize
    await new Promise(r => setTimeout(r, 500));
  }
  
  const result = await terminalService.execute(session_id, command);
  return { output: result.output, exitCode: result.exitCode };
}
```

#### Tool: `terminal_read`
```typescript
{
  name: 'terminal_read',
  description: 'Read the current terminal output buffer (last 8KB). Use this to check command output, read logs, or observe terminal state without running a new command.',
  input_schema: {
    type: 'object',
    properties: {
      session_id: { type: 'string' }
    }
  }
}
```

Handler:
```typescript
case 'terminal_read': {
  const { session_id = 'default' } = input;
  const sessions = terminalService.getSessions();
  const session = sessions.find(s => s.id === session_id);
  if (!session) return { error: 'No terminal session found', output: '' };
  return { output: session.outputBuffer };
}
```

#### Tool: `terminal_write`
```typescript
{
  name: 'terminal_write',
  description: 'Send raw input to the terminal (like typing). Use terminal_execute for commands. Use terminal_write for interactive prompts (e.g. answering "y/n" questions, typing passwords, sending Ctrl+C).',
  input_schema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Raw input to send. Use \\r for Enter, \\u0003 for Ctrl+C, \\u0004 for Ctrl+D.'
      },
      session_id: { type: 'string' }
    },
    required: ['input']
  }
}
```

Handler:
```typescript
case 'terminal_write': {
  const { input, session_id = 'default' } = input;
  terminalService.write(session_id, input);
  return { success: true };
}
```

**Agent permissions summary:**
| Operation | Tool | Notes |
|-----------|------|-------|
| Run command | `terminal_execute` | Full shell — can run anything |
| Read terminal | `terminal_read` | Non-destructive output read |
| Interactive input | `terminal_write` | For prompts, Ctrl+C, etc. |
| Read files | `read_file` (existing) | File content |
| Write files | `write_file` (existing) | Full file write |
| Create files | `write_file` (existing) | Create if not exists |
| Update files | `write_file` (existing) | Overwrite content |

The agent has **full shell access** via `terminal_execute`. This means it can: `npm install`, `git commit`, `python script.py`, `mkdir`, `rm`, `curl` — anything the user can type. This is intentional for an AI coding agent.

### 7. Update `backend/src/routes/agent.ts`

Register the three new terminal tools in the tools array passed to the AI model:

```typescript
const tools = [
  // ... existing tools (read_file, write_file, list_files, etc.)
  terminalExecuteTool,
  terminalReadTool,
  terminalWriteTool,
];
```

Also expose a REST endpoint for triggering terminal execute (useful for testing):
```
POST /api/agent/terminal
  Body: { command: string, sessionId?: string }
  Response: { output: string, exitCode: number | null }
```

---

## Expected Outputs

```
backend/
  src/
    services/
      terminalService.ts   ← REWRITE: full PTY implementation
    websocket/
      wsServer.ts          ← FIX: complete message routing
    routes/
      agent.ts             ← MODIFY: add 3 terminal tools + /terminal endpoint

frontend/
  src/
    components/
      terminal/
        TerminalPanel.tsx  ← FIX: proper dynamic import + WS connection
        XTermWrapper.tsx   ← NEW: actual xterm.js component
        TerminalTabs.tsx   ← NEW: multi-tab management
    store/
      ideStore.ts          ← MODIFY: add terminalTabs, activeTerminalId state
```

---

## Test Criteria

| # | Scenario | Type | Expected |
|---|----------|------|----------|
| 1 | Create PTY session | WebSocket | Send `terminal:create` → receive `terminal:created` with pid |
| 2 | Execute command | WebSocket | Send `terminal:input` with `echo hello\r` → receive `terminal:output` containing "hello" |
| 3 | Resize terminal | WebSocket | Send `terminal:resize {cols:120,rows:40}` → no error, PTY resized |
| 4 | Kill session | WebSocket | Send `terminal:kill` → session removed from terminalService |
| 5 | PTY cleanup on WS close | WebSocket | Close WS connection → session auto-killed, no orphan process |
| 6 | Agent terminal_execute | curl | POST /api/agent/terminal `{command:"echo test"}` → `{output:"test\r\n"}` |
| 7 | Agent terminal_execute ls | curl | POST /api/agent/terminal `{command:"ls"}` → output contains file list |
| 8 | Terminal renders in browser | Playwright | Open IDE → terminal panel visible with cursor |
| 9 | User can type commands | Playwright | Click terminal, type `echo hello`, press Enter → "hello" appears |
| 10 | Multi-tab: add terminal | Playwright | Click "+" in terminal tab bar → new terminal tab opens |
| 11 | Multi-tab: close terminal | Playwright | Click "×" on tab → tab closes, other tab stays |
| 12 | Agent uses terminal in chat | Playwright | Ask agent "run ls in terminal" → agent executes, output shown |

---

## Critical Notes

### xterm.js — Dynamic Import Only
```typescript
// ✅ CORRECT
const XTermWrapper = dynamic(() => import('./XTermWrapper'), { ssr: false });

// ❌ WRONG — breaks Next.js SSR
import { Terminal } from '@xterm/xterm';
```
`XTermWrapper.tsx` is the isolation boundary. `TerminalPanel.tsx` never imports xterm directly.

### node-pty Native Compilation
```bash
# If install fails:
cd backend && npm rebuild node-pty

# On Apple Silicon Macs, may need:
npm install --target_arch=arm64 node-pty
```

### `execute()` Implementation Detail
The agent's `terminal_execute` needs to know when a command finishes. Strategy:
1. Write command to PTY
2. Listen to output buffer
3. Detect shell prompt reappearance (regex: `\$\s*$` or `%\s*$` or `>\s*$`)
4. If prompt detected → command done, return output
5. Timeout at 30s regardless

```typescript
async execute(sessionId: string, command: string): Promise<ExecuteResult> {
  const session = this.sessions.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  
  const startMarker = `__CUSTLE_START_${Date.now()}__`;
  const endMarker = `__CUSTLE_END_${Date.now()}__`;
  
  // Use markers to reliably delimit output
  const fullCommand = `echo "${startMarker}" && ${command} ; echo "${endMarker} $?"`;
  
  return new Promise((resolve) => {
    let capturing = false;
    let output = '';
    let exitCode: number | null = null;
    const timeout = setTimeout(() => resolve({ output, exitCode }), 30000);
    
    const unsub = this.onOutput(sessionId, (data) => {
      if (data.includes(startMarker)) { capturing = true; return; }
      if (data.includes(endMarker)) {
        const match = data.match(new RegExp(`${endMarker}\\s*(\\d+)`));
        exitCode = match ? parseInt(match[1]) : null;
        clearTimeout(timeout);
        unsub();
        resolve({ output: output.trim(), exitCode });
        return;
      }
      if (capturing) output += data;
    });
    
    session.pty.write(fullCommand + '\r');
  });
}
```

### WebSocket — One WS Per Terminal Tab
Each `XTermWrapper` instance opens its own WebSocket connection. This keeps terminal sessions isolated and avoids message routing complexity.

### Agent Output in Chat
When the agent calls `terminal_execute`, stream the command to the chat panel as a code block:
```
🖥️ Running: `npm install axios`

[terminal output appears here]

✓ Done (exit 0)
```
This gives the user visibility into what the agent is doing.

### PTY Session for Agent
The agent always uses session `"default"` unless specified. If the user has the terminal open in the UI with the same session ID, they will see the agent's commands appear in their terminal in real-time — which is the intended UX.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|---------|
| `node-pty` not found | `npm rebuild node-pty` in backend |
| xterm blank/not rendering | Check `containerRef.current` is non-null before `term.open()` |
| Terminal not sizing | `minHeight: 0` on container div is critical for flexbox |
| Commands echo twice | PTY already echoes — don't echo in frontend |
| Cursor not showing | `cursorBlink: true` + check theme has `cursor` color set |
| Agent hangs on execute | Marker-based approach avoids prompt detection issues |
| WS message routing breaks watcher | Keep file watcher messages in same `ws.on('message')` handler |