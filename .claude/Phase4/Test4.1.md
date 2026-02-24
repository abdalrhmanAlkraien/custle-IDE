# Test Scenarios - Task 4.1: Real Terminal with node-pty

## Test Method
**Primary:** WebSocket (terminal I/O testing)
**Secondary:** curl (health check)

## Prerequisites
1. Backend server running on port 3001
2. Frontend dev server running on port 3000 (optional, for UI tests)
3. node-pty installed and working
4. WebSocket test client ready

## Backend WebSocket Tests

### Test 1: Terminal Session Creation
**Purpose:** Verify terminal session is created via WebSocket
**Method:** WebSocket client
**Steps:**
1. Connect to `ws://localhost:3001`
2. Send message:
```json
{
  "type": "terminal:create",
  "sessionId": "test-term-1",
  "cwd": "/tmp",
  "cols": 80,
  "rows": 24
}
```
**Expected:**
- Response received: `{"type": "terminal:created", "sessionId": "test-term-1", "cwd": "/tmp"}`
- No errors

### Test 2: Terminal Output Received
**Purpose:** Verify terminal outputs data correctly
**Method:** WebSocket client
**Steps:**
1. Create terminal session (Test 1)
2. Send input command:
```json
{
  "type": "terminal:input",
  "sessionId": "test-term-1",
  "data": "echo hello\n"
}
```
3. Listen for output messages
**Expected:**
- Receive one or more `{"type": "terminal:output", "sessionId": "test-term-1", "data": "..."}` messages
- Output data contains "hello"
- Terminal prompt appears after command execution

### Test 3: Terminal Command Execution
**Purpose:** Verify real commands execute
**Method:** WebSocket client
**Steps:**
1. Create terminal session
2. Send command: `node --version\n`
3. Capture output
**Expected:**
- Output contains Node.js version (e.g., "v20.x.x")
- No errors

### Test 4: Terminal Resize
**Purpose:** Verify terminal resize works without garbled output
**Method:** WebSocket client
**Steps:**
1. Create terminal session (80x24)
2. Send resize message:
```json
{
  "type": "terminal:resize",
  "sessionId": "test-term-1",
  "cols": 120,
  "rows": 30
}
```
3. Send command: `tput cols; tput lines\n`
4. Capture output
**Expected:**
- Output shows "120" and "30"
- No errors or garbled text

### Test 5: Terminal Kill
**Purpose:** Verify terminal session can be killed
**Method:** WebSocket client
**Steps:**
1. Create terminal session
2. Send kill message:
```json
{
  "type": "terminal:kill",
  "sessionId": "test-term-1"
}
```
**Expected:**
- Receive `{"type": "terminal:killed", "sessionId": "test-term-1"}` response
- Session no longer accepts input

### Test 6: Multiple Terminal Sessions
**Purpose:** Verify multiple terminals work simultaneously
**Method:** WebSocket client
**Steps:**
1. Create session "term-1" with `cwd: "/tmp"`
2. Create session "term-2" with `cwd: "/Users"`
3. Send `pwd\n` to term-1
4. Send `pwd\n` to term-2
5. Capture outputs
**Expected:**
- term-1 outputs "/tmp" (or subdirectory)
- term-2 outputs "/Users" (or subdirectory)
- No cross-talk between sessions

### Test 7: WebSocket Disconnect Cleanup
**Purpose:** Verify PTY sessions are killed when WebSocket closes
**Method:** WebSocket client + manual verification
**Steps:**
1. Connect WebSocket and create 2 terminal sessions
2. Send commands to keep them active
3. Close WebSocket connection
4. Reconnect and try to send input to old sessions
**Expected:**
- Old sessions return error "Session not found"
- No orphaned PTY processes (verify with `ps aux | grep node-pty` if possible)

### Test 8: Terminal Session Not Found
**Purpose:** Verify error handling for invalid session ID
**Method:** WebSocket client
**Steps:**
1. Send input to non-existent session:
```json
{
  "type": "terminal:input",
  "sessionId": "does-not-exist",
  "data": "test\n"
}
```
**Expected:**
- Receive `{"type": "terminal:error", "sessionId": "does-not-exist", "error": "Session not found"}`

### Test 9: Terminal Exit Handling
**Purpose:** Verify terminal exit event is sent
**Method:** WebSocket client
**Steps:**
1. Create terminal session
2. Send command: `exit\n`
3. Wait for exit event
**Expected:**
- Receive `{"type": "terminal:exit", "sessionId": "test-term-1", "exitCode": 0}` (or similar)
- Session is removed from active sessions

## TypeScript Build Tests

### Test 10: Backend TypeScript Builds
**Command:** `cd backend && npm run build`
**Expected:**
- Exit code: 0
- Output: "tsc" completes without errors
- No TypeScript compilation errors

### Test 11: Frontend TypeScript Builds
**Command:** `cd frontend && npm run build`
**Expected:**
- Exit code: 0
- Output: Next.js build completes successfully
- No TypeScript compilation errors
- XTerminal component uses dynamic import (verified in code)

## Integration Tests (Optional - Requires Frontend)

### Test 12: Terminal Panel Opens
**Purpose:** Verify terminal panel displays in IDE
**Steps:**
1. Open IDE at http://localhost:3000
2. Click Terminal tab in bottom panel
**Expected:**
- Terminal panel opens
- Real shell prompt appears
- No JavaScript errors in console

### Test 13: Terminal Input Works
**Purpose:** Verify typing in terminal works
**Steps:**
1. Open terminal panel
2. Type: `ls -la`
3. Press Enter
**Expected:**
- Directory listing appears
- Output formatted correctly

### Test 14: New Terminal Button
**Purpose:** Verify creating new terminal tabs
**Steps:**
1. Open terminal panel (1 default terminal)
2. Click "+" button
3. Verify new tab appears
**Expected:**
- New terminal tab created ("Terminal 2")
- New terminal session is independent
- Both terminals functional

### Test 15: Close Terminal Tab
**Purpose:** Verify closing terminal tabs
**Steps:**
1. Create 2 terminals
2. Hover over Terminal 1 tab
3. Click "X" button
**Expected:**
- Terminal 1 tab closed
- Terminal 2 still open
- Last terminal cannot be closed

## Security Tests

### Test 16: Terminal Working Directory
**Purpose:** Verify terminal starts in workspace directory
**Method:** WebSocket client
**Steps:**
1. Create session with `cwd: "/tmp/test-workspace"`
2. Send command: `pwd\n`
**Expected:**
- Output shows "/tmp/test-workspace" or subdirectory
- Terminal doesn't start in random directory

## Performance Tests

### Test 17: Terminal Output Streaming
**Purpose:** Verify large outputs stream correctly
**Method:** WebSocket client
**Steps:**
1. Create terminal session
2. Send command: `cat /usr/share/dict/words\n` (or large file)
3. Capture all output messages
**Expected:**
- Output arrives in multiple chunks
- All data received without loss
- No significant lag (< 500ms total)

## Summary
- **Total Tests:** 17
- **WebSocket:** 9
- **TypeScript Builds:** 2
- **Integration (Optional):** 4
- **Security:** 1
- **Performance:** 1

## Success Criteria
- ✅ All 11 automated tests pass (9 WebSocket + 2 TypeScript)
- ✅ TypeScript errors: 0
- ✅ PTY sessions cleaned up on WebSocket close
- ✅ Multiple terminal sessions work
- ✅ XTerminal uses dynamic import
- ✅ Terminal resize works without garbled output
