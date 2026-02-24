# Continue Tasks - Batch Execution Mode with Testing

Continue executing tasks from where we left off, with automated testing for each task.

---

## Workflow Overview
```
Check Status → Execute Task → Generate Tests → Run Tests → 
Tests Pass? → Yes → Next Task → Repeat
            ↓ No → Fix → Re-test → Continue
```

---

## Steps

### Step 1: Check Current Status

1. **Read `.claude/systemTasks.md`**
2. **Find any task with status 🔄 IN_PROGRESS**
   - If found, complete that task first (with testing)
   - Otherwise, find next ⏳ PENDING task
3. **Display current state:**
```
📊 CURRENT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks Completed: 3/12 (25.0%)
Current Phase: Phase 2 - File System & Editor

In Progress: None
Next Pending: Task 2.2 - File Explorer Sidebar

Recent Completions:
  ✅ Task 2.1 - Backend File System API
     Tests: 5/5 passed ✅
     Duration: 32 minutes
     Cost: $0.21

Last Session:
  - Completed 2 tasks
  - All tests passed
  - Total cost: $0.43

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Continue from Task 2.2? (yes/no/batch)
```

---

### Step 2: Execute Tasks in Sequence

**Single Task Mode:**

Use the `/execute-task` command for each task:
```
Task 2.2: File Explorer Sidebar

[Executes implementation - see execute-task.md]
  ✓ Implementation complete
  ✓ TypeScript: backend 0 errors, frontend 0 errors

[Generates test scenarios]
  ✓ Test file created: .claude/Test2/Task 2.2.md

[Runs tests]
  ✓ All 5 scenarios passed

✅ TASK 2.2 COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementation: ✅ Complete (24 minutes)
Tests: ✅ Passed (5/5 scenarios, 7 minutes)
Total Duration: 31 minutes
Cost: $0.20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Continue with next task? (yes/no/batch/pause)
```

**User Responses:**
- **yes** → Execute Task 2.3 immediately
- **no** → Stop and show summary
- **batch** → Ask "How many?" then enter batch mode
- **pause** → Save and stop

---

### Step 3: Batch Execution Mode

**When user says:**
- "execute next 3 tasks"
- "batch 3"
- "continue with batch mode"

**Claude responds:**
```
🔄 BATCH MODE - Execute Multiple Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How many tasks to execute? (1-10)

User: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BATCH PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Will execute:
  1. Task 2.2 - File Explorer Sidebar
  2. Task 2.3 - Monaco Editor + Tabs + Save
  3. Task 3.1 - Model Config & Connection

Estimated Duration: ~1h 45m
Estimated Cost: ~$0.65

Testing included:
  - All tasks will be tested
  - Batch stops if any test fails
  - You can fix and resume

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with batch? (yes/no)
```

**If user confirms:**
```
⚙️ BATCH EXECUTION [1/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.2 - File Explorer Sidebar

Implementation:
  ⚙️ Step 1/3: Creating FileTree component...
  ⚙️ Step 2/3: Creating FileTreeItem with context menu...
  ⚙️ Step 3/3: Creating WorkspaceSelector...
  ✅ Implementation complete (24 minutes)
  ✅ TypeScript: 0 errors

Testing:
  🧪 Generating test scenarios...
  ✓ Test file created

  🧪 Executing tests...
  [1/5] File tree renders ✅
  [2/5] Click opens file in editor ✅
  [3/5] Right-click context menu ✅
  [4/5] Create file via context menu ✅
  [5/5] Live update on file watcher event ✅

  ✅ All tests passed (7 minutes)

✅ TASK 2.2 COMPLETED
  Duration: 31 minutes | Cost: $0.20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ BATCH EXECUTION [2/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.3 - Monaco Editor + Tabs + Save

Implementation:
  ⚙️ Creating EditorArea with dynamic Monaco import...
  ✅ Implementation complete (28 minutes)
  ✅ TypeScript: 0 errors

Testing:
  🧪 Generating test scenarios...
  🧪 Executing tests...
  [1/5] Monaco renders with dynamic import ✅
  [2/5] Tab opens when file clicked ✅
  [3/5] Dirty indicator on edit ✅
  [4/5] Ctrl+S saves and clears dirty ✅
  [5/5] Custom dark theme applied ✅

  ✅ All tests passed (8 minutes)

✅ TASK 2.3 COMPLETED
  Duration: 36 minutes | Cost: $0.23

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Continues for remaining tasks...]
```

