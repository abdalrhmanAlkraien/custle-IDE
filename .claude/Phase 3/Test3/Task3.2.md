# Test Scenarios - Task 3.2: AI Chat & Agent Panel

## Test Method
**Primary:** Playwright (frontend UI + integration)
**Secondary:** curl (backend API endpoints)

## Prerequisites
1. Backend server running on port 3001
2. Frontend dev server running on port 3000
3. Test workspace created at `/tmp/test-workspace` with sample files
4. Model configured and active (from Task 3.1)

## Backend API Tests (curl)

### Test 1: Chat Endpoint - Simple Request
**Endpoint:** `POST /api/agent/chat`
**Purpose:** Verify chat mode works without tools
**Command:**
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is TypeScript?"}
    ]
  }' | jq .
```
**Expected:**
- Status: 200
- Response contains: `{"response": "...explanation about TypeScript..."}`
- Response is non-empty string

### Test 2: Chat Endpoint - With File Context
**Endpoint:** `POST /api/agent/chat`
**Purpose:** Verify active file context is included
**Command:**
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Explain this file"}
    ],
    "activeFilePath": "src/test.ts",
    "activeFileContent": "function hello() { return \"world\"; }"
  }' | jq .
```
**Expected:**
- Status: 200
- Response references the function from the file context

### Test 3: Chat Endpoint - No Workspace Error
**Endpoint:** `POST /api/agent/chat`
**Purpose:** Verify error when no workspace open
**Setup:** Clear workspace first
**Command:**
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}' | jq .
```
**Expected:**
- Status: 400
- Response: `{"error": "No workspace open"}`

### Test 4: Agent Stop Endpoint
**Endpoint:** `POST /api/agent/stop`
**Purpose:** Verify stop endpoint responds
**Command:**
```bash
curl -X POST http://localhost:3001/api/agent/stop \
  -H "Content-Type: application/json" | jq .
```
**Expected:**
- Status: 200
- Response: `{"success": true, "message": "Stop signal sent"}`

### Test 5: Agent Run Endpoint - Invalid Request
**Endpoint:** `POST /api/agent/run`
**Purpose:** Verify validation
**Command:**
```bash
curl -X POST http://localhost:3001/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```
**Expected:**
- Status: 400
- Response: `{"error": "Message string required"}`

## Frontend UI Tests (Playwright)

### Test 6: ChatPanel Renders
**Purpose:** Verify ChatPanel loads correctly
**Steps:**
1. Navigate to http://localhost:3000
2. Wait for IDE to load
3. Verify ChatPanel is visible
4. Check "AI Assistant" title present
5. Check mode toggle buttons visible: "Chat" and "Agent"
6. Check Clear button visible

**Expected:**
- ChatPanel renders without errors
- All UI elements present
- Default mode is "Chat"

### Test 7: Mode Toggle Switch
**Purpose:** Verify switching between Chat and Agent modes
**Steps:**
1. Load IDE
2. Click "Agent" button in mode toggle
3. Verify Agent button is active (highlighted)
4. Verify Chat button is inactive
5. Click "Chat" button
6. Verify Chat button is active
7. Verify Agent button is inactive

**Expected:**
- Mode toggle works both ways
- Visual feedback shows active mode
- Placeholder text changes appropriately

### Test 8: Chat Message Send
**Purpose:** Verify sending a chat message
**Prerequisites:** Workspace open, model configured
**Steps:**
1. Load IDE
2. Type "Hello" in chat input
3. Press Enter
4. Wait for response

**Expected:**
- User message appears in chat
- User message shows correct avatar and alignment
- Loading indicator appears
- Assistant response appears
- Response is properly formatted
- Input is cleared after send

### Test 9: Chat with Code Block
**Purpose:** Verify code block rendering and insert button
**Prerequisites:** Workspace open, model configured
**Steps:**
1. Load IDE
2. Send message: "Show me a TypeScript function example"
3. Wait for response with code block
4. Locate code block in response
5. Verify syntax highlighting present
6. Verify "Insert" button appears on hover
7. Click "Insert" button

**Expected:**
- Code blocks render with proper styling
- Language tag visible
- Insert button appears on hover
- Insert button click logged to console (functionality placeholder)

### Test 10: Agent Mode - Tool Call Execution
**Purpose:** Verify agent executes tools and shows step cards
**Prerequisites:** Workspace open with `/tmp/test-workspace/test.txt`
**Steps:**
1. Load IDE
2. Switch to Agent mode
3. Send message: "Read the file test.txt and tell me what's in it"
4. Watch for agent step cards
5. Verify tool_call step appears (read_file)
6. Verify tool_result step appears
7. Verify final response appears

**Expected:**
- Agent step cards render
- Tool name visible (read_file)
- Tool args visible (path: test.txt)
- Tool result shows file content
- Final response references the file content
- Step cards are collapsible/expandable

### Test 11: Agent Step Card Interaction
**Purpose:** Verify agent step cards can be expanded/collapsed
**Prerequisites:** Agent has executed at least one tool call
**Steps:**
1. Locate an agent step card
2. Verify card is initially collapsed or expanded
3. Click card header
4. Verify card expands to show full args and result
5. Click header again
6. Verify card collapses

**Expected:**
- Click toggles expansion state
- Chevron icon rotates
- Full details visible when expanded
- Summary visible when collapsed

### Test 12: Clear Chat History
**Purpose:** Verify Clear button empties chat
**Prerequisites:** Chat has at least 2 messages
**Steps:**
1. Load IDE with existing chat messages
2. Click "Clear" button
3. Verify messages list is empty
4. Verify empty state placeholder appears

**Expected:**
- All messages removed
- Empty state shows: "Start a conversation" or "Start an agent task"
- Input remains functional

### Test 13: Input Auto-Grow
**Purpose:** Verify textarea grows with content
**Steps:**
1. Load IDE
2. Click in chat input
3. Type multiple lines (Shift+Enter for new lines)
4. Verify textarea height increases
5. Continue until max height reached (200px)
6. Verify textarea scrolls when exceeding max

**Expected:**
- Height auto-adjusts to content
- Max height is 200px
- Scroll appears when needed

### Test 14: Agent Stop Button
**Purpose:** Verify stop button appears during agent execution
**Prerequisites:** Model with slow responses
**Steps:**
1. Load IDE
2. Switch to Agent mode
3. Send complex agent task
4. While agent is running, verify "Stop Agent" button appears
5. Click "Stop Agent"
6. Verify agent execution stops
7. Verify input is re-enabled

**Expected:**
- Stop button visible during execution
- Stop button positioned above input
- Click aborts agent request
- Input re-enabled after stop

### Test 15: Multiple Message Thread
**Purpose:** Verify chat maintains context across messages
**Prerequisites:** Workspace open, model configured
**Steps:**
1. Load IDE
2. Send message: "I'm building a web app"
3. Wait for response
4. Send message: "What framework should I use?"
5. Wait for response
6. Verify second response acknowledges first message

**Expected:**
- Previous messages visible
- New messages appended to thread
- Context maintained (model references previous message)
- Auto-scroll to bottom on new messages

## Integration Tests

### Test 16: Chat with Active File Context
**Purpose:** Verify active file context is sent to backend
**Prerequisites:** Workspace open, sample TypeScript file open in editor
**Steps:**
1. Open a TypeScript file in editor
2. Go to ChatPanel
3. Send message: "Explain this code"
4. Monitor network request
5. Verify activeFilePath and activeFileContent sent
6. Verify response references the actual code

**Expected:**
- Active file detected from store
- File path and content included in request
- Response is context-aware

### Test 17: Agent Creates File
**Purpose:** Verify agent write_file tool creates actual files
**Prerequisites:** Workspace open at /tmp/test-workspace
**Steps:**
1. Switch to Agent mode
2. Send: "Create a file called hello.txt with content 'Hello World'"
3. Wait for agent completion
4. Check filesystem for /tmp/test-workspace/hello.txt
5. Verify file exists and contains "Hello World"

**Expected:**
- Agent calls write_file tool
- File created on disk
- File has correct content
- File watcher broadcasts update (if running)

### Test 18: Agent Runs Terminal Command
**Purpose:** Verify agent run_terminal tool executes commands
**Prerequisites:** Workspace open, npm installed
**Steps:**
1. Switch to Agent mode
2. Send: "Run the command 'node --version' and tell me the result"
3. Wait for agent completion
4. Verify agent step shows run_terminal
5. Verify result shows Node.js version

**Expected:**
- Agent calls run_terminal tool
- Command executes successfully
- Output captured and displayed
- Agent summarizes result

## Security Tests

### Test 19: Agent Workspace Root Validation
**Purpose:** Verify agent cannot access files outside workspace
**Prerequisites:** Workspace open at /tmp/test-workspace
**Steps:**
1. Switch to Agent mode
2. Send: "Read the file ../../etc/passwd"
3. Wait for agent completion
4. Verify agent tool fails
5. Verify error message about path validation

**Expected:**
- Agent attempts read_file with path ../../etc/passwd
- Tool execution returns error (path traversal blocked)
- Agent reports failure to user
- /etc/passwd is NOT accessed

### Test 20: Agent Cannot Execute Dangerous Commands
**Purpose:** Verify terminal commands are executed but sandboxed
**Note:** This tests that commands run in workspace context
**Prerequisites:** Workspace open at /tmp/test-workspace
**Steps:**
1. Switch to Agent mode
2. Send: "Run 'pwd' command"
3. Verify output shows /tmp/test-workspace (or subdirectory)

**Expected:**
- Commands execute in workspace root
- Working directory is workspace
- Commands cannot escape workspace context

## Regression Tests

### Test 21: File Explorer Still Works
**Purpose:** Verify chat panel doesn't break file operations
**Steps:**
1. Use chat panel (send message)
2. Go to File Explorer
3. Click on a file
4. Verify file opens in editor

**Expected:**
- File Explorer remains functional
- File operations unaffected by chat usage

### Test 22: Editor Still Works
**Purpose:** Verify editor functionality unaffected
**Steps:**
1. Open a file in editor
2. Make changes
3. Use chat panel
4. Return to editor
5. Verify changes preserved

**Expected:**
- Editor state preserved
- No conflicts between chat and editor

## Error Handling Tests

### Test 23: Chat Error Display
**Purpose:** Verify errors are displayed to user
**Prerequisites:** Backend stopped or model misconfigured
**Steps:**
1. Stop backend or configure invalid model
2. Send chat message
3. Wait for request to fail
4. Verify error message displayed in chat

**Expected:**
- Error message appears as assistant message
- Error is user-friendly
- Input re-enabled after error

### Test 24: Network Failure Handling
**Purpose:** Verify graceful handling of network issues
**Steps:**
1. Send chat message
2. Disconnect network mid-request
3. Wait for timeout
4. Verify error handling

**Expected:**
- Timeout occurs gracefully
- Error message displayed
- UI remains responsive
- Input re-enabled

## Performance Tests

### Test 25: SSE Streaming Performance
**Purpose:** Verify SSE events stream smoothly
**Prerequisites:** Agent mode, model configured
**Steps:**
1. Send agent task that generates multiple tool calls
2. Monitor SSE events
3. Verify events arrive in real-time (not all at once)
4. Verify UI updates smoothly without lag

**Expected:**
- Events stream progressively
- No UI blocking
- Smooth animations
- No memory leaks after multiple messages

## Summary
- **Total Tests:** 25
- **Backend API (curl):** 5
- **Frontend UI (Playwright):** 15
- **Integration:** 2
- **Security:** 2
- **Regression:** 2
- **Error Handling:** 2
- **Performance:** 1

## Success Criteria
- ✅ All 25 tests pass
- ✅ TypeScript builds with 0 errors
- ✅ No console errors during tests
- ✅ Security checks pass (workspace root validation)
- ✅ Agent tool execution creates real files/runs real commands
- ✅ SSE streaming works correctly
