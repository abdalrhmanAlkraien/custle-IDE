# Custle IDE - Task Execution System with Automated Testing

## Project Overview

Building a fully local AI-powered IDE with file management, Monaco code editor, real terminal, AI chat, git integration, and inline autocomplete — with comprehensive automated testing for every task.

**Project Type**: AI-Powered Code Editor (IDE)
**Target Users**: Developers who want a local, self-hosted AI coding assistant
**Backend**: Node.js + Express + TypeScript (port 3001)
**Frontend**: Next.js + TypeScript (port 3000)
**Testing**: curl (backend APIs), WebSocket client (real-time), Playwright (frontend UI)

---

## Tech Stack

**Backend (`backend/`)**
- **Runtime**: Node.js + Express
- **Language**: TypeScript (strict mode)
- **Real-time**: ws (WebSocket server)
- **File system**: chokidar (file watcher), node-pty (terminal)
- **Git**: simple-git
- **API**: REST at http://localhost:3001

**Frontend (`frontend/`)**
- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode)
- **Editor**: @monaco-editor/react (dynamic import, ssr: false)
- **Terminal**: @xterm/xterm + @xterm/addon-fit (dynamic import, ssr: false)
- **State**: Zustand
- **Layout**: react-resizable-panels
- **Icons**: lucide-react
- **Dev server**: http://localhost:3000

---

## 🤖 For AI Agents: Task Execution System

**CRITICAL:** Before executing any task, read this complete workflow guide:

### **`.claude/commands/AI-AGENT-EXECUTION-GUIDE.md`** ← READ THIS FIRST!

This file contains the complete 11-step workflow for task execution including:
- ✅ How to identify and read tasks
- ✅ How to generate test scenarios (curl / WebSocket / Playwright)
- ✅ How to execute tests and handle failures
- ✅ How to update systemTasks.md with test results
- ✅ How to create documentation
- ✅ How to track costs separately (implementation + testing)
- ✅ Quality gates and standards
- ✅ Critical NEVER/ALWAYS rules

**Tasks cannot be marked complete without passing tests!**

### Quick Reference

When user says "execute task" or "/execute-task":

1. **First:** Read `.claude/commands/AI-AGENT-EXECUTION-GUIDE.md` — complete workflow
2. **Then:** Read `.claude/CLAUDE.md` (this file) — project context
3. **Then:** Read `.claude/systemTasks.md` — find next task
4. **Then:** Follow the 11-step workflow from the guide exactly

**DO NOT skip reading AI-AGENT-EXECUTION-GUIDE.md!** It contains critical instructions that ensure quality and consistency.

---

## Backend Integration Rules

### API Communication

- Backend runs at `http://localhost:3001`
- Frontend runs at `http://localhost:3000`
- WebSocket connects to `ws://localhost:3001` (never `http://` or `https://`)
- All file operations validated against workspace root (path traversal → 403)
- Model API key stored server-side only — **never returned to frontend**

### File System Security

**Path Traversal Prevention (MANDATORY):**
```typescript
// ✅ CORRECT — validate before every fs operation
import { validatePath } from '../utils/pathSecurity';
const safePath = validatePath(requestedPath, workspaceRoot);
// throws PathTraversalError → caught → 403

// ❌ WRONG — no validation
const content = fs.readFileSync(requestedPath);
```

Every file route must call `validatePath()` before any `fs` operation. This is checked in tests — failure = test failure.

### Model/AI Security

**apiKey must NEVER appear in any API response:**
```typescript
// ✅ CORRECT — strip before responding
const { apiKey, ...safeConfig } = modelConfig;
res.json(safeConfig);

// ❌ WRONG — leaks credentials
res.json(modelConfig);
```

This is checked in every model-related test.

### API Response Format

**Standard responses return data directly:**
```typescript
// Single object
const workspace: WorkspaceResponse = response.data;
// { path: string, name: string, tree: FileNode[] }

// File read
const file: FileResponse = response.data;
// { content: string, language: string, size: number }
```

**Error responses:**
```typescript
{ error: string }  // with appropriate HTTP status
```

---

## Architecture Rules — NEVER VIOLATE

1. **Monaco and xterm must use dynamic imports with `ssr: false`** — module-level imports crash Next.js SSR
2. **All file paths validated against workspace root** — path traversal returns 403
3. **apiKey never returned in any backend response** — stripped before `res.json()`
4. **TypeScript strict mode** — no `any` types, both backend and frontend must build with 0 errors
5. **PTY sessions cleaned up on WebSocket close** — no orphaned processes
6. **reactStrictMode: false** in `next.config.ts` — required for Monaco/xterm stability
7. **WebSocket URL is `ws://`** — never `http://` or `https://`
8. **Autocomplete uses 700ms debounce + AbortController** — prevents request flooding
9. **Testing mandatory** — every task must have automated tests
10. **No task complete without passing tests** — all tests must pass
11. **systemTasks.md updated exactly once per task** — never in a loop
12. **GitHub token never returned in any /api/github/* response** — only username/avatar_url/name (7.1)
13. **PAT injected into HTTPS push URL only — never persisted in git config** — restore original remote after push (7.2)
14. **/api/workspace/browse has NO validatePath() restriction** — intentional, user browses own machine (7.2)

---

## Task Execution System with Automated Testing

This project uses a structured task system with automated testing for every task.

### Task Locations

**Task Definitions**: `.claude/Phase X/Task X.Y.md`
- Phase 1: Foundation (2 tasks)
- Phase 2: File System & Editor (3 tasks)
- Phase 3: AI Chat & Agent (2 tasks)
- Phase4: Terminal (1 task)
- Phase5: Git Integration (2 tasks)
- Phase6: Autocomplete & Polish (2 tasks)
- Phase7: GitHub Integration & Core Fixes (3 tasks)
- Phase8: UI Polish & Completeness (1 task)

**Total Tasks**: 16

**Test Scenarios**: `.claude/Phase X/TestX/Task X.Y.md`
- Auto-generated after task implementation
- Test type per task: curl / WebSocket / Playwright
- Based on task acceptance criteria
- Covers success paths, edge cases, security checks

**Task Tracking**: `.claude/systemTasks.md`
- Master list of all tasks with status
- Updated after each task completion (ONCE)
- Tracks token usage, costs, and test results

**Task Documentation**: `.claude/processed/Task X.Y.md`
- Created after task completion
- Documents files created, decisions, tokens

**Test Results**: `.claude/processed/Task X.Y - Test Results.md`
- Detailed test execution results
- Scenario-by-scenario breakdown
- Security check outcomes
- TypeScript build status

### Test Types by Task

| Task | Test Method |
|------|-------------|
| 1.1 Project Scaffold | shell (npm build) |
| 1.2 IDE Shell Layout | Playwright |
| 2.1 Backend File System API | curl + WebSocket |
| 2.2 File Explorer Sidebar | Playwright |
| 2.3 Monaco Editor + Tabs + Save | Playwright |
| 3.1 Model Config & Connection | curl (+ apiKey check) |
| 3.2 AI Chat & Agent Panel | Playwright + curl |
| 4.1 Real Terminal (node-pty) | WebSocket + curl |
| 5.1 Git Backend API | curl |
| 5.2 Git Panel UI | Playwright |
| 6.1 AI Inline Autocomplete | Playwright |
| 6.2 Polish, Shortcuts & Settings | Playwright |
| 7.1 GitHub Token Auth + Repo Browser | curl (+ token absent check) |
| 7.2 Folder Browser + Git Status | curl + Playwright |
| 7.3 Terminal Fix + Agent Tools | WebSocket + curl + Playwright |
| 8.1 Menu Bar Dropdowns | curl (health) + Playwright |

### Execution Workflow

1. Read `.claude/systemTasks.md` to find next pending task
2. Read task definition from `.claude/Phase X/Task X.Y.md`
3. Display task details to user and wait for confirmation
4. Execute implementation following definition requirements exactly
5. **TypeScript verification** — `cd backend && npm run build` → 0 errors, `cd frontend && npm run build` → 0 errors
6. **Generate test scenarios** automatically from task requirements
7. **Execute automated tests** (curl / WebSocket / Playwright per task type)
8. **Verify all tests pass** before marking complete
9. Track token usage for both implementation and testing
10. Create processed documentation
11. Update `.claude/systemTasks.md` with completion status — **EXACTLY ONCE**
12. Present review options to user

### Commands

**Core Execution:**
- `/execute-task` — Execute next pending task with automated testing
- `/continue-tasks` — Execute multiple tasks in batch with testing
- `/review-progress` — Show current progress, statistics, and test results
- `/review-token-usage` — Show token usage and cost report (including tests)

**Testing Commands:**
- `/test-task [X.Y]` — Run or re-run tests for a specific task
- `/review-tests [X.Y]` — Review detailed test results for a task
- `/review-file [X.Y]` — Review files created in a specific task

**Issue Resolution:**
- `/fix-task [X.Y]` — Fix issues in a task (re-tests automatically)
- `/log-tokens [X.Y]` — Manually log token usage

### User Shortcuts

- **continue** → Execute next task (with testing)
- **review** → Show files created in last task
- **fix** → Enter fix mode for last task (with re-testing)
- **skip** → Skip next task, mark as blocked
- **status** → Show progress summary (with test status)
- **pause** → Stop and save state
- **test** → Run tests for last task
- **tests** → Show test results for last task
- **re-test** → Re-run tests for last task
- **tokens** → Show token usage report
- **details** → Show full task documentation

---

## Testing System

Every task includes comprehensive automated testing.

### Test Generation

After completing implementation:
1. Read task definition to extract acceptance criteria
2. Generate test scenarios covering:
   - Primary functionality (success paths)
   - Edge cases and boundary conditions
   - Error handling
   - Security checks (path traversal, apiKey) where applicable
   - Regression checks

### Test Execution by Type

**curl (backend API tasks):**
```bash
curl -s -X POST http://localhost:3001/api/workspace/open \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/test"}' | jq .

# Security check (must return 403):
STATUS=$(curl -o /dev/null -w "%{http_code}" \
  "http://localhost:3001/api/files/read?path=../../etc/passwd")
[ "$STATUS" = "403" ]
```

**WebSocket:**
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.send(JSON.stringify({ type: 'terminal:create' }));
// Verify response shape, then clean up
ws.close();
```

**Playwright (frontend UI):**
```javascript
await playwright_navigate({ url: 'http://localhost:3000' });
await playwright_screenshot({ name: 'ide-loaded' });
// ... interactions and assertions
```

### Test Results in systemTasks.md

```markdown
Testing:
- Test Status: ✅ PASSED
- Test Scenarios: 5 total (5 passed, 0 failed)
- TypeScript Errors: 0
- Security Issues: 0
- Console Errors: 0
- Test Results File: .claude/processed/Task X.Y - Test Results.md
```

### Quality Gates

**Cannot mark task complete unless:**
- ✅ TypeScript: `npm run build` → 0 errors (both backend and frontend)
- ✅ All test scenarios pass
- ✅ Zero console errors
- ✅ Security checks pass (path traversal, apiKey) where applicable
- ✅ No orphaned PTY sessions (terminal tasks)
- ✅ Monaco/xterm using dynamic imports (frontend tasks)

**If tests fail:**
- Show detailed failure information
- Offer to auto-fix or guide through fixing
- Re-run TypeScript build after any fix
- Re-run tests after fixes
- Only mark complete when all tests pass

---

## Token Usage Tracking

### Current Pricing (Claude Sonnet 4.5)

- **Input**: $3 per million tokens
- **Output**: $15 per million tokens

### Track Separately

```
Implementation Cost:
  Input Cost  = (Input Tokens  / 1,000,000) × $3
  Output Cost = (Output Tokens / 1,000,000) × $15

Testing Cost:
  Input Cost  = (Test Input  / 1,000,000) × $3
  Output Cost = (Test Output / 1,000,000) × $15

Total Task Cost = Implementation + Testing
```

**Budget**: $5.00 total for all 12 tasks

### Testing Cost Estimates

- Simple tasks (curl only): ~$0.05-0.07 per task
- Medium tasks (Playwright): ~$0.07-0.09 per task
- Complex tasks (agent, terminal): ~$0.09-0.12 per task

---

## File Structure

```
custle-IDE/
├── .claude/
│   ├── CLAUDE.md                    ← This file
│   ├── systemTasks.md               ← Task tracking
│   ├── prompt.md                    ← Current task state
│   ├── Phase 1/
│   │   ├── Task 1.1.md
│   │   └── Task 1.2.md
│   ├── Phase 2/
│   │   ├── Task 2.1.md
│   │   ├── Task 2.2.md
│   │   └── Task 2.3.md
│   ├── Phase3/
│   │   ├── Task 3.1.md
│   │   └── Task 3.2.md
│   ├── Phase4/
│   │   └── Task 4.1.md
│   ├── Phase5/
│   │   ├── Task 5.1.md
│   │   └── Task 5.2.md
│   ├── Phase6/
│   │   ├── Task 6.1.md
│   │   └── Task 6.2.md
│   ├── Phase7/
│   │   ├── Task 7.1.md
│   │   ├── Task 7.2.md
│   │   └── Task 7.3.md
│   ├── Phase8/
│   │   └── Task 8.1.md
│   ├── processed/                   ← Completed task docs
│   │   ├── Task X.Y.md
│   │   └── Task X.Y - Test Results.md
│   └── commands/
│       ├── AI-AGENT-EXECUTION-GUIDE.md  ← READ FIRST
│       ├── execute-task.md
│       ├── continue-tasks.md
│       ├── review-progress.md
│       ├── fix-task.md
│       ├── review-token-usage.md
│       ├── test-task.md
│       ├── review-tests.md
│       ├── review-file.md
│       └── log-tokens.md
├── backend/
│   ├── src/
│   │   ├── index.ts                 ← Express + WS server (port 3001)
│   │   ├── routes/
│   │   │   ├── workspace.ts
│   │   │   ├── files.ts             ← validatePath() required
│   │   │   ├── model.ts             ← apiKey stripped from responses
│   │   │   ├── terminal.ts
│   │   │   ├── git.ts
│   │   │   └── github.ts            ← token NEVER in responses (7.1)
│   │   ├── services/
│   │   │   ├── fileService.ts
│   │   │   ├── watcherService.ts
│   │   │   ├── modelService.ts
│   │   │   ├── ptyService.ts
│   │   │   ├── gitService.ts
│   │   │   ├── githubService.ts     ← GitHub API + better-sqlite3 (7.1)
│   │   │   └── terminalService.ts   ← PTY rewrite + agent tools (7.3)
│   │   ├── db/
│   │   │   └── database.ts          ← better-sqlite3 setup (7.1)
│   │   └── utils/
│   │       └── pathSecurity.ts      ← validatePath()
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── sidebar/
│   │   │   │   └── FileTree.tsx
│   │   │   ├── editor/
│   │   │   │   ├── EditorArea.tsx
│   │   │   │   └── MonacoEditor.tsx  ← dynamic import, ssr:false
│   │   │   ├── terminal/
│   │   │   │   ├── TerminalPanel.tsx ← dynamic import, ssr:false
│   │   │   │   ├── XTermWrapper.tsx  ← xterm.js only here (7.3)
│   │   │   │   └── TerminalTabs.tsx  ← multi-tab support (7.3)
│   │   │   ├── chat/
│   │   │   │   └── ChatPanel.tsx
│   │   │   ├── git/
│   │   │   │   ├── GitPanel.tsx
│   │   │   │   ├── GitHubConnect.tsx ← PAT token input (7.1)
│   │   │   │   └── RepoList.tsx      ← repo browser (7.1)
│   │   │   ├── sidebar/
│   │   │   │   └── FolderBrowser.tsx ← native folder picker (7.2)
│   │   │   └── titlebar/
│   │   │       ├── MenuBar.tsx       ← all 4 menus (8.1)
│   │   │       ├── MenuDropdown.tsx  ← reusable dropdown (8.1)
│   │   │       ├── AboutModal.tsx    ← about dialog (8.1)
│   │   │       └── ShortcutsModal.tsx← keyboard ref (8.1)
│   │   ├── store/
│   │   │   └── ideStore.ts          ← Zustand
│   │   └── lib/
│   │       └── api/
│   ├── next.config.ts               ← reactStrictMode: false
│   ├── package.json
│   └── tsconfig.json
└── doc/
```

---

## Current Status

**Project Phase**: Not Started (Task 1.1 pending)

**Module Status**:
- ⏳ Phase 1: Foundation — Not Started
- ⏳ Phase 2: File System & Editor — Not Started
- ⏳ Phase 3: AI Chat & Agent — Not Started
- ⏳ Phase4: Terminal — Not Started
- ⏳ Phase5: Git Integration — Not Started
- ⏳ Phase6: Autocomplete & Polish — Not Started
- ⏳ Phase7: GitHub Integration & Core Fixes — Not Started
- ⏳ Phase8: UI Polish & Completeness — Not Started

**Progress**:
- Total Tasks: 16
- Completed: 0
- Pending: 16
- Percentage: 0%
- Tests Passed: 0/0

**Token Usage**:
- Implementation: $0.00
- Testing: $0.00
- Total Cost: $0.00 / $5.00 budget

---

## Testing Requirements

### Automated Testing (Every Task)
- **TypeScript must build clean** — 0 errors on both backend and frontend
- **All acceptance criteria tested** — success paths, edge cases, errors
- **Security checks** — path traversal blocked (403), apiKey absent from responses
- **Console must be clean** — zero errors or warnings
- **Network requests validated** — correct endpoints, status codes, payloads
- **Regression checks** — previous features still work

### Test Execution Strategy
1. **After implementation** — tests generated and run automatically
2. **Before marking complete** — all tests must pass
3. **After fixes** — TypeScript rebuild + affected tests re-run automatically
4. **Manual trigger** — user can re-run tests anytime with `/test-task X.Y`

### Test Documentation
- Every test scenario documented in test file
- Every test result documented in `.claude/processed/Task X.Y - Test Results.md`
- Test status tracked in `systemTasks.md`
- Test costs tracked separately from implementation

### Quality Metrics
- **Test pass rate**: Target 100%
- **TypeScript errors**: Target 0
- **Console errors**: Target 0
- **Security issues**: Target 0
- **Test coverage**: 100% of completed tasks

---

## Important Reminders

### Always Read Task Definition First
- **NEVER assume** what a task should do
- **ALWAYS read** `.claude/Phase X/Task X.Y.md` before executing
- **Follow exactly** what the task definition specifies

### Testing is Mandatory
- Every task must be tested — no exceptions
- Cannot mark complete without passing tests
- TypeScript must build clean before running tests
- Re-test after every fix

### NeuralIDE-Specific Checklist
- [ ] Monaco/xterm: dynamic import with `ssr: false`
- [ ] File routes: `validatePath()` called before every `fs` operation
- [ ] Model routes: `apiKey` stripped from every `res.json()` response
- [ ] Terminal: PTY session cleaned up on WebSocket close
- [ ] Autocomplete: 700ms debounce + AbortController
- [ ] `reactStrictMode: false` in `next.config.ts`
- [ ] systemTasks.md updated **exactly once** per task
- [ ] GitHub routes: token field absent from ALL `/api/github/*` responses (7.1)
- [ ] GitHub push: PAT injected into URL only, original remote restored after (7.2)
- [ ] xterm imports: ONLY inside `XTermWrapper.tsx` — never at module level in other files (7.3)
- [ ] Menu items: `<button onClick>` only — no `<form>` tags anywhere (8.1)
- [ ] Menu close: `mousedown` listener not `click` — prevents same-click closing (8.1)

### Communication Style
- Show progress during implementation step by step
- Show test progress scenario by scenario
- Include test results in completion summary
- Use emojis for visual clarity (📋 🔄 ✅ ❌ 🧪 🔒)
- Wait for user confirmation before proceeding

---

## Example Task Execution Session

```
User: /execute-task

Claude:
📋 NEXT TASK IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task Number: 2.1
Task Name: Backend File System API
Phase: Phase 2
Task Definition: .claude/Phase 2/Task 2.1.md
Status: ⏳ PENDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to start? (yes/no/skip)

User: yes

Claude:
[Reads .claude/Phase 2/Task 2.1.md]

📖 TASK DETAILS - Task 2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create REST API for file read/write + path security + file watcher
[Shows requirements, outputs, test criteria]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Proceed with execution? (yes/no/read-full)

User: yes

Claude:
⚙️  IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ backend/src/routes/files.ts
✓ backend/src/services/fileService.ts
✓ backend/src/utils/pathSecurity.ts

🔨 TypeScript verification...
✓ cd backend && npm run build → 0 errors
✓ cd frontend && npm run build → 0 errors

🧪 GENERATING TEST SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 5 scenarios (curl + WebSocket)

🧪 EXECUTING TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/5] Open Workspace ✅
[2/5] Read File ✅
[3/5] Path Traversal Blocked (403) ✅ 🔒
[4/5] Write File (Atomic) ✅
[5/5] File Watcher Broadcasts ✅

✅ ALL TESTS PASSED (5/5)

✅ TASK COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration: 32 min | Cost: $0.25
Tests: 5/5 ✅ | TypeScript: 0 errors ✅ | Security: ✅

🔍 REVIEW OPTIONS
1️⃣ continue   2️⃣ review   3️⃣ review-tests
4️⃣ re-test    5️⃣ fix      6️⃣ details   7️⃣ pause

Your choice:

User: continue

Claude:
[Proceeds to Task 2.2...]
```

---

## Quick Start

To begin development:
```
1. Ensure .claude/ files are in place
2. Say: "/execute-task" or "Start Task 1.1"
3. Confirm when prompted
4. Watch as implementation AND tests execute automatically
5. Review results including test outcomes
6. Choose to continue, review, fix, or pause
7. Repeat until all 16 tasks complete (all with passing tests!)
```

---

**Remember**: This file is read at the start of every Claude session. Keep it updated with current project status and decisions.

**Testing is a core part of the workflow** — every task includes automated testing to ensure quality and functionality! 🧪✅