---

### Step 3.5: If Tests Fail During Batch

**Scenario: Test failure in middle of batch**
```
❌ BATCH PAUSED - Test Failure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Batch Progress: 2/3 completed

Current Task: Task 3.1 - Model Config & Connection
  Implementation: ✅ Complete
  Tests: ❌ Failed (3/5 passed)

Failed Scenarios:
  [4/5] apiKey absent from GET /api/model/config
        Issue: apiKey still included in response
        Expected: { url, name, provider } — NO apiKey

  [5/5] Test connection returns ok/error shape
        Issue: Returns 500 instead of { ok: false, error }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Batch cannot continue with failing tests.

Options:

1️⃣  auto-fix        - Let me fix and resume batch
2️⃣  manual-fix      - I'll fix it, then resume
3️⃣  show-failures   - Show me the failing tests
4️⃣  skip-and-continue - Skip this task, continue batch ⚠️
5️⃣  stop-batch      - Stop batch, review progress

Your choice:
```

**Option 1: auto-fix**
```
User: 1

🔧 AUTO-FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing failures...

Issue 1: apiKey in response
  Problem: GET /api/model/config returns raw config with apiKey
  Fix: Destructure and strip apiKey before res.json()

Issue 2: Test connection error shape
  Problem: modelService.testConnection throws on failure
  Fix: Catch error, return { ok: false, error: message }

Applying fixes...
  ✓ Updated backend/src/routes/model.ts
  ✓ Updated backend/src/services/modelService.ts
  ✓ TypeScript: 0 errors

Re-running tests...
  ✓ [4/5] apiKey absent from response ✅ NOW PASSES
  ✓ [5/5] Test connection shape correct ✅ NOW PASSES

✅ ALL TESTS NOW PASS (5/5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TASK 3.1 COMPLETED
  Duration: 38 minutes (including 6 min fix)
  Cost: $0.25

Resuming batch execution...
```

**Option 2: manual-fix**
```
User: 2

⏸️ BATCH PAUSED FOR MANUAL FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 3.1 has failing tests. Please fix:

Failed Tests:
  - Scenario 4: apiKey still in GET /api/model/config response
  - Scenario 5: testConnection throws instead of returning { ok: false }

Files to check:
  - backend/src/routes/model.ts
  - backend/src/services/modelService.ts

Test file: .claude/Test3/Task 3.1.md
Test results: .claude/processed/Task 3.1 - Test Results.md

When you're done fixing, say:
  "resume batch" or "retry tests"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Waiting for your fix...

[User fixes code manually]

User: retry tests

🧪 Re-running tests for Task 3.1...

[Runs tests again]

✅ ALL TESTS NOW PASS (5/5)

Resuming batch execution...
```

---

### Step 4: Progress Check

**After every task in batch, show brief status:**
```
⚙️ BATCH PROGRESS [3/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Task 2.2 - File Explorer Sidebar
   Implementation: ✅ (24 min)
   Tests: ✅ 5/5 passed (7 min)
   Cost: $0.20

✅ Task 2.3 - Monaco Editor + Tabs + Save
   Implementation: ✅ (28 min)
   Tests: ✅ 5/5 passed (8 min)
   Cost: $0.23

✅ Task 3.1 - Model Config & Connection
   Implementation: ✅ (32 min)
   Tests: ✅ 5/5 passed (6 min)
   Cost: $0.25
   Issues: 2 auto-fixed during testing

Progress: 100% complete (3/3)
Time: 1h 50m elapsed
Cost: $0.68
Tests: 15/15 scenarios passed (100%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**After batch completes:**
```
✅ BATCH COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executed: 3 tasks
Duration: 1h 50m

SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Task 2.2 - File Explorer Sidebar
   Tests: 5/5 ✅ | 31 min | $0.20

✅ Task 2.3 - Monaco Editor + Tabs + Save
   Tests: 5/5 ✅ | 36 min | $0.23

✅ Task 3.1 - Model Config & Connection
   Tests: 5/5 ✅ | 38 min | $0.25
   Note: 2 issues auto-fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BATCH RESULTS:
  Total Tasks: 3/3 completed ✅
  All Tests Passed: 15/15 scenarios (100%)
  Issues Fixed: 2 (auto-fixed during testing)
  Total Duration: 1h 50m
  Total Cost: $0.68

QUALITY METRICS:
  Console Errors: 0
  Network Errors: 0
  Security Issues: 0
  TypeScript Errors: 0
  Test Pass Rate: 100%

OVERALL PROGRESS:
  Phase 2: 3/3 ████████████ 100% COMPLETE
  Phase 3: 1/2 ██████░░░░░░ 50%
  Overall: 6/12 ██████░░░░░░ 50%
  Total Project Cost: $1.42

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
  - Phase 2 complete! 🎉
  - Ready to continue Phase 3: AI Chat & Agent
  - Next task: Task 3.2 - AI Chat & Agent Panel

Continue? (yes/pause/review)
```

---

## Safety Checks

**Before starting batch:**
```
🛡️ PRE-BATCH SAFETY CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking system state...

✓ All previous tasks marked as completed
✓ No tasks marked as failed
✓ No tasks blocked
✓ All previous tests passed
✓ Backend running: http://localhost:3001
✓ Frontend running: http://localhost:3000
✓ WebSocket accessible: ws://localhost:3001
✓ TypeScript build clean (backend + frontend)
✓ No console errors from previous tasks
✓ Git: All changes committed
✓ Disk space: 45GB available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ System ready for batch execution
```

**If safety checks fail:**
```
⚠️ SAFETY CHECK FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues found:

❌ Task 2.1 has failing tests (3/5 failed)
⚠️ TypeScript build has errors (backend: 2 errors)
⚠️ Backend not responding on port 3001

Cannot start batch with these issues.

Recommendations:
  1. Fix failing tests in Task 2.1
  2. Run: cd backend && npm run build
  3. Start backend: cd backend && npm run dev

Fix these issues? (yes/no)
```

---

## Batch Execution Strategies

### Strategy 1: Phase Completion

**Complete an entire phase in one batch:**
```
User: Execute all remaining tasks in Phase 2

📋 PHASE BATCH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 2: File System & Editor
  Completed: 1/3
  Remaining: 2 tasks

Will execute:
  ✅ 2.1 - Backend File System API (done)
  → 2.2 - File Explorer Sidebar
  → 2.3 - Monaco Editor + Tabs + Save

Estimated: 1h 10m | ~$0.45

Proceed? (yes/no)
```

---

### Strategy 2: Time-Boxed Execution

**Execute tasks for a specific duration:**
```
User: Execute tasks for the next 2 hours

⏱️ TIME-BOXED BATCH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: 2 hours
Will execute as many tasks as possible

Starting tasks:
  2.2, 2.3, 3.1, 3.2 (estimated 3-4 tasks)

Time check after each task.
Will stop at 2-hour mark or completion.

Start? (yes/no)
```

**During execution:**
```
⏱️ TIME CHECK [After Task 2.3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Elapsed: 1h 10m / 2h
Remaining: 50 minutes

Completed: 2 tasks
Estimated next task: 35 minutes

Continue? (yes/no/status)
```

---

### Strategy 3: Cost-Limited Execution

**Execute tasks within budget:**
```
User: Execute tasks with $0.50 budget

💰 BUDGET-LIMITED BATCH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Budget: $0.50
Current cost: $0.42
Available: $0.08

Estimated tasks within budget:
  2.2 ($0.20) ⚠️ Over budget

Insufficient budget for next task.
Recommend increasing budget or pausing.

Proceed with $0.20 task anyway? (yes/no)
```

---

## Pause and Resume

**User can pause anytime:**
```
User: pause

⏸️ BATCH PAUSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Batch Progress: 2/3 tasks

Completed:
  ✅ 2.2 - File Explorer Sidebar
  ✅ 2.3 - Monaco Editor + Tabs + Save

Remaining:
  ⏳ 3.1 - Model Config & Connection

To resume: "resume batch" or "continue"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Error Recovery

**If batch encounters errors:**
```
❌ BATCH ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.3 failed during implementation
Error: TypeScript compilation error in MonacoEditor.tsx
       Cannot find module '@monaco-editor/react' (not installed)

Batch stopped at: 1/3 tasks

Completed:
  ✅ 2.2 - File Explorer Sidebar (all tests ✅)

Failed:
  ❌ 2.3 - Monaco Editor + Tabs + Save
     Import error: @monaco-editor/react not installed

Not Started:
  ⏳ 3.1 - Model Config & Connection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:

1️⃣  fix-and-resume  - Fix Task 2.3 and continue batch
2️⃣  skip-and-resume - Skip 2.3, continue with 3.1
3️⃣  stop            - Stop batch, review error
4️⃣  rollback        - Undo 2.2, start over

Your choice:
```

---

## Progress Tracking Dashboard

**Show detailed progress anytime during batch:**
```
User: status

📊 BATCH EXECUTION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Batch: 2/3 tasks (67%)

Timeline:
  ✅ 10:00 - 10:31 | Task 2.2 (31m)
  ✅ 10:31 - 11:07 | Task 2.3 (36m)
  🔄 11:07 - now   | Task 3.1 (14m so far)

Performance:
  Average: 33 min/task
  Tests: 10/10 passed (100%)
  Issues: 0 auto-fixed

Cost:
  Spent: $0.43
  Estimated remaining: $0.25
  Total projected: $0.68

Quality:
  Console errors: 0
  Network errors: 0
  Security issues: 0
  TypeScript errors: 0
  Failed tests: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Batch continues...
```

---

## Batch Completion Options

**After batch finishes:**
```
✅ BATCH COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Shows summary as above]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's next?

1️⃣  continue      - Start another batch
2️⃣  review-all    - Review all work from this batch
3️⃣  test-manually - Let me test everything manually
4️⃣  commit        - Commit all changes to git
5️⃣  report        - Generate detailed batch report
6️⃣  pause         - Stop for now

Your choice:
```

---

## Command Variations

**User can start with different commands:**
```bash
# Basic continuation
/continue-tasks
continue

# Specific number
/continue-tasks 3
batch 3

# Until blocked
/continue-tasks until-blocked

# Complete phase
/continue-tasks phase 2

# Time-boxed
/continue-tasks 2h

# Budget-limited
/continue-tasks budget $0.50

# Auto mode (no prompts)
/continue-tasks auto 3
```

---

## Summary

**Key Features:**
- ✅ Batch execution with automatic testing
- ✅ TypeScript build verification after each task
- ✅ Stops on test failures (with auto-fix option)
- ✅ Progress tracking throughout batch
- ✅ Multiple execution strategies (phase, time, budget)
- ✅ Pause and resume capability
- ✅ Error recovery options
- ✅ Safety checks before starting
- ✅ Comprehensive reporting after completion
- ✅ Token and cost tracking per task and batch

**Benefits:**
- 🚀 Faster development (multiple tasks in one go)
- 🧪 Every task tested automatically
- 🛡️ Safety checks prevent issues
- 📊 Clear progress visibility
- 💰 Cost tracking and limits
- 🔧 Auto-fix for common issues
- 📝 Complete documentation generated