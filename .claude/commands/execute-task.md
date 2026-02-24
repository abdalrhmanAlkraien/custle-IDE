# Execute Single Task - Interactive Mode with Automated Testing

Execute the next pending task, generate test scenarios, run tests, and wait for user review before proceeding.

---

## 🚨 CRITICAL: Read This First

**Before executing ANY task, you MUST read these files in order:**

1. **`.claude/AI-AGENT-EXECUTION-GUIDE.md`** ⭐ MOST IMPORTANT
   - Complete 11-step workflow with full details
   - Quality standards and gates
   - Testing requirements (curl / WebSocket / Playwright)
   - Documentation requirements
   - Cost tracking methodology
   - Critical NEVER/ALWAYS rules

2. **`.claude/CLAUDE.md`**
   - Project context and overview
   - Tech stack and architecture
   - NeuralIDE rules (Monaco imports, path security, apiKey handling)

3. **`.claude/systemTasks.md`**
   - Current progress tracking
   - Task dependencies
   - Find next pending task

4. **`.claude/PhaseX/Task X.Y.md`** (the specific task)
   - Full requirements — NEVER assume what a task needs
   - Expected outputs
   - Acceptance criteria

**READ THE EXECUTION GUIDE FIRST!** It contains detailed instructions for each step. This file is the workflow overview — the execution guide has complete details.

**DO NOT proceed without reading AI-AGENT-EXECUTION-GUIDE.md!**

---

## 🎯 Quick Start

When user says **"execute task"** or **"continue"**, follow this workflow:

```
1. Read .claude/systemTasks.md       → Find next PENDING task
2. Verify all dependencies are ✅ COMPLETED → Stop if any PENDING
3. Read .claude/PhaseX/Task X.Y.md  → Understand requirements
4. Present task summary → Wait for user confirmation
5. Execute implementation → Follow task definition exactly
6. TypeScript verification → npm run build (both) → 0 errors required
7. Generate test scenarios → .claude/TestX/Task X.Y.md
8. Execute tests → curl / WebSocket / Playwright
9. Record test results → .claude/processed/Task X.Y - Test Results.md
10. Create implementation doc → .claude/processed/Task X.Y.md
11. Update systemTasks.md → EXACTLY ONCE, mark complete with metrics
12. Present results → Show summary, offer next steps
```

**Cannot skip steps. All must complete successfully.**

**NOTE:** Detailed instructions for each step are in `.claude/AI-AGENT-EXECUTION-GUIDE.md`

---

## Workflow

### Step 1: Identify Next Task

**See AI-AGENT-EXECUTION-GUIDE.md Step 1 for complete details**

1. Read `.claude/systemTasks.md`
2. Find first task with status ⏳ PENDING
3. **Verify dependencies** — check all listed dependencies are ✅ COMPLETED

**If dependency is PENDING:**
```
⚠️ Cannot proceed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task X.Y needs Task X.Z (⏳ PENDING)

Options:
1️⃣ execute-dependency - Do Task X.Z first
2️⃣ skip               - Skip Task X.Y for now
```

**If ready:**
```
📋 NEXT TASK IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task Number: X.Y
Task Name: [Name]
Phase: Phase X
Task Definition: .claude/PhaseX/Task X.Y.md

Dependencies:
  ✅ Task X.Z - [Name] (completed)
  ✅ Task X.W - [Name] (completed)

Status: ⏳ PENDING → Ready to execute

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to start? (yes/no/skip)
```

**Wait for user response:**
- **yes** → Proceed to Step 2
- **no** → Stop execution
- **skip** → Mark as ⚠️ BLOCKED, find next task

---

### Step 2: Read & Display Task Definition

**See AI-AGENT-EXECUTION-GUIDE.md Step 3 for complete details**

If user says **yes**:

1. **Read entire task file:** `.claude/PhaseX/Task X.Y.md`
2. **Display summary:**
```
📖 TASK DETAILS - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Copy the "Description" section from Task X.Y.md verbatim]

KEY REQUIREMENTS:
[Extract bullet points from "Requirements" section]

EXPECTED OUTPUTS:
[Extract from "Expected Outputs" section]

TEST CRITERIA:
[Extract from "Test Criteria" section]

ESTIMATED DURATION:
[Extract from "Estimated Duration" section]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full task definition: .claude/PhaseX/Task X.Y.md

Proceed with execution? (yes/no/read-full)
```

3. **Wait for confirmation:**
   - **yes** → Proceed to Step 3
   - **no** → Return to Step 1
   - **read-full** → Display complete task file, then ask again

---

### Step 3: Execute Implementation

**See AI-AGENT-EXECUTION-GUIDE.md Steps 5-6 for complete details**

If user confirms:

1. **Update systemTasks.md:**
   - Status: ⏳ PENDING → 🔄 IN_PROGRESS
   - Record start timestamp

2. **Update `.claude/prompt.md`:**
   - Copy full task details to file
   - Set status to IN_PROGRESS

3. **Read docs before coding:**
```bash
cat docs/CODING_STANDARDS.md
cat docs/BACKEND_ARCHITECTURE.md   # for backend tasks
cat docs/FRONTEND_ARCHITECTURE.md  # for frontend tasks
cat docs/API_INTEGRATION.md        # for API tasks
```

4. **Create all files per task definition exactly**

5. **Show progress:**
```
⚙️  IMPLEMENTATION - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️  Step 1/N: [Description]...
    ✓ [File created]
    ✓ [File created]

⚙️  Step 2/N: [Description]...
    ✓ [Done]

[... continues per task steps ...]

🔨 TypeScript verification...
    ✓ cd backend && npm run build  → 0 errors
    ✓ cd frontend && npm run build → 0 errors

✅ IMPLEMENTATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**TypeScript verification is mandatory. Fix ALL errors before proceeding to tests.**

---

### Step 4: Generate Test Scenarios

**See AI-AGENT-EXECUTION-GUIDE.md Step 7 for complete details**

After implementation completes:

```
🧪 GENERATING TEST SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading task definition: .claude/PhaseX/Task X.Y.md

Extracting test requirements:
  ✓ Identified N test scenarios from acceptance criteria
  ✓ Found edge cases to test
  ✓ Noted security checks required
  ✓ Noted regression checks needed

Generating: .claude/TestX/Task X.Y.md

Test scenarios generated:
  1. [Primary Functionality] - Main success path
  2. [Error Handling] - Invalid inputs / edge cases
  3. [Security Check] - e.g. path traversal → 403
  4. [Integration] - Component interaction
  5. [Regression] - Previous features still work

✓ Test file created: .claude/TestX/Task X.Y.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceeding to test execution...
```

**Test type is determined by the task:**
- **Backend API tasks** → curl commands
- **WebSocket tasks** → Node.js WebSocket client
- **Frontend tasks** → Playwright (Computer Use)
- **Full-stack tasks** → All of the above

**Edge cases to always check by task type:**
- File route tasks → path traversal returns 403, apiKey absent
- Model/AI tasks → apiKey never appears in GET responses
- Terminal tasks → PTY sessions cleaned up on WebSocket close
- Autocomplete tasks → 700ms debounce, AbortController on completion
- Monaco tasks → dynamic import with `ssr: false`, no SSR crash

---

### Step 5: Execute Tests

**See AI-AGENT-EXECUTION-GUIDE.md Step 8 for complete details**

Run all generated scenarios:

```
🧪 EXECUTING TESTS - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test File: .claude/TestX/Task X.Y.md
Total Scenarios: 5
Test Types: [curl / WebSocket / Playwright]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Scenario 1: [Name]
      Status: 🔄 Running...
      ✓ [Check 1]
      ✓ [Check 2]
      ✓ [Check 3]
      Status: ✅ PASSED (Xm Xs)

[2/5] Scenario 2: [Name]
      ...

[... all scenarios ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 INSPECTION RESULTS

Network Analysis:
  ✓ All API calls successful
  ✓ Correct request/response format
  ✓ Status codes as expected

Console Analysis:
  ✓ 0 errors
  ✓ 0 warnings

Security Analysis:
  ✓ Path traversal blocked (403) [if applicable]
  ✓ No apiKey in any response [if applicable]
  ✓ Workspace root enforced [if applicable]

TypeScript Analysis:
  ✓ backend: 0 errors
  ✓ frontend: 0 errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ALL TESTS PASSED (5/5)

Test Duration: Xm Xs
Console Errors: 0
Network Errors: 0
Security Issues: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If tests fail:**
```
❌ TEST FAILURES DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Results: 3/5 passed, 2/5 failed

Failed Scenarios:

[3/5] Scenario 3: [Name]
      Status: ❌ FAILED
      Expected: [expected]
      Actual: [actual]

[4/5] Scenario 4: [Name]
      Status: ❌ FAILED
      Issue: [issue description]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:
1️⃣  auto-fix   - Analyze and fix automatically
2️⃣  guide-fix  - Walk through fix together
3️⃣  show-code  - Show failing test code
4️⃣  skip-tests - Mark complete anyway (not recommended)

Your choice:
```

**Cannot mark COMPLETED unless ALL tests pass.**

---

### Step 6: Record Test Results

**See AI-AGENT-EXECUTION-GUIDE.md Step 9 for complete details**

Save comprehensive results:

```
📝 RECORDING TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating: .claude/processed/Task X.Y - Test Results.md

Sections included:
  ✓ Executive Summary
  ✓ Detailed Scenario Results (N scenarios)
  ✓ Network Analysis
  ✓ Console Analysis
  ✓ Security Analysis
  ✓ TypeScript Build Status
  ✓ Issues Found & Fixed (if any)
  ✓ Regression Test Results

✓ Test results saved successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 7: Present Results

**See AI-AGENT-EXECUTION-GUIDE.md Step 11 for complete details**

Display comprehensive completion summary:

```
✅ TASK COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task X.Y: [Name]
Duration: XX minutes (implementation: XXm, testing: XXm)
Status: ✅ COMPLETED

📁 FILES CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[List each file from "Expected Outputs" with ✓]
✓ [file path] - [description]
✓ [file path] - [description]

📝 FILES MODIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ [modified file] - [what changed]

✅ TESTS PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Status: ✅ All Passed (N/N scenarios)
Test File: .claude/TestX/Task X.Y.md
Test Duration: Xm Xs

Scenarios Tested:
✓ Scenario 1: [Name] - PASSED
✓ Scenario 2: [Name] - PASSED
[... all scenarios ...]

Quality Checks:
✓ Console Errors: 0
✓ Network Errors: 0
✓ TypeScript: backend 0 errors, frontend 0 errors
[✓ Security: Path traversal blocked ✅] (if applicable)
[✓ Security: apiKey absent from responses ✅] (if applicable)

Test Results: .claude/processed/Task X.Y - Test Results.md

📊 TOKEN USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implementation:
  Input Tokens:    _____
  Output Tokens:   _____
  Cost:            $_____

Testing:
  Input Tokens:    _____
  Output Tokens:   _____
  Cost:            $_____

Total Task Cost:   $_____

📈 PROJECT PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase X:   [N/M] ████░░░░░░░░ XX%
Overall:   [N/12] █░░░░░░░░░░  X.X%
Total Cost: $X.XX

📄 DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implementation: .claude/processed/Task X.Y.md
Test Results:   .claude/processed/Task X.Y - Test Results.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 7.5: Update System Files

**See AI-AGENT-EXECUTION-GUIDE.md Step 10 for complete details**

**Before presenting options to user:**

1. **Create Implementation Documentation**
   - Create `.claude/processed/Task X.Y.md`
   - Include: summary, files created, decisions made, tokens, issues

2. **Create Test Results Documentation**
   - Create `.claude/processed/Task X.Y - Test Results.md`
   - Include: executive summary, detailed scenario results, security analysis, issues fixed

3. **Update systemTasks.md — EXACTLY ONCE**
   - Status: 🔄 IN_PROGRESS → ✅ COMPLETED
   - Fill in Completed timestamp, Duration, Input/Output/Total Tokens, Cost
   - Add testing section:
```markdown
- **Test Status**: ✅ PASSED
- **Test File**: `.claude/TestX/Task X.Y.md`
- **Test Scenarios**: N total (N passed, 0 failed)
- **Test Duration**: Xm Xs
- **Test Cost**: $_____
- **Console Errors**: 0
- **Security Issues**: 0
- **TypeScript Errors**: 0
- **Test Results File**: `.claude/processed/Task X.Y - Test Results.md`
```
- Update Phase totals, Progress Summary, Token Usage table, Recent Activity Log

4. **Keep prompt.md as-is** — do NOT clear until user says "continue"

---

### Step 8: User Review & Decision

**See AI-AGENT-EXECUTION-GUIDE.md for complete handling details**

```
🔍 REVIEW OPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?

1️⃣  continue       - Start next task (Task X.Y+1)
2️⃣  review         - Show files created
3️⃣  review-tests   - Review test results in detail
4️⃣  re-test        - Run tests again
5️⃣  fix            - Something's wrong, let's fix it
6️⃣  details        - Show full task report
7️⃣  pause          - Stop for now, continue later
8️⃣  skip-next      - Skip next task and go to X.Y+2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your choice (1-8 or type command):
```

**Wait for user input.**

---

### Step 9: Handle User Choice

**See AI-AGENT-EXECUTION-GUIDE.md for complete option handling**

#### Option 1: continue
```
Check: All tests passed? ✅ Yes
  ↓
Clear .claude/prompt.md
  ↓
Set prompt.md status → READY_FOR_NEXT_TASK
  ↓
Go to Step 1 (next PENDING task)
```

**If tests failed:**
```
⚠️  WARNING: Tests Failed

Task X.Y has N failing tests. Proceeding is not recommended.

Failed: [list of failed scenarios]

Options:
1️⃣  fix-first   - Fix issues before continuing (recommended)
2️⃣  continue    - Continue anyway (may cause problems)
3️⃣  back        - Go back to review options
```

---

#### Option 2: review
```
📄 FILES CREATED:
1. [path] (N lines)
2. [path] (N lines)
...

Which to review? (1-N, filename, or 'all')

[Shows file contents]

Review another file? (yes/no/back)
```

---

#### Option 3: review-tests
```
📊 TEST RESULTS - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executive Summary:
  ✅ ALL TESTS PASSED (N/N)
  Duration: Xm Xs
  Console Errors: 0
  Security Issues: 0
  TypeScript Errors: 0

Detailed Results:
[Full per-scenario breakdown with inputs, outputs, assertions]

Security Analysis:
  ✓ Path traversal: Blocked (403) [if applicable]
  ✓ apiKey: Absent from all responses [if applicable]

TypeScript:
  ✓ backend: 0 errors
  ✓ frontend: 0 errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Back to options? (yes)
```

---

#### Option 4: re-test
```
🔄 RE-TESTING Task X.Y

This will re-run all N test scenarios.
Continue? (yes/no)

[Runs tests — same as Step 5]

✅ RE-TEST COMPLETE

Previous: N/N passed
Current:  N/N passed
Status: Consistent ✅

Updated: .claude/processed/Task X.Y - Test Results.md

Back to options? (yes)
```

---

#### Option 5: fix

```
🔧 FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What needs to be fixed?

User: [describes issue]

Analyzing...

ISSUE: [root cause]
CAUSE: [why it happened]

PROPOSED SOLUTION:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Files to modify:
  - [file path]

Proceed with fix? (yes/no)

[If yes: applies fix → TypeScript verify → re-run affected tests]

✓ Fix applied
✓ TypeScript: 0 errors
✓ Re-testing affected scenarios...
✓ [Scenario N]: ✅ NOW PASSES

✅ FIX APPLIED & VERIFIED

Test Status: All tests now pass (N/N) ✅

Back to review options? (yes)
```

---

#### Option 6: details
```
📊 DETAILED TASK REPORT - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPLEMENTATION DOCUMENTATION:
[Full content of .claude/processed/Task X.Y.md]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST RESULTS SUMMARY:
  Status: ✅ All Passed (N/N)
  Test File: .claude/TestX/Task X.Y.md
  Results File: .claude/processed/Task X.Y - Test Results.md

ORIGINAL TASK DEFINITION:
[Full content of .claude/PhaseX/Task X.Y.md]

View full test results? (yes/no)
Back to review options? (yes)
```

---

#### Option 7: pause
```
⏸️  PAUSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLETED THIS SESSION:
  ✅ Task X.Y: [Name]
     Tests: N/N passed ✅

PROGRESS:
  Phase X:  [N/M] tasks done
  Overall:  [N/12] tasks (X.X%)
  Total Cost: $X.XX

TEST PROGRESS:
  Tasks Tested: N
  Pass Rate: 100%

TO RESUME:
  Say: "Continue from where we left off"
  Or: "/execute-task"

Next task: Task X.Y+1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

#### Option 8: skip-next

- Ask for confirmation: "This will mark Task X.Y+1 as BLOCKED. Sure?"
- If yes: update systemTasks.md with BLOCKED status + reason
- Ask: "Why skip? (will be noted in systemTasks.md)"
- Proceed to next non-blocked pending task

---

## ✅ Quality Checklist

Before marking COMPLETED — all must be true:

**Implementation:**
- [ ] All files from "Expected Outputs" created
- [ ] TypeScript: `cd backend && npm run build` → 0 errors
- [ ] TypeScript: `cd frontend && npm run build` → 0 errors
- [ ] No `any` types
- [ ] No Monaco/xterm module-level imports (dynamic only)
- [ ] No apiKey returned in any API response
- [ ] All file paths validated against workspace root

**Testing:**
- [ ] Test scenarios generated (`.claude/TestX/Task X.Y.md`)
- [ ] ALL test scenarios executed
- [ ] ALL tests passed
- [ ] 0 console errors
- [ ] 0 network errors
- [ ] Security checks passed (path traversal, apiKey) if applicable

**Documentation:**
- [ ] `.claude/processed/Task X.Y.md` created
- [ ] `.claude/processed/Task X.Y - Test Results.md` created
- [ ] systemTasks.md updated EXACTLY ONCE

**Only then:** Status = ✅ COMPLETED

---

## Token Tracking

### Cost Formula
```
Input Cost  = (Input Tokens  / 1,000,000) × $3.00
Output Cost = (Output Tokens / 1,000,000) × $15.00
Total Cost  = Input Cost + Output Cost
```

### Track Separately
```
Implementation:
  Input:  _____ tokens → $_____
  Output: _____ tokens → $_____
  Subtotal: $_____

Testing:
  Input:  _____ tokens → $_____
  Output: _____ tokens → $_____
  Subtotal: $_____

Total Task Cost: $_____
```

Log both in systemTasks.md.

---

## Error Handling

### Task Definition File Missing
```
❌ ERROR: Task Definition Not Found

Expected: .claude/PhaseX/Task X.Y.md
Status: File not found

Options:
1️⃣  skip   - Mark as ⚠️ BLOCKED and continue
2️⃣  create - Create a basic task definition
3️⃣  stop   - Stop execution
```

### TypeScript Build Fails
```
❌ TYPESCRIPT BUILD FAILED

cd backend && npm run build

Errors:
  backend/src/routes/files.ts:23:5
  TS7006: Parameter 'req' implicitly has an 'any' type.

Auto-fixing TypeScript errors...
[fix → rebuild → verify 0 errors before proceeding to tests]
```

### Tests Fail
```
❌ TESTS FAILED (3/5 passed)

Failed Scenarios:
  [3/5] [Name] — [issue]
  [4/5] [Name] — [issue]

Options:
1️⃣  auto-fix      - Analyze and fix automatically
2️⃣  guide-fix     - Walk through fix
3️⃣  show-tests    - Show failing test code
4️⃣  retry         - Retry after manual fix
5️⃣  skip          - Skip this task (mark BLOCKED)
```

### WebSocket Connection Refused
```
⚠️  WebSocket connection refused

Check:
  - Backend running on port 3001?
  - URL uses ws:// not http://?
  - CORS configured for localhost:3000?

Start backend: cd backend && npm run dev
```

---

## NeuralIDE-Specific Rules

### NEVER:
- Skip TypeScript build verification
- Allow path traversal (validate all paths against workspace root)
- Return `apiKey` in any backend response
- Import Monaco or xterm at module level (must be `dynamic` with `ssr: false`)
- Update systemTasks.md more than ONCE per task
- Mark a task COMPLETED with failing tests

### ALWAYS:
- Run `npm run build` for backend AND frontend after implementation
- Test path traversal security on all file route tasks
- Verify `apiKey` absent from model API responses
- Kill PTY sessions in tests (Task 4.1)
- Use `ws://` (not `http://`) for WebSocket URLs
- Read the task definition file — never assume requirements

---

## 📚 Reference Files

**For complete details on every step, see:**
- **`.claude/AI-AGENT-EXECUTION-GUIDE.md`** ⭐ — Complete 11-step workflow with examples
- **`.claude/CLAUDE.md`** — NeuralIDE project overview and rules
- **`.claude/systemTasks.md`** — Progress tracking and task list
- **`.claude/PhaseX/Task X.Y.md`** — Individual task definitions
- **`docs/TEST_SCENARIOS.md`** — Testing methodology per task type
- **`docs/CODING_STANDARDS.md`** — TypeScript rules, security requirements
- **`docs/BACKEND_ARCHITECTURE.md`** — Service layer patterns
- **`docs/FRONTEND_ARCHITECTURE.md`** — Monaco/xterm import rules, state management

**This execute-task.md provides workflow overview. The execution guide has the full implementation details.**

---

**Quality over speed. Complete, tested, documented, secure. No shortcuts.**