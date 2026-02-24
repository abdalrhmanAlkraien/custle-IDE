# Custle IDE — Test Scenarios Framework

**Purpose**: Automated test generation and execution for each task using Playwright + curl + WebSocket clients.

**Workflow**: Complete task → Generate test scenarios → Execute tests → Verify results → Mark complete

---

## Testing Workflow

```
1. Complete Task Implementation
   ↓
2. Verify TypeScript builds clean (backend + frontend)
   ↓
3. Read Task Definition (.claude/PhaseX/Task X.Y.md)
   ↓
4. Generate Test Scenarios (.claude/TestX/Task X.Y.md)
   ↓
5. Execute All Test Scenarios
   ↓
6. Record Test Results
   ↓
7. All Pass? → YES → Mark ✅ COMPLETED
              → NO  → Fix Issues → Re-test → Repeat
```

---

## Test Types by Task

Custle IDE has three categories of test:

| Type | Tool | Used For |
|------|------|----------|
| **Backend API** | curl | File routes, Git routes, Model routes |
| **WebSocket** | ws Node.js client | Terminal sessions, file watcher messages |
| **Frontend UI** | Playwright | Layout, file tree, editor, chat, git panel |

Most tasks use a combination. See the per-task breakdown below.

---

## Test File Naming Convention

| File Type | Location | Format |
|-----------|----------|--------|
| Task Definition | `.claude/PhaseX/` | `Task X.Y.md` |
| Test Scenarios | `.claude/TestX/` | `Task X.Y.md` |
| Test Results | `.claude/processed/` | `Task X.Y - Test Results.md` |

---

## TypeScript Build Verification (Required Before All Tests)

Both servers must build cleanly before any test execution:

```bash
# Backend must compile with 0 errors
cd backend && npm run build
# Expected: "Found 0 errors."

# Frontend must compile with 0 errors
cd frontend && npm run build
# Expected: "Compiled successfully."
```

If either fails → fix TypeScript errors first → rebuild → then proceed to tests.

---

## Test File Template

````markdown
# Test Scenarios: Task X.Y — [Task Name]

**Task Definition**: `.claude/PhaseX/Task X.Y.md`
**Generated**: [Timestamp]
**Status**: ⏳ Not Executed

---

## Prerequisites

- [ ] `cd backend && npm run build` → 0 errors
- [ ] `cd frontend && npm run build` → 0 errors
- [ ] Backend running: `http://localhost:3001`
- [ ] Frontend running: `http://localhost:3000`
- [ ] Workspace open: `/path/to/test/workspace`
- [ ] Previous tasks completed: [list]

---

## Scenario 1: [Primary Functionality]

**Type**: curl | WebSocket | Playwright
**Purpose**: [What this tests]

**Steps**:
1. [Action]
2. [Action]
3. Verify [Expected Result]

**Command / Code**:
```bash
# curl example
curl -s -X POST http://localhost:3001/api/workspace/open \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/test-workspace"}' | jq .
```

**Expected Result**:
```json
{
  "path": "/tmp/test-workspace",
  "name": "test-workspace",
  "tree": [...]
}
```

**Checks**:
- ✅ Status 200
- ✅ Response contains `path` field
- ✅ No console errors

**Result**: [ ] Pass / [ ] Fail
**Notes**:

---

## Inspection Points

### Console (Frontend)
- [ ] No errors on load
- [ ] No unhandled promise rejections
- [ ] No React warnings

### Network
- [ ] Correct endpoint called
- [ ] Correct HTTP method
- [ ] Expected status code
- [ ] Response shape matches types

### Security
- [ ] Path traversal returns 403
- [ ] apiKey never in response

---

## Success Criteria

- [ ] All scenarios pass
- [ ] 0 console errors
- [ ] 0 unexpected network errors
- [ ] Security checks pass
- [ ] TypeScript still builds clean after implementation

---

## Results Summary

**Total Scenarios**: 0
**Passed**: 0
**Failed**: 0
**Pass Rate**: 0%
````

---

## Per-Task Test Types

### Task 1.1 — Project Scaffold & Dependencies
**Test Type**: Shell commands

```bash
# Verify monorepo structure
ls backend/src/index.ts frontend/src/app/page.tsx

# Verify key packages installed
cat backend/package.json | grep '"ws"\|"node-pty"\|"simple-git"\|"chokidar"'
cat frontend/package.json | grep '"@monaco-editor"\|"@xterm"\|"zustand"\|"react-resizable-panels"'

# Verify both servers start
cd backend && npm run dev &
cd frontend && npm run dev &
sleep 5

# Backend health
curl -s http://localhost:3001/api/workspace | jq .
# Expected: null (no workspace open yet) or {}

# Frontend loads
curl -s http://localhost:3000 | grep -c "html"
# Expected: 1
```

---

### Task 1.2 — IDE Shell Layout & State Store
**Test Type**: Playwright

```javascript
// Scenario 1: IDE Shell renders
await playwright_navigate({ url: 'http://localhost:3000' });
await page.waitForLoadState('networkidle');

// Verify 4 main zones exist
const activityBar = page.locator('[data-panel-id="activity-bar"]');
const sidebar = page.locator('[data-panel-id="sidebar"]');
const editor = page.locator('[data-panel-id="editor"]');
const chat = page.locator('[data-panel-id="chat"]');

await expect(activityBar).toBeVisible();
await expect(sidebar).toBeVisible();
await expect(editor).toBeVisible();
await expect(chat).toBeVisible();

// Scenario 2: Panels are resizable
const resizeHandle = page.locator('[data-panel-resize-handle-id]').first();
await expect(resizeHandle).toBeVisible();

// Scenario 3: Status bar and title bar present
await expect(page.locator('[data-testid="title-bar"]')).toBeVisible();
await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();

// Scenario 4: No console errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await playwright_navigate({ url: 'http://localhost:3000' });
await page.waitForLoadState('networkidle');
console.log('Console errors:', errors.length === 0 ? '✅ None' : `❌ ${errors}`);
```

---

### Task 2.1 — Backend File System API
**Test Type**: curl (primary) + WebSocket (watcher)

```bash
# Setup: create test workspace
mkdir -p /tmp/neural-test/src
echo "const x = 1;" > /tmp/neural-test/src/index.ts
echo "# Test" > /tmp/neural-test/README.md

# Scenario 1: Open workspace
curl -s -X POST http://localhost:3001/api/workspace/open \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/neural-test"}' | jq '{path,name,treeCount: (.tree | length)}'
# Expected: { path: "/tmp/neural-test", name: "neural-test", treeCount: 2 }

# Scenario 2: Read file
curl -s "http://localhost:3001/api/files/read?path=/tmp/neural-test/src/index.ts" | jq .
# Expected: { content: "const x = 1;", language: "typescript", size: 14 }

# Scenario 3: Write file
curl -s -X POST http://localhost:3001/api/files/write \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/neural-test/src/index.ts","content":"const x = 2;"}' | jq .
# Expected: { success: true }

# Scenario 4: Create file
curl -s -X POST http://localhost:3001/api/files/create \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/neural-test/src/utils.ts","type":"file"}' | jq .
# Expected: { success: true }

# Scenario 5: Delete file
curl -s -X DELETE http://localhost:3001/api/files/delete \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/neural-test/src/utils.ts"}' | jq .
# Expected: { success: true }

# Scenario 6: Search files
curl -s "http://localhost:3001/api/files/search?q=const" | jq .
# Expected: array with matches in index.ts

# SECURITY TEST — must return 403
curl -s "http://localhost:3001/api/files/read?path=../../etc/passwd" | jq .
# Expected: { "error": "Access denied" } with HTTP 403

curl -v "http://localhost:3001/api/files/read?path=../../etc/passwd" 2>&1 | grep "< HTTP"
# Expected: < HTTP/1.1 403

# WebSocket: file watcher broadcasts
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001');
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'file:change' || msg.type === 'tree:refresh') {
    console.log('✅ Watcher broadcast received:', msg.type);
    ws.close();
    process.exit(0);
  }
});
ws.on('open', () => {
  // Trigger a file change
  setTimeout(() => {
    require('fs').writeFileSync('/tmp/neural-test/README.md', '# Updated');
  }, 500);
  // Timeout if no message
  setTimeout(() => { console.log('❌ No watcher event received'); process.exit(1); }, 5000);
});
"
```

---

### Task 2.2 — File Explorer Sidebar
**Test Type**: Playwright

```javascript
// Scenario 1: Open workspace via sidebar
await playwright_navigate({ url: 'http://localhost:3000' });
await page.waitForLoadState('networkidle');

// Click "Open Folder" button
await playwright_click({ selector: '[data-testid="open-workspace-btn"]' });

// Scenario 2: File tree renders after opening workspace
// (assumes workspace already open via API or previous test)
const fileTree = page.locator('[data-testid="file-tree"]');
await expect(fileTree).toBeVisible();

// Verify tree items exist
const treeItems = page.locator('[data-testid="tree-item"]');
await expect(treeItems).toHaveCountGreaterThan(0);

// Scenario 3: Click file opens in editor
await playwright_click({ selector: '[data-testid="tree-item"][data-path*="index.ts"]' });
const editorContent = page.locator('.monaco-editor');
await expect(editorContent).toBeVisible({ timeout: 5000 });

// Scenario 4: Right-click context menu
await playwright_click({ 
  selector: '[data-testid="tree-item"]',
  button: 'right'
});
const contextMenu = page.locator('[data-testid="context-menu"]');
await expect(contextMenu).toBeVisible();
await expect(contextMenu).toContainText('New File');
await expect(contextMenu).toContainText('Delete');
await expect(contextMenu).toContainText('Rename');

// Scenario 5: Create new file via context menu
await playwright_click({ selector: '[data-testid="context-menu-new-file"]' });
const renameInput = page.locator('[data-testid="inline-rename-input"]');
await expect(renameInput).toBeVisible();
await playwright_fill({ selector: '[data-testid="inline-rename-input"]', value: 'test-new.ts' });
await page.keyboard.press('Enter');

// Verify file appears in tree
await expect(page.locator('[data-path*="test-new.ts"]')).toBeVisible();

// Scenario 6: Live update — external file change reflects in tree
// (created by watcher — covered by Task 2.1 watcher test)
```

---

### Task 2.3 — Monaco Editor + Tabs + Save
**Test Type**: Playwright

```javascript
// Scenario 1: File opens in Monaco tab
await playwright_navigate({ url: 'http://localhost:3000' });
// Open workspace via API first
await page.evaluate(async () => {
  await fetch('http://localhost:3001/api/workspace/open', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ path: '/tmp/neural-test' })
  });
});
await page.reload();

// Click file
await playwright_click({ selector: '[data-path*="index.ts"]' });

// Monaco editor renders
const monaco = page.locator('.monaco-editor');
await expect(monaco).toBeVisible({ timeout: 5000 });

// Tab appears
const tab = page.locator('[data-testid="editor-tab"]').first();
await expect(tab).toBeVisible();
await expect(tab).toContainText('index.ts');

// Scenario 2: Typing marks tab as dirty
await monaco.click();
await page.keyboard.press('End');
await page.keyboard.type(' // edit');

// Dirty indicator (●) appears
const dirtyIndicator = page.locator('[data-testid="tab-dirty"]');
await expect(dirtyIndicator).toBeVisible();

// Scenario 3: Ctrl+S saves file and clears dirty state
await page.keyboard.press('Control+s');
await page.waitForTimeout(500);

// Dirty indicator gone
await expect(dirtyIndicator).not.toBeVisible();

// Verify file was actually written
const result = await page.evaluate(async () => {
  const r = await fetch('http://localhost:3001/api/files/read?path=/tmp/neural-test/src/index.ts');
  return r.json();
});
console.log('File saved:', result.content.includes('// edit') ? '✅' : '❌');

// Scenario 4: Multiple tabs work
await playwright_click({ selector: '[data-path*="README.md"]' });
const tabs = page.locator('[data-testid="editor-tab"]');
await expect(tabs).toHaveCountGreaterThan(1);

// Scenario 5: Close tab with X button
await playwright_click({ selector: '[data-testid="tab-close-btn"]' });
await expect(tabs).toHaveCount(1);

// Scenario 6: Custom Monaco theme (dark purple)
const editorBg = await page.evaluate(() => {
  const el = document.querySelector('.monaco-editor');
  return window.getComputedStyle(el).backgroundColor;
});
// Should not be white (#fff) — should be dark
console.log('Monaco theme dark:', !editorBg.includes('255, 255, 255') ? '✅' : '❌');
```

---

### Task 3.1 — Model Config & Connection
**Test Type**: curl + Playwright

```bash
# Scenario 1: Save model config
curl -s -X POST http://localhost:3001/api/model/config \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:18000",
    "name": "test-model",
    "apiKey": "test-key-123",
    "provider": "openai-compatible",
    "maxTokens": 2048,
    "temperature": 0.7
  }' | jq .
# Expected: { success: true }

# Scenario 2: Get config — apiKey must NOT be in response
curl -s http://localhost:3001/api/model/config | jq .
# Expected: { url, name, provider, maxTokens, temperature } — NO apiKey field!

# Verify apiKey is absent
curl -s http://localhost:3001/api/model/config | jq 'has("apiKey")'
# Expected: false

# Scenario 3: Test connection endpoint returns ok/error shape
curl -s -X POST http://localhost:3001/api/model/test \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:18000","name":"test","apiKey":"","provider":"openai-compatible","maxTokens":1000,"temperature":0.7}' | jq '{ok,latency}'
# Expected: { ok: true, latency: <number> } or { ok: false, error: "..." }
# (ok:false is acceptable if no model running — shape must be correct)
```

```javascript
// Playwright: Model config modal
await playwright_navigate({ url: 'http://localhost:3000' });

// Open model config modal
await playwright_click({ selector: '[data-testid="model-config-btn"]' });

const modal = page.locator('[data-testid="model-config-modal"]');
await expect(modal).toBeVisible();

// Fill in config
await playwright_fill({ selector: '[data-testid="model-url-input"]', value: 'http://localhost:18000' });
await playwright_fill({ selector: '[data-testid="model-name-input"]', value: 'test-model' });

// Test connection button
await playwright_click({ selector: '[data-testid="test-connection-btn"]' });

// Shows status (ok or error — either is fine, shape must render)
const connectionStatus = page.locator('[data-testid="connection-status"]');
await expect(connectionStatus).toBeVisible({ timeout: 15000 });
console.log('Connection status shows:', await connectionStatus.textContent());

// apiKey field is a password input (never readable)
const apiKeyInput = page.locator('[data-testid="api-key-input"]');
await expect(apiKeyInput).toHaveAttribute('type', 'password');
```

---

### Task 3.2 — AI Chat & Agent Panel
**Test Type**: Playwright

```javascript
// Prerequisite: model must be configured and running
// These tests verify UI behavior — model responses may vary

// Scenario 1: Chat panel renders
await playwright_navigate({ url: 'http://localhost:3000' });
const chatPanel = page.locator('[data-testid="chat-panel"]');
await expect(chatPanel).toBeVisible();

// Mode toggle: chat / agent
const modeToggle = page.locator('[data-testid="chat-mode-toggle"]');
await expect(modeToggle).toBeVisible();

// Input field
const chatInput = page.locator('[data-testid="chat-input"]');
await expect(chatInput).toBeVisible();
await expect(chatInput).toBeEnabled();

// Scenario 2: Send message shows user bubble
await playwright_fill({ selector: '[data-testid="chat-input"]', value: 'Hello' });
await page.keyboard.press('Enter');

const userMessage = page.locator('[data-testid="chat-message-user"]').last();
await expect(userMessage).toBeVisible();
await expect(userMessage).toContainText('Hello');

// Scenario 3: Loading state shows while waiting for response
const loadingIndicator = page.locator('[data-testid="chat-loading"]');
// Loading should appear (may disappear quickly if model is fast)
await expect(loadingIndicator).toBeVisible({ timeout: 3000 }).catch(() => {
  console.log('⚠️ Loading indicator too fast to catch (fast model)');
});

// Scenario 4: Stop button cancels streaming
await playwright_fill({ selector: '[data-testid="chat-input"]', value: 'Write 1000 words about anything' });
await page.keyboard.press('Enter');
await page.waitForTimeout(500);

const stopBtn = page.locator('[data-testid="chat-stop-btn"]');
if (await stopBtn.isVisible()) {
  await playwright_click({ selector: '[data-testid="chat-stop-btn"]' });
  console.log('✅ Stop button works');
} else {
  console.log('⚠️ Stop button not visible (response already complete)');
}

// Scenario 5: Switch to agent mode
await playwright_click({ selector: '[data-testid="chat-mode-toggle"]' });
const agentMode = page.locator('[data-testid="chat-mode-agent"]');
await expect(agentMode).toBeVisible();

// Scenario 6: Agent tool steps render (if model runs)
// AgentStepCard should appear when agent calls tools
await playwright_fill({ selector: '[data-testid="chat-input"]', value: 'List the files in the workspace' });
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);

// Check if agent steps appeared (may or may not depending on model)
const agentSteps = page.locator('[data-testid="agent-step-card"]');
const stepCount = await agentSteps.count();
console.log('Agent step cards rendered:', stepCount > 0 ? `✅ (${stepCount} steps)` : '⚠️ 0 (model may not have used tools)');
```

---

### Task 4.1 — Real Terminal with node-pty
**Test Type**: WebSocket (primary) + Playwright

```javascript
// WebSocket terminal test
const ws = new WebSocket('ws://localhost:3001');
const sessionId = 'test-session-' + Date.now();

ws.on('open', () => {
  // Create terminal session
  ws.send(JSON.stringify({
    type: 'terminal:create',
    sessionId,
    cwd: '/tmp'
  }));
});

const outputs = [];
ws.on('message', (raw) => {
  const msg = JSON.parse(raw);
  if (msg.type === 'terminal:output' && msg.sessionId === sessionId) {
    outputs.push(msg.data);
    
    // Once we see the prompt, run a command
    if (outputs.join('').includes('$')) {
      ws.send(JSON.stringify({
        type: 'terminal:input',
        sessionId,
        data: 'echo NEURAL_TEST_OK\r'
      }));
    }
    
    // Verify echo output
    if (outputs.join('').includes('NEURAL_TEST_OK')) {
      console.log('✅ Terminal echo works');
      
      // Test resize
      ws.send(JSON.stringify({
        type: 'terminal:resize',
        sessionId,
        cols: 120,
        rows: 40
      }));
      
      // Kill session
      ws.send(JSON.stringify({ type: 'terminal:kill', sessionId }));
      ws.close();
      process.exit(0);
    }
  }
});

setTimeout(() => {
  console.log('❌ Terminal test timed out');
  process.exit(1);
}, 10000);
```

```javascript
// Playwright: xterm.js renders in browser
await playwright_navigate({ url: 'http://localhost:3000' });

// Open bottom panel
await playwright_click({ selector: '[data-testid="terminal-tab"]' });

// xterm canvas/div renders
const terminal = page.locator('[data-testid="terminal-panel"] .xterm');
await expect(terminal).toBeVisible({ timeout: 5000 });

// Type in terminal
await playwright_click({ selector: '.xterm-helper-textarea' });
await page.keyboard.type('echo hello\r');

// Verify output appears in xterm
await page.waitForTimeout(1000);
const terminalText = await page.locator('.xterm-rows').textContent();
console.log('Terminal output contains echo:', terminalText.includes('hello') ? '✅' : '❌');

// PTY cleanup test: open new terminal tab then close it
await playwright_click({ selector: '[data-testid="new-terminal-btn"]' });
await playwright_click({ selector: '[data-testid="terminal-close-btn"]' });
// No assertion here — verify no node-pty leak in backend logs
```

---

### Task 5.1 — Git Backend API
**Test Type**: curl

```bash
# Setup: initialize a test git repo
cd /tmp && rm -rf neural-git-test
mkdir neural-git-test && cd neural-git-test
git init
git config user.email "test@neural.ide"
git config user.name "Custle IDE Test"
echo "# Test Repo" > README.md
git add README.md
git commit -m "Initial commit"

# Open it as workspace
curl -s -X POST http://localhost:3001/api/workspace/open \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/neural-git-test"}' | jq '.name'
# Expected: "neural-git-test"

# Scenario 1: Get status
curl -s http://localhost:3001/api/git/status | jq '{branch, ahead, behind, fileCount: (.files | length)}'
# Expected: { branch: "main" or "master", ahead: 0, behind: 0, fileCount: 0 }

# Scenario 2: Make a change, check status
echo "console.log('hello');" > /tmp/neural-git-test/index.ts
curl -s http://localhost:3001/api/git/status | jq '.files'
# Expected: array containing { path: "index.ts", status: "untracked", staged: false }

# Scenario 3: Stage file
curl -s -X POST http://localhost:3001/api/git/stage \
  -H "Content-Type: application/json" \
  -d '{"paths":["index.ts"]}' | jq .
# Expected: { success: true }

# Verify staged
curl -s http://localhost:3001/api/git/status | jq '.files[] | select(.staged == true)'
# Expected: { path: "index.ts", status: "added", staged: true }

# Scenario 4: Commit
curl -s -X POST http://localhost:3001/api/git/commit \
  -H "Content-Type: application/json" \
  -d '{"message":"Add index.ts"}' | jq .
# Expected: { success: true, hash: "<sha>" }

# Scenario 5: Get log
curl -s "http://localhost:3001/api/git/log?limit=5" | jq '[.[] | {message, author}]'
# Expected: array with "Add index.ts" commit

# Scenario 6: Get branches
curl -s http://localhost:3001/api/git/branches | jq .
# Expected: { current: "main", local: ["main"], remote: [] }

# Scenario 7: Get diff
echo "console.log('world');" >> /tmp/neural-git-test/index.ts
curl -s "http://localhost:3001/api/git/diff?path=index.ts" | jq '.diff' | head -20
# Expected: unified diff string
```

---

### Task 5.2 — Git Panel UI
**Test Type**: Playwright

```javascript
// Prerequisite: workspace with git changes open

// Scenario 1: Git panel shows in sidebar
await playwright_navigate({ url: 'http://localhost:3000' });
await playwright_click({ selector: '[data-testid="sidebar-git-btn"]' });

const gitPanel = page.locator('[data-testid="git-panel"]');
await expect(gitPanel).toBeVisible();

// Scenario 2: Changed files listed
const gitFileItems = page.locator('[data-testid="git-file-item"]');
await expect(gitFileItems).toHaveCountGreaterThan(0);

// Scenario 3: Status badge present (M / A / D / ?)
const statusBadge = page.locator('[data-testid="git-status-badge"]').first();
await expect(statusBadge).toBeVisible();

// Scenario 4: Stage file via UI
await playwright_click({ selector: '[data-testid="stage-file-btn"]' });
// File moves to staged section
const stagedSection = page.locator('[data-testid="staged-files"]');
await expect(stagedSection).toContainText('index.ts');

// Scenario 5: Commit via UI
await playwright_fill({ selector: '[data-testid="commit-message-input"]', value: 'Test commit from UI' });
await playwright_click({ selector: '[data-testid="commit-btn"]' });
await page.waitForTimeout(1000);

// Staged section should be empty after commit
await expect(stagedSection).toBeEmpty();

// Scenario 6: Branch switcher shows current branch
const branchName = page.locator('[data-testid="current-branch"]');
await expect(branchName).toBeVisible();
await expect(branchName).not.toBeEmpty();
```

---

### Task 6.1 — AI Inline Autocomplete
**Test Type**: Playwright

```javascript
// Prerequisite: Monaco editor open with a file, model configured and running

// Scenario 1: Autocomplete provider registered
await playwright_navigate({ url: 'http://localhost:3000' });
// Open a TypeScript file
await playwright_click({ selector: '[data-path*=".ts"]' });
await page.waitForSelector('.monaco-editor', { timeout: 5000 });

// Type in editor and wait for inline suggestion
const monaco = page.locator('.monaco-editor');
await monaco.click();
await page.keyboard.press('End');
await page.keyboard.press('Enter');
await page.keyboard.type('const greet = (name: string) =>');

// Wait for debounce + model response (700ms debounce + model latency)
await page.waitForTimeout(3000);

// Check for inline ghost text
const ghostText = page.locator('.monaco-editor .ghost-text-decoration');
const hasGhostText = await ghostText.isVisible().catch(() => false);
console.log('Inline completion appeared:', hasGhostText ? '✅' : '⚠️ (model may be slow or not running)');

// Scenario 2: Tab accepts completion
if (hasGhostText) {
  await page.keyboard.press('Tab');
  console.log('✅ Tab accepted completion');
}

// Scenario 3: Escape dismisses completion
await page.keyboard.type(' ');
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
const ghostAfterEsc = await page.locator('.monaco-editor .ghost-text-decoration').isVisible().catch(() => false);
console.log('Escape dismissed completion:', !ghostAfterEsc ? '✅' : '❌');

// Scenario 4: Debounce — no request sent until 700ms after last keypress
const requests = [];
page.on('request', req => {
  if (req.url().includes('/api/completion')) requests.push(Date.now());
});

await page.keyboard.type('abc');       // rapid typing
await page.waitForTimeout(300);
await page.keyboard.type('def');       // more rapid typing
await page.waitForTimeout(1000);       // wait for debounce

console.log('Completion requests while typing rapidly:', requests.length <= 1 ? '✅ Debounced correctly' : `⚠️ ${requests.length} requests`);
```

---

### Task 6.2 — Polish, Shortcuts & Settings
**Test Type**: Playwright

```javascript
// Scenario 1: Ctrl+P opens command palette
await playwright_navigate({ url: 'http://localhost:3000' });
await page.waitForLoadState('networkidle');
await page.keyboard.press('Control+p');

const palette = page.locator('[data-testid="command-palette"]');
await expect(palette).toBeVisible();
await page.keyboard.press('Escape');

// Scenario 2: Ctrl+B toggles sidebar
const sidebar = page.locator('[data-panel-id="sidebar"]');
const initialVisible = await sidebar.isVisible();
await page.keyboard.press('Control+b');
await page.waitForTimeout(300);
const afterToggle = await sidebar.isVisible();
console.log('Ctrl+B toggles sidebar:', initialVisible !== afterToggle ? '✅' : '❌');

// Scenario 3: Ctrl+` toggles terminal
await page.keyboard.press('Control+`');
const terminal = page.locator('[data-testid="bottom-panel"]');
await expect(terminal).toBeVisible();

// Scenario 4: Toast notifications render
// Trigger a save to test toast
await playwright_click({ selector: '[data-path*=".ts"]' });
await page.waitForSelector('.monaco-editor');
await page.keyboard.press('Control+s');

const toast = page.locator('[data-testid="toast"]');
await expect(toast).toBeVisible({ timeout: 3000 });

// Scenario 5: Settings modal opens
await playwright_click({ selector: '[data-testid="settings-btn"]' });
const settings = page.locator('[data-testid="settings-modal"]');
await expect(settings).toBeVisible();
await page.keyboard.press('Escape');

// No console errors across all interactions
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
console.log('Console errors:', errors.length === 0 ? '✅ None' : `❌ ${errors.join(', ')}`);
```

---

## Test Results File Template

```markdown
# Test Results: Task X.Y — [Task Name]

**Task**: X.Y — [Task Name]
**Test File**: `.claude/TestX/Task X.Y.md`
**Execution Date**: [Timestamp]
**Duration**: [N] minutes

---

## Summary

[✅ ALL PASSED | ❌ FAILURES FOUND]

- Total Scenarios: N
- Passed: N
- Failed: N
- Console Errors: 0
- Network Errors: 0

---

## Scenario Results

| Scenario | Status | Duration | Notes |
|----------|--------|----------|-------|
| 1. ... | ✅ | Ns | - |
| 2. ... | ✅ | Ns | - |

---

## TypeScript Build Status

- Backend: ✅ 0 errors
- Frontend: ✅ 0 errors

---

## Security Checks

- Path traversal → 403: ✅
- apiKey absent from responses: ✅

---

## Issues Found & Fixed

| Issue | Fix | Time |
|-------|-----|------|
| - | - | - |

---

## Token Usage

- Implementation: [N] input / [N] output → $[N]
- Testing: [N] input / [N] output → $[N]
- Total: $[N]

---

## Final Verdict

✅ TASK X.Y COMPLETED — ready for next task
```

---

## Test Commands Reference

```bash
# Run tests for a specific task
/test-task 2.1

# Re-run failed tests only
/fix-tests 2.1

# Review test results
/review-tests 2.1

# Check TypeScript builds before testing
cd backend && npm run build && cd ../frontend && npm run build
```

---

## Common Test Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Monaco not visible | SSR crash | Check dynamic import with `ssr: false` |
| WebSocket connection refused | Backend not running | `cd backend && npm run dev` |
| Path traversal not 403 | Missing validation | Add `validatePath()` to route |
| apiKey in response | Missing strip | Remove from response object |
| Ghost text never appears | Model not running | Start vLLM or set valid model URL |
| PTY timeout | node-pty not compiled | `cd backend && npm rebuild node-pty` |
| Tree not refreshing | Watcher not started | Verify `startWatcher()` called on workspace open |