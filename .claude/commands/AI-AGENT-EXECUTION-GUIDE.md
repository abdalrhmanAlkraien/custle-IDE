# AI Agent Task Execution Guide

**Document Purpose:** Complete instructions for AI agents (Claude Code, etc.) to execute tasks in this project according to the established system.

**Last Updated:** 2026-02-23  
**Version:** 1.0

---

## 📋 Overview

This project uses a **structured task execution system** with:
- 12 tasks across 6 phases
- Automated testing: curl, WebSocket, and Playwright
- Comprehensive documentation requirements
- Token usage tracking
- Quality gates at every step

**Your role as an AI agent:** Execute tasks exactly as defined, following all standards, generating tests, and documenting everything.

---

## 🎯 Quick Start

When user says **"execute task"** or **"continue"**, follow this workflow:

```
1. Read .claude/systemTasks.md → Find next PENDING task
2. Read .claude/PhaseX/Task X.Y.md → Understand requirements
3. Verify all dependencies are ✅ COMPLETED
4. Present task summary to user → Wait for confirmation
5. Execute implementation → Follow task definition exactly
6. Verify TypeScript → cd backend && npm run build → 0 errors
                     → cd frontend && npm run build → 0 errors
7. Generate test scenarios → .claude/TestX/Task X.Y.md
8. Run tests → curl / WebSocket / Playwright (per task type)
9. Create documentation → implementation + test results
10. Update systemTasks.md → Mark complete with metrics (ONCE only)
11. Present results → Show summary, offer next steps
```

**Cannot skip steps. All must complete successfully.**

---

## 📖 Detailed Workflow

### Step 1: Find Next Task

```bash
# Read systemTasks.md
cat .claude/systemTasks.md

# Find next task with: Status: ⏳ PENDING
# Example: Task 2.1
```

### Step 2: Verify Dependencies

```
Task 2.1 Dependencies:
  - 1.1 ✅ COMPLETED
  - 1.2 ✅ COMPLETED

All complete? → Proceed
Any PENDING? → Stop, inform user
```

### Step 3: Read Task Definition

```bash
# Read the specific task file
cat .claude/PhaseX/Task X.Y.md
```

**Extract:**
- Objective
- File locations (backend/src/ or frontend/src/)
- All requirements (numbered sections)
- Test scenarios
- Acceptance criteria
- Critical notes

### Step 4: Present to User

```
📋 TASK 2.1: Backend File System API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Objective: REST API for file read/write + path security + file watcher
Files: backend/src/routes/files.ts (create)
       backend/src/services/fileService.ts (create)
       backend/src/utils/pathSecurity.ts (create)
Estimated: 30-35 minutes
Tests: 5 scenarios (curl + WebSocket)

Ready to proceed? (yes/no)
```

**Wait for "yes" before continuing.**

### Step 5: Implement

**Read documentation first:**
```bash
cat docs/CODING_STANDARDS.md
cat docs/BACKEND_ARCHITECTURE.md   # for backend tasks
cat docs/FRONTEND_ARCHITECTURE.md  # for frontend tasks
cat docs/API_INTEGRATION.md        # for tasks with API calls
```

**Then create files exactly as task specifies:**
```typescript
// Task says: Create backend/src/routes/files.ts
// You create: backend/src/routes/files.ts

// Follow code examples in task definition
// Adapt to actual project structure
```

**Show progress:**
```
⚙️  Step 1/3: Creating backend routes...
    ✓ backend/src/routes/files.ts
    ✓ backend/src/services/fileService.ts
    ✓ backend/src/utils/pathSecurity.ts
```

### Step 6: Verify TypeScript (MANDATORY)

```bash
cd backend && npm run build
# Must show: 0 errors

cd frontend && npm run build
# Must show: 0 errors
```

**If errors exist → fix before proceeding to tests. Never skip.**

### Step 7: Generate Test Scenarios

**Create:** `.claude/TestX/Task X.Y.md`

**Test type depends on task:**

| Task type | Test method |
|-----------|-------------|
| Backend routes (2.1, 3.1, 5.1) | curl commands |
| WebSocket (2.1 watcher, 4.1 terminal) | WebSocket client |
| Frontend UI (1.2, 2.2, 2.3, 3.2, 5.2, 6.1, 6.2) | Playwright |

**Always include security scenarios where applicable:**
- File routes → path traversal blocked (403)
- Model config → apiKey absent from response
- Terminal → PTY session cleanup on close

### Step 8: Execute Tests

Show results as each scenario runs:
```
[1/5] Open Workspace
      ✓ POST http://localhost:3001/api/workspace/open → 200 OK
      Status: ✅ PASSED

[3/5] Path Traversal Blocked
      ✓ GET /api/files/read?path=../../etc/passwd → 403
      Status: ✅ PASSED
```

**If ANY test fails:**
1. Show failure to user
2. Analyze issue
3. Fix code
4. Re-run `npm run build` (0 errors)
5. Re-run tests
6. Repeat until ALL pass

### Step 9: Document

**Create TWO files:**

**File 1:** `.claude/processed/Task X.Y.md`
```markdown
# Task X.Y - [Name]
Status: ✅ COMPLETED
[Implementation details, decisions, key code patterns]
```

**File 2:** `.claude/processed/Task X.Y - Test Results.md`
```markdown
# Test Results - Task X.Y
Total: 5/5 passed ✅
[Detailed scenario results, security checks, TypeScript status]
```

### Step 10: Update systemTasks.md — ONCE

**Change:**
```markdown
### Task 2.1: Backend File System API
- **Status**: ⏳ PENDING → ✅ COMPLETED
- **Completed**: 2026-02-23 14:15
- **Input Tokens**: 9,840
- **Output Tokens**: 6,560
- **Cost Estimate**: $0.25

Testing:
- **Test Status**: ✅ PASSED
- **Test Scenarios**: 5 total (5 passed, 0 failed)
- **TypeScript Errors**: 0
- **Security Issues**: 0
```

**⚠️ Update systemTasks.md EXACTLY ONCE per task. Never loop.**

### Step 11: Present Results

```
✅ TASK COMPLETED
Task 2.1: Backend File System API
Duration: 32 min | Cost: $0.25

📁 FILES:
  backend/src/routes/files.ts
  backend/src/services/fileService.ts
  backend/src/utils/pathSecurity.ts

🧪 TESTS: 5/5 passed ✅
🔒 SECURITY: Path traversal blocked ✅
📦 TYPESCRIPT: 0 errors ✅
💰 COST: $0.17 impl + $0.08 test

Next: Task 2.2 - File Explorer Sidebar

Options:
1️⃣ continue
2️⃣ review
3️⃣ pause
```

---

## 🚨 Critical Rules

### Rule 1: Always Read Task Definition

**NEVER assume** what a task requires. **ALWAYS read** the file.

```bash
# ✅ CORRECT
cat .claude/Phase2/Task 2.1.md
# Read entire file, understand requirements, then execute

# ❌ WRONG
# "I know this task is about file routes, I'll just build it"
```

### Rule 2: Tests Must Pass

**Cannot mark complete unless ALL tests pass.**

```
5/5 tests passed ✅ → Can mark complete
3/5 tests passed ❌ → CANNOT mark complete, must fix
```

### Rule 3: TypeScript Must Build Clean

```bash
# ✅ CORRECT — run after every implementation
cd backend && npm run build   # → 0 errors
cd frontend && npm run build  # → 0 errors

# ❌ WRONG — never proceed to tests with build errors
```

### Rule 4: Never Expose apiKey

```typescript
// ✅ CORRECT — strip sensitive fields before responding
const { apiKey, ...safeConfig } = modelConfig;
res.json(safeConfig);

// ❌ WRONG — leaks credentials
res.json(modelConfig);  // apiKey included!
```

### Rule 5: Never Allow Path Traversal

```typescript
// ✅ CORRECT
const safePath = validatePath(requestedPath, workspaceRoot);
// throws PathTraversalError → 403 if outside workspace

// ❌ WRONG
const content = fs.readFileSync(requestedPath);  // no validation!
```

### Rule 6: Monaco/xterm Must Be Dynamic

```typescript
// ✅ CORRECT
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

// ❌ WRONG — crashes SSR
import MonacoEditor from '@monaco-editor/react';
```

### Rule 7: Follow Documentation

All code must match:
- `docs/CODING_STANDARDS.md`
- `docs/BACKEND_ARCHITECTURE.md`
- `docs/FRONTEND_ARCHITECTURE.md`
- `docs/API_INTEGRATION.md`

### Rule 8: Track Tokens Separately

```
Implementation: 9,840 tokens ($0.17)
Testing:        4,200 tokens ($0.08)
Total:         14,040 tokens ($0.25)
```

Log both categories in systemTasks.md.

---

## ✅ Quality Checklist

Before marking COMPLETED:

**Code:**
- [ ] TypeScript compiles — `cd backend && npm run build` → 0 errors
- [ ] TypeScript compiles — `cd frontend && npm run build` → 0 errors
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Monaco/xterm imported dynamically with `ssr: false` (if applicable)

**Security (where applicable):**
- [ ] Path traversal → 403 (file route tasks)
- [ ] apiKey absent from API responses (model config task)
- [ ] PTY session cleanup verified (terminal task)
- [ ] Workspace root enforced on all file operations

**Testing:**
- [ ] Test scenarios generated → `.claude/TestX/Task X.Y.md`
- [ ] ALL tests executed
- [ ] ALL tests passed
- [ ] 0 console errors
- [ ] 0 network errors

**Documentation:**
- [ ] Implementation doc created → `.claude/processed/Task X.Y.md`
- [ ] Test results doc created → `.claude/processed/Task X.Y - Test Results.md`
- [ ] systemTasks.md updated **exactly once**

---

## 🔧 Handling Failures

### If Tests Fail

```
❌ 2/5 tests failed

Failed:
  [3/5] Path traversal not blocked — returns 200
  [4/5] .tmp file left on disk after failed write

Options:
1️⃣ auto-fix   → I analyze and fix
2️⃣ show-code  → Show failing test code
3️⃣ skip       → Mark complete anyway (NOT recommended)
```

**Auto-fix process:**
1. Analyze failure reason
2. Identify code issue
3. Apply fix
4. Re-run `npm run build` (0 errors)
5. Re-run tests
6. Confirm all pass

### If TypeScript Build Fails

```
❌ TypeScript errors: backend/src/routes/files.ts:23:5
   Parameter 'req' implicitly has an 'any' type

Auto-fixing...
[fix → rebuild → verify 0 errors → proceed to tests]
```

### If Dependencies Missing

```
⚠️ Cannot proceed
Task 2.2 needs Task 2.1 (PENDING)

Options:
1️⃣ execute-2.1 → Do dependency first
2️⃣ skip        → Skip 2.2 for now
```

---

## 📊 Example Complete Execution

```
User: execute task

Agent:
  [Reads .claude/systemTasks.md]
  [Finds Task 2.1 PENDING]
  [Reads .claude/Phase2/Task 2.1.md]
  [Checks dependencies: 1.1 ✅, 1.2 ✅]

  📋 TASK 2.1: Backend File System API
  Ready? (yes/no)

User: yes

Agent:
  [Reads CODING_STANDARDS.md]
  [Reads BACKEND_ARCHITECTURE.md]
  [Creates backend/src/routes/files.ts]
  [Creates backend/src/services/fileService.ts]
  [Creates backend/src/utils/pathSecurity.ts]

  🔨 TypeScript verification...
  ✓ cd backend && npm run build → 0 errors
  ✓ cd frontend && npm run build → 0 errors

  ⚙️ Implementation complete

  [Generates test scenarios]
  [Creates .claude/Test2/Task 2.1.md]

  🧪 Generated 5 test scenarios (curl + WebSocket)

  [Runs tests]
  [1/5] Open Workspace ✅
  [2/5] Read File ✅
  [3/5] Path Traversal Blocked ✅
  [4/5] Write File (Atomic) ✅
  [5/5] File Watcher Broadcasts ✅

  ✅ ALL 5 TESTS PASSED

  [Creates .claude/processed/Task 2.1.md]
  [Creates .claude/processed/Task 2.1 - Test Results.md]
  [Updates .claude/systemTasks.md — ONCE]

  ✅ TASK COMPLETED
  Duration: 32 min | Cost: $0.25
  Tests: 5/5 ✅ | TypeScript: 0 errors ✅ | Security: ✅

  Next: Task 2.2 - File Explorer Sidebar

  Options:
  1️⃣ continue
  2️⃣ review
  3️⃣ pause

User: continue

Agent:
  [Starts Task 2.2...]
```

---

## 🎯 Success = All These True

1. ✅ Code written per task definition
2. ✅ Files in correct locations (backend/src/ or frontend/src/)
3. ✅ TypeScript builds clean (backend AND frontend)
4. ✅ Security checks pass (path traversal, apiKey, PTY)
5. ✅ Test scenarios generated
6. ✅ Tests executed
7. ✅ **ALL tests passed**
8. ✅ Both docs created
9. ✅ systemTasks.md updated **exactly once**
10. ✅ User sees results

**Only then:** Status = ✅ COMPLETED

---

**Remember: Quality over speed. Complete, tested, documented, secure. No shortcuts.**