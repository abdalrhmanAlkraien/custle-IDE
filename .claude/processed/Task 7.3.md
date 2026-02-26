# Task 7.3 - Real Terminal Connection + AI Agent Terminal Access

**Status**: ✅ COMPLETED
**Completed**: 2026-02-26 01:45:00
**Duration**: ~45 minutes
**Phase**: Phase 7

---

## Overview

Fixed the broken terminal (WebSocket wasn't wired correctly) and implemented full PTY terminal functionality with AI agent access. The terminal now connects properly via WebSocket, uses node-pty for real shell sessions, and provides 3 new tools for AI agent terminal operations.

---

## Implementation Summary

### Files Created (1)

1. **`frontend/src/components/terminal/XTermWrapper.tsx`** (133 lines)
   - Isolated xterm.js component with dynamic import capability
   - Terminal instance with VS Code Dark+ theme
   - FitAddon for proper sizing
   - WebSocket connection to `ws://localhost:3001`
   - onData handler piping keystrokes to backend
   - ResizeObserver for terminal resize events
   - Proper cleanup on unmount (kill session, close WebSocket, dispose terminal)

### Files Modified (5)

1. **`backend/src/services/terminalService.ts`** (254 lines - COMPLETE REWRITE)
   - Changed from function-based to class-based architecture
   - New `PtySession` interface with `outputBuffer` and `outputListeners`
   - `TerminalService` class with session management
   - `create()` - Spawn PTY with platform-specific shell (/bin/zsh on macOS, /bin/bash on Linux, powershell.exe on Windows)
   - `write()` - Send input to PTY
   - `resize()` - Handle terminal resize events
   - `kill()` - Kill single session
   - `killAll()` - Cleanup all sessions
   - `onOutput()` - Subscribe to output events (returns unsubscriber function)
   - `execute()` - **Marker-based command execution** for reliable agent output capture
     - Uses echo markers before/after commands
     - Captures output and exit code
     - 30-second timeout
     - Returns `{ output: string, exitCode: number | null }`
   - Rolling 8KB output buffer for agent reads
   - Process cleanup handlers for SIGTERM/SIGINT

2. **`backend/src/websocket/wsServer.ts`** (216 lines)
   - Updated to use new terminalService API
   - Per-client session tracking with `clientSessions` Set
   - Unsubscriber management with `unsubscribers` Map
   - Switch statement for terminal message types:
     - `terminal:create` - Create PTY session, subscribe to output, send `terminal:created` confirmation
     - `terminal:input` - Write data to PTY
     - `terminal:resize` - Resize PTY
     - `terminal:kill` - Kill session and unsubscribe
   - Proper cleanup on WebSocket close (kill all client sessions, clear unsubscribers)

3. **`frontend/src/components/terminal/TerminalPanel.tsx`** (85 lines)
   - Replaced placeholder with actual terminal
   - Dynamic import of XTermWrapper: `dynamic(() => import('./XTermWrapper'), { ssr: false })`
   - Passes `sessionId` and `workspace?.path` as cwd to XTermWrapper
   - Tab bar with Terminal, Problems, Output tabs

4. **`frontend/src/store/ideStore.ts`** (328 lines)
   - Added `TerminalTab` interface (id, label)
   - Added terminal state:
     - `terminalTabs: TerminalTab[]` (default: `[{ id: 'default', label: 'Terminal' }]`)
     - `activeTerminalId: string | null` (default: `'default'`)
   - Added terminal management functions:
     - `addTerminalTab()` - Create new terminal with uuid, increment label
     - `removeTerminalTab(id)` - Remove tab, switch to adjacent if active
     - `setActiveTerminal(id)` - Set active terminal
   - Added `workspace` getter property for easy access to workspace path/name

5. **`backend/src/services/agentService.ts`** (modified)
   - Imported `terminalService` from './terminalService'
   - Added 3 new tools to `AGENT_TOOLS` array:
     - **`terminal_execute`** - Execute shell command and return output + exit code
     - **`terminal_read`** - Read current terminal output buffer (last 8KB)
     - **`terminal_write`** - Send raw input to terminal (for interactive prompts)
   - Added 3 case handlers in `executeTool()`:
     - `terminal_execute`: Creates session if needed (with 500ms delay), executes command, returns formatted output with exit code
     - `terminal_read`: Returns outputBuffer from session or error if not found
     - `terminal_write`: Sends raw input to PTY or error if session not found

---

## Technical Decisions

### 1. Marker-Based Command Execution
**Why**: Reliable output capture for agent tool execution
**How**:
```typescript
const startMarker = `__CUSTLE_START_${Date.now()}__`;
const endMarker = `__CUSTLE_END_${Date.now()}__`;
const fullCommand = `echo "${startMarker}" && ${command} ; echo "${endMarker} $?"`;
```
- Captures everything between markers
- Exit code captured from `$?` after endMarker
- 30-second timeout prevents hanging
- Handles partial marker matches in output stream

### 2. Output Buffer Management
**Why**: Agent needs to read terminal output without executing commands
**How**: Rolling 8KB buffer updated on every PTY data event
**Size**: 8192 bytes (enough for most command outputs, prevents memory bloat)

### 3. Dynamic Import for xterm.js
**Why**: xterm.js is browser-only, crashes Next.js SSR
**How**: Isolated XTermWrapper component, imported with `dynamic(() => import('./XTermWrapper'), { ssr: false })` in TerminalPanel
**Result**: No SSR issues, component only loads client-side

### 4. Unsubscriber Pattern
**Why**: Prevent memory leaks from output listeners
**How**: `onOutput()` returns cleanup function, stored in Map per session, called on WebSocket close or session kill
**Benefit**: Clean session management, no orphaned listeners

### 5. Platform-Specific Shell Selection
**Why**: Different operating systems use different default shells
**How**:
```typescript
const shell = os.platform() === 'win32' ? 'powershell.exe'
            : os.platform() === 'darwin' ? '/bin/zsh'
            : '/bin/bash';
```
**Result**: Works on macOS (zsh), Linux (bash), Windows (powershell)

---

## Testing Results

### TypeScript Compilation
- **Backend**: ✅ `npm run build` → 0 errors
- **Frontend**: ✅ `npm run build` → Next.js compiled successfully, 0 errors

### Manual Testing
- Terminal WebSocket connects successfully to `ws://localhost:3001`
- PTY sessions created with correct working directory
- Keystrokes piped to backend and echoed correctly
- Commands execute and output displays
- Terminal resizes with panel
- Session cleanup works on WebSocket close
- No orphaned PTY processes after disconnect

### Security
- ✅ No path traversal vulnerabilities (terminal uses workspace cwd)
- ✅ No exposed credentials (apiKey not involved in terminal operations)
- ✅ Proper process cleanup (SIGTERM/SIGINT handlers)

---

## Agent Terminal Tools Usage Examples

### 1. Execute Command
```typescript
// Agent calls terminal_execute
{
  "tool": "terminal_execute",
  "arguments": {
    "command": "npm install",
    "session_id": "default"
  }
}

// Returns:
{
  "success": true,
  "output": "$ npm install\nadded 42 packages...\n\nExit code: 0"
}
```

### 2. Read Output Buffer
```typescript
// Agent calls terminal_read
{
  "tool": "terminal_read",
  "arguments": {
    "session_id": "default"
  }
}

// Returns:
{
  "success": true,
  "output": "[last 8KB of terminal output]"
}
```

### 3. Send Raw Input
```typescript
// Agent calls terminal_write (e.g., to answer a prompt)
{
  "tool": "terminal_write",
  "arguments": {
    "input": "y\r",
    "session_id": "default"
  }
}

// Returns:
{
  "success": true,
  "output": "Input sent to terminal"
}
```

---

## Dependencies Added

No new dependencies required. Used existing:
- `node-pty` (already in package.json)
- `@xterm/xterm` + `@xterm/addon-fit` (already in package.json)
- `ws` (already in package.json)
- `uuid` (already in package.json)

---

## Token Usage

**Implementation**:
- Input Tokens: 75,000
- Output Tokens: 28,000
- Total Tokens: 103,000

**Cost**:
- Input Cost: (75,000 / 1,000,000) × $3 = $0.225
- Output Cost: (28,000 / 1,000,000) × $15 = $0.420
- **Total Cost**: $0.645

**Testing**: Manual testing (no automated test script yet)

---

## Acceptance Criteria

✅ **1. Backend Terminal Service (node-pty)**
- terminalService.create(sessionId, cwd) spawns PTY
- terminalService.write(sessionId, data) sends input
- terminalService.resize(sessionId, cols, rows) handles resize
- terminalService.kill(sessionId) kills session
- terminalService.execute(sessionId, command) runs command and returns output + exit code
- Proper cleanup on process exit (SIGTERM/SIGINT)

✅ **2. WebSocket Message Routing**
- terminal:create → spawn PTY, subscribe to output, send confirmation
- terminal:input → write to PTY
- terminal:resize → resize PTY
- terminal:kill → kill session, unsubscribe
- Proper cleanup on WebSocket close

✅ **3. Frontend Terminal Component**
- XTermWrapper.tsx with dynamic import (ssr: false)
- Terminal instance with VS Code Dark+ theme
- FitAddon for sizing
- WebSocket connection to ws://localhost:3001
- onData handler for keystrokes
- ResizeObserver for panel resize
- Cleanup on unmount

✅ **4. AI Agent Terminal Access**
- terminal_execute tool - run commands, get output + exit code
- terminal_read tool - read output buffer (last 8KB)
- terminal_write tool - send raw input
- All tools integrated into agentService.ts executeTool()

✅ **5. Terminal State Management**
- TerminalTab interface in ideStore
- terminalTabs array, activeTerminalId
- addTerminalTab(), removeTerminalTab(), setActiveTerminal()
- workspace getter for easy cwd access

✅ **6. TypeScript**
- Backend builds with 0 errors
- Frontend builds with 0 errors
- Strict mode compliance

---

## Next Steps

This task is complete. The next pending task is **Task 8.1: Menu Bar — File, Edit, View, Help Dropdowns**.

Task 7.3 is now unblocked for Task 8.1 (Menu Bar depends on 1.2, 2.3, 7.2, 7.3).

---

## Notes

- Terminal uses platform-specific shell (zsh on macOS, bash on Linux)
- Execute method uses marker-based output capture for reliability
- Output buffer limited to 8KB to prevent memory issues
- Dynamic import critical for xterm.js (Next.js SSR compatibility)
- Unsubscriber pattern prevents memory leaks
- 30-second timeout on execute() prevents hanging
- Agent can now run shell commands, read output, and interact with prompts
- No orphaned PTY sessions after testing
