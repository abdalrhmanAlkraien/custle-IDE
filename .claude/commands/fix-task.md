# Fix Task - Issue Resolution Command with Testing

Fix issues in any completed or in-progress task with comprehensive error handling, automated re-testing, and documentation.

---

## Command Usage

### Fix Last Task (Default)
```
/fix
/fix Monaco editor not rendering
```
Fixes the most recently completed task.

### Fix Specific Task
```
/fix-task 2.1
/fix Task 2.1 - Path traversal not blocked
```
Fixes a specific task by number.

### Fix Tests Only
```
/fix-tests 2.1
/fix-task 2.1 --tests-only
```
Fixes or updates test scenarios without changing implementation.

### Fix Both Code and Tests
```
/fix-both 2.1
/fix-task 2.1 --fix-both
```
Fixes both implementation and test scenarios.

### Emergency Fix
```
/fix-urgent
```
Immediately fixes critical issues blocking progress.

---

## When to Use This Command

Use `/fix` when:
- ✅ Task completed but has bugs
- ✅ Tests are failing
- ✅ User found issues during testing
- ✅ TypeScript build errors after implementation
- ✅ Security check failing (path traversal not blocked, apiKey in response)
- ✅ Code needs refinement
- ✅ Console errors appear
- ✅ Test scenarios need updating

Do NOT use for:
- ❌ New feature requests (create new task)
- ❌ Design changes (not bugs)
- ❌ Refactoring (unless fixing issue)

---

## Workflow

### Step 1: Identify Task to Fix

**If no task specified:**
```
🔧 FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent completed tasks:
1. Task 2.3: Monaco Editor + Tabs + Save (10 min ago)
   Status: ✅ COMPLETED | Tests: ✅ 5/5 passed

2. Task 2.2: File Explorer Sidebar (45 min ago)
   Status: ✅ COMPLETED | Tests: ⚠️ 4/5 passed

3. Task 2.1: Backend File System API (2 hours ago)
   Status: ✅ COMPLETED | Tests: ❌ 3/5 passed

4. Task 1.2: IDE Shell Layout & State Store (3 hours ago)
   Status: ✅ COMPLETED | Tests: ✅ 4/4 passed

5. Task 1.1: Project Scaffold & Dependencies (4 hours ago)
   Status: ✅ COMPLETED | Tests: ✅ 4/4 passed

Which task needs fixing? (1-5 or task number):
```

**If task specified:**
```
🔧 FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Targeting: Task 2.1 - Backend File System API
Status: ✅ COMPLETED (2 hours ago)
Files created: 4 files

TEST STATUS:
  Status: ❌ Failed (3/5 passed)
  Test File: .claude/Test2/Task 2.1.md
  Results: .claude/processed/Task 2.1 - Test Results.md

Failed Tests:
  [3/5] Path traversal not blocked - FAILED
  [4/5] Atomic write cleanup - FAILED

Ready to diagnose? (yes/no/show-tests)
```

---

### Step 2: Determine Fix Type

**Ask user what needs fixing:**
```
🔍 FIX TYPE SELECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1 has failing tests and may have code issues.

What needs fixing?

1️⃣  fix-code      - Fix implementation code
2️⃣  fix-tests     - Fix/update test scenarios
3️⃣  fix-both      - Fix both code and tests
4️⃣  auto-detect   - Let me analyze and decide
5️⃣  describe      - Let me describe the issue

Your choice (1-5):
```

---

### Step 3: Gather Issue Information

**If fixing code:**
```
🔍 CODE ISSUE DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixing: Task 2.1 - Backend File System API

Please describe the issue:
- What's not working?
- What error messages do you see?
- What did you expect to happen?
- When does the issue occur?

You can paste error messages or describe the behavior.

Related Failed Tests:
  [3/5] Path traversal not blocked — GET ../../etc/passwd returns 200
  [4/5] Atomic write cleanup — .tmp file left on disk after error

These test failures are likely related to your issue.

[Waiting for user input...]
```

**If fixing tests:**
```
🔍 TEST ISSUE DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixing Tests: Task 2.1 - Backend File System API

Current failing tests:
  [3/5] Path Traversal Blocked — FAILED
        Issue: Returns 200 instead of 403

  [4/5] Atomic Write Cleanup — FAILED
        Issue: .tmp file still present after error

What's wrong with the tests?
1. Tests are checking wrong endpoint or payload
2. Tests have wrong expectations
3. Tests are checking too fast (timing issue)
4. Tests are correct, code needs fixing
5. Other (describe)

Your choice:
```

---

### Step 4: Analyze the Issue

**For code issues:**
```
🔍 ANALYZING ISSUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading related files...
✓ backend/src/routes/files.ts
✓ backend/src/services/fileService.ts
✓ backend/src/utils/pathSecurity.ts

Checking test results...
✓ .claude/processed/Task 2.1 - Test Results.md

Running TypeScript check...
✓ cd backend && npm run build → 0 errors

Cross-referencing with test failures:
  Test [3/5]: Expects 403 — validatePath() never called in route
  Test [4/5]: Expects no .tmp file — catch block missing fs.unlink

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔎 ROOT CAUSE ANALYSIS

ISSUE 1: Path traversal not blocked
  Location: backend/src/routes/files.ts
  Impact: Security vulnerability — file paths not validated
  Related Test: [3/5]

ISSUE 2: Atomic write cleanup missing
  Location: backend/src/services/fileService.ts
  Impact: Orphaned .tmp files after failed writes
  Related Test: [4/5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For test issues:**
```
🔍 ANALYZING TEST ISSUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading test file: .claude/Test2/Task 2.1.md
Reading test results: .claude/processed/Task 2.1 - Test Results.md
Reading implementation: backend/src/routes/files.ts

ISSUE 1: Wrong curl flags in test
  Test sends: curl /api/files/read?path=../../etc/passwd
  Missing: Should check response status code with -o /dev/null -w "%{http_code}"
  Fix: Update curl command in test scenario

ISSUE 2: Timing issue in watcher test
  Test checks immediately after file write
  Watcher debounces 300ms before broadcasting
  Fix: Add 500ms wait before checking WebSocket message

ANALYSIS:
  Tests are checking correctly but using wrong curl flags / missing delays.
  Implementation is correct.
  Tests need updating to match actual behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 5: Propose Solution

**For code fixes:**
```
💡 PROPOSED SOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIX STRATEGY: Fix code to make tests pass

CHANGES REQUIRED:

1. Add path validation in file route
   File: backend/src/routes/files.ts
   Action: Import validatePath; call before every fs operation
   Catch PathTraversalError → return 403

2. Add cleanup in atomic write
   File: backend/src/services/fileService.ts
   Action: In catch block: await fs.unlink(tmpPath).catch(() => {})

FILES TO MODIFY:
✓ backend/src/routes/files.ts
✓ backend/src/services/fileService.ts

TESTS TO RE-RUN AFTER FIX:
All 5 test scenarios will be re-run automatically:
  [1/5] Read file — success
  [2/5] Write file — success
  [3/5] Path traversal blocked (currently failing)
  [4/5] Atomic write cleanup (currently failing)
  [5/5] File watcher broadcasts change

Expected outcome: 5/5 tests pass ✅

TIME ESTIMATE: 6 minutes
TOKEN ESTIMATE: ~1,800 tokens ($0.03)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTERNATIVE SOLUTIONS:

Option 2: Fix tests instead of code
  Update test expectations to match current behavior
  Pros: Faster (2 min)
  Cons: Leaves security vulnerability unresolved ⚠️

Option 3: Meet in the middle
  Fix security issue, update cleanup test expectation
  Pros: Balanced approach

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with main solution? (yes/no/alternative)
```

**For test fixes:**
```
💡 PROPOSED TEST FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIX STRATEGY: Update test commands to match implementation

CHANGES REQUIRED:

Test File: .claude/Test2/Task 2.1.md

1. Fix Scenario 3: Path Traversal Check
   Current: curl "http://localhost:3001/api/files/read?path=../../etc/passwd"
   Fixed:   STATUS=$(curl -o /dev/null -w "%{http_code}" "http://localhost:3001/api/files/read?path=../../etc/passwd")
            [ "$STATUS" = "403" ]
   Why: Must check HTTP status code, not just response body

2. Fix Scenario 4: Watcher Timing
   Current: Check WebSocket message immediately after write
   Fixed:   Add sleep 0.5 before checking WebSocket message
   Why: Watcher debounces 300ms before broadcasting

FILES TO MODIFY:
✓ .claude/Test2/Task 2.1.md

TESTS TO RE-RUN AFTER FIX:
Only affected scenarios:
  [3/5] Path traversal (updated curl command)
  [4/5] Watcher timing (added delay)

Expected outcome: 5/5 tests pass ✅

TIME ESTIMATE: 3 minutes
TOKEN ESTIMATE: ~600 tokens ($0.01)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: This assumes implementation is correct.
If code is wrong, choose "fix-code" instead.

Proceed? (yes/no/fix-code-instead)
```

---

### Step 6: Implement Fix

**For code fixes:**
```
⚙️  IMPLEMENTING CODE FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixing Task 2.1...

Step 1/3: Adding path validation to file routes...
  ✓ Imported validatePath from utils/pathSecurity.ts
  ✓ Added validatePath() call before readFile
  ✓ Added validatePath() call before writeFile
  ✓ Catch PathTraversalError → 403

Step 2/3: Adding atomic write cleanup...
  ✓ Added fs.unlink(tmpPath).catch(() => {}) in catch block

Step 3/3: Verifying TypeScript...
  ✓ cd backend && npm run build → 0 errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes Applied:
✓ Modified backend/src/routes/files.ts
✓ Modified backend/src/services/fileService.ts

Files Modified: 2 files
```

**For test fixes:**
```
⚙️  IMPLEMENTING TEST FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updating test scenarios...

Step 1/2: Updating Scenario 3...
  ✓ Fixed curl command to check HTTP status code
  ✓ Updated assertion to verify 403 response

Step 2/2: Updating Scenario 4...
  ✓ Added sleep 0.5 before WebSocket message check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes Applied:
✓ Updated .claude/Test2/Task 2.1.md

Files Modified: 1 file

Ready to re-run tests...
```

---

### Step 7: Re-Run Tests

**After code fixes:**
```
🧪 RE-RUNNING TESTS AFTER FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test File: .claude/Test2/Task 2.1.md
Running all 5 scenarios...

Previous Results: 3/5 passed (2 failed)
Target: 5/5 pass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Scenario 1: Read File
      Status: ✅ STILL PASSING
      Duration: 0m 18s

[2/5] Scenario 2: Write File
      Status: ✅ STILL PASSING
      Duration: 0m 24s

[3/5] Scenario 3: Path Traversal Blocked ✨ FIXED
      Status: ✅ NOW PASSES (was failing)
      Previous: 200 — file contents returned
      Now: 403 { "error": "Access denied" }
      Duration: 0m 08s

[4/5] Scenario 4: Atomic Write Cleanup ✨ FIXED
      Status: ✅ NOW PASSES (was failing)
      Previous: .tmp file remained on disk
      Now: No .tmp file after failed write
      Duration: 0m 31s

[5/5] Scenario 5: File Watcher Broadcasts Change
      Status: ✅ STILL PASSING
      Duration: 1m 05s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TEST RESULTS

Previous: 3/5 passed (60%)
Current:  5/5 passed (100%)
Improvement: +2 tests fixed ✨

Quality Checks:
  ✓ Console Errors: 0
  ✓ Security: Path traversal blocked ✅
  ✓ TypeScript: 0 errors

Test Duration: 2m 26s
Test Cost: $0.02

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ALL TESTS NOW PASS!
```

**After test fixes:**
```
🧪 RE-RUNNING AFFECTED TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running updated scenarios: [3/5] and [4/5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3/5] Scenario 3: Path Traversal Blocked
      Status: ✅ NOW PASSES
      Previous Issue: curl not checking HTTP status code
      Fix: Updated curl command
      Result: 403 correctly detected
      Duration: 0m 08s

[4/5] Scenario 4: Watcher Timing
      Status: ✅ NOW PASSES
      Previous Issue: No delay before WebSocket check
      Fix: Added sleep 0.5
      Result: Message received after debounce
      Duration: 1m 12s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TEST RESULTS

Full Suite: 5/5 passed (100%)
Fixed Tests: 2/2 now pass ✨
Unchanged: 3/3 still pass

Test Duration: 1m 20s
Test Cost: $0.01

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ALL TESTS NOW PASS!
```

---

### Step 8: Update Documentation

**For code fixes:**
```
📝 UPDATING DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updating implementation docs...
  ✓ .claude/processed/Task 2.1.md

Updating test results...
  ✓ .claude/processed/Task 2.1 - Test Results.md

Updating systemTasks.md...
  ✓ Updated test status: ❌ Failed → ✅ Passed
  ✓ Updated test scenarios: 3/5 → 5/5
  ✓ Added fix notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Added to Task 2.1.md:

## Fixes Applied

### Fix #1: Path Security + Atomic Write
**Date**: Feb 23, 2026
**Type**: Code Fix (with re-testing)

**Issues**:
1. Path traversal not blocked — validatePath() missing
2. Atomic write left .tmp file on error — cleanup missing

**Root Cause**:
- validatePath() imported but never called in route handlers
- catch block in writeFile did not unlink tmpPath

**Solution Implemented**:
1. Added validatePath() calls before all fs operations
2. Added fs.unlink(tmpPath).catch(() => {}) in catch block

**Files Modified**:
- backend/src/routes/files.ts
- backend/src/services/fileService.ts

**Tests Re-Run**:
  Previous: 3/5 passed
  After Fix: 5/5 passed ✅

  Fixed Scenarios:
  - [3/5] Path traversal now correctly blocked (403)
  - [4/5] No .tmp file after failed write

**Token Usage**:
  Implementation: 1,640 tokens ($0.03)
  Testing: 1,120 tokens ($0.02)
  Total: 2,760 tokens ($0.05)

**Time Spent**: 8 minutes
**Verification**: All tests passing ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 9: Complete Fix
```
✅ FIX COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1 has been fixed successfully!

SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fix Type: Code Fix
Issues Fixed: 2 (path traversal, atomic write cleanup)
Files Changed: 2 files

TEST RESULTS:
  Previous: 3/5 passed (60%)
  After Fix: 5/5 passed (100%) ✅
  Tests Fixed: [3/5], [4/5]

VERIFICATION:
✓ Path traversal blocked (403) ✅
✓ No .tmp files on failed write ✅
✓ TypeScript: 0 errors ✅
✓ Console errors: 0 ✅
✓ All tests passing ✅
✓ Documentation updated ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TOKEN USAGE

Implementation:
  Input: 1,240 tokens
  Output: 400 tokens
  Subtotal: 1,640 tokens ($0.03)

Testing:
  Input: 820 tokens
  Output: 300 tokens
  Subtotal: 1,120 tokens ($0.02)

Total Fix Cost: $0.05
Time: 8 minutes

Task 2.1 Total (Original + Fix):
  Original: $0.22
  Fix: $0.05
  Total: $0.27

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 GIT COMMIT (Optional)

Suggested commit message:
"fix(files): add path validation and atomic write cleanup (Task 2.1)

- Added validatePath() before all fs operations in file routes
- Added tmpPath cleanup in catch block of writeFile
- Path traversal now correctly returns 403
- Fixed tests: scenarios 3 and 4 now pass
- All 5/5 tests passing"

Commit now? (yes/no/later)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do next?

1️⃣ continue       - Resume normal task execution
2️⃣ test-manually  - Test manually in browser/terminal
3️⃣ fix-another    - Fix another task
4️⃣ review-tests   - Review detailed test results
5️⃣ review-changes - Review all code changes
6️⃣ pause          - Stop for now

Your choice:
```

---

## Error Handling

### If Tests Still Fail After Fix
```
⚠️  TESTS STILL FAILING AFTER FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fix applied but tests still fail:

Previous: 3/5 passed
After Fix: 4/5 passed (improved but not complete)

Still Failing:
  [4/5] Atomic Write Cleanup
       Issue: .tmp file still present
       Error: File /tmp/test/index.ts.tmp.1234 exists

This suggests:
1. The fix was partial — unlink path is wrong
2. Different temp filename pattern used
3. Race condition in cleanup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?

1️⃣ fix-more      - Continue fixing remaining issue
2️⃣ fix-test      - Update test (maybe wrong assertion)
3️⃣ investigate   - Debug manually
4️⃣ accept-partial - Accept 4/5, note remaining issue
5️⃣ rollback      - Undo all changes

Your choice:
```

---

### If Fix Causes Regressions
```
⚠️  FIX CAUSED REGRESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fix improved some tests but broke others:

Before Fix:
  [1/5] Read file — ✅ Passing
  [2/5] Write file — ✅ Passing
  [3/5] Path traversal — ❌ Failing
  [4/5] Atomic write cleanup — ❌ Failing
  [5/5] File watcher — ✅ Passing

After Fix:
  [1/5] Read file — ✅ Still passing
  [2/5] Write file — ❌ NOW FAILING ⚠️
  [3/5] Path traversal — ✅ Now passing (fixed)
  [4/5] Atomic write cleanup — ✅ Now passing (fixed)
  [5/5] File watcher — ✅ Still passing

NEW FAILURE in Scenario 2:
  Issue: Write file now returns 403 for valid paths
  Cause: validatePath() resolving path incorrectly for relative paths

This is a regression introduced by the fix.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:

1️⃣ fix-regression - Fix the new issue
2️⃣ rollback       - Undo changes, try different approach
3️⃣ debug          - Investigate in detail

Your choice:
```

---

### If Multiple Issues Found
```
⚠️  MULTIPLE ISSUES DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 issues in Task 2.1:

1. 🔴 HIGH: Path traversal not blocked
   Impact: Security vulnerability
   Tests affected: [3/5]

2. 🟡 MEDIUM: Atomic write cleanup missing
   Impact: Orphaned .tmp files
   Tests affected: [4/5]

3. 🟢 LOW: No language detection for .sh files
   Impact: Monaco uses plaintext instead of shell
   Tests affected: None (not tested yet)

Fix approach:

1️⃣ fix-all       - Fix all 3 issues together
2️⃣ fix-critical  - Fix only HIGH + test failures (#1, #2)
3️⃣ fix-tests     - Fix only issues with failing tests (#1, #2)
4️⃣ fix-one       - Let me choose which to fix
5️⃣ cancel        - Cancel fix mode

Your choice:
```

---

## Rollback Capability

### User Requests Rollback
```
↩️  ROLLING BACK CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Undoing changes to Task 2.1...

Restoring files:
  ↩️  Reverted backend/src/routes/files.ts
  ↩️  Reverted backend/src/services/fileService.ts
  ↩️  Reverted .claude/Test2/Task 2.1.md (if changed)

Verifying rollback:
  ✓ All files restored to pre-fix state
  ✓ TypeScript: 0 errors (reverted build clean)

Restoring test status:
  ✓ Test status back to: ❌ 3/5 passed
  ✓ systemTasks.md updated

ROLLBACK COMPLETE ✅

State: Back to original issues
  - Path traversal still not blocked
  - Atomic write still leaves .tmp files

Recommendation: Try alternative solution or investigate more

Ready to try different approach? (yes/no/investigate)
```

---

## Batch Fix (Multiple Tasks)
```
🔧 BATCH FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Multiple tasks have similar issues:

Tasks with failing tests:
  - Task 2.1: File System API (3/5 passed)
  - Task 3.1: Model Config (4/5 passed)
  - Task 5.1: Git Backend API (4/5 passed)

Common issue: Missing security validations

Apply similar fix pattern to all 3 tasks?

Solution:
  1. Add validatePath() to all file route handlers
  2. Strip apiKey from all model config responses
  3. Validate git repo path before operations

This will:
  ✓ Fix code in all 3 tasks
  ✓ Re-run tests for all 3 tasks
  ✓ Update all documentation files

Estimated:
  Time: 20 minutes
  Cost: $0.12
  Expected: All tests passing for all tasks

Proceed with batch fix? (yes/no/one-by-one)
```

**If user proceeds:**
```
⚙️  BATCH FIX IN PROGRESS [1/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1: File System API

Implementation:
  ✓ Added validatePath() to all route handlers
  ✓ TypeScript: 0 errors

Testing:
  🧪 Re-running tests...
  ✓ All 5/5 tests now pass

✅ Task 2.1 Fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️  BATCH FIX IN PROGRESS [2/3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 3.1: Model Config & Connection

Implementation:
  ✓ Stripped apiKey from GET /api/model/config response
  ✓ TypeScript: 0 errors

Testing:
  🧪 Re-running tests...
  ✓ All 5/5 tests now pass

✅ Task 3.1 Fixed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Continues for Task 5.1...]

✅ BATCH FIX COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fixed: 3/3 tasks
All tests passing: 15/15 scenarios ✅
Time: 18 minutes
Cost: $0.11
```

---

## Quick Fix Mode

For simple, obvious fixes with automatic testing:
```
/fix-quick
```
```
⚡ QUICK FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What's the issue?
User: Monaco crashes on load

Applying standard fix: Change to dynamic import with ssr: false

✓ Modified frontend/src/components/editor/EditorArea.tsx
  Before: import MonacoEditor from '@monaco-editor/react'
  After:  const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

✓ TypeScript: 0 errors

Testing...
  ✓ Monaco renders without crash
  ✓ No console errors

Done! ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Test-Only Fix Mode

Dedicated mode for fixing tests without touching code:
```
/fix-tests 2.1
```
```
🧪 TEST FIX MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1 - Test Scenarios Only

Current test file: .claude/Test2/Task 2.1.md
Failed scenarios: 2/5

This mode ONLY updates test scenarios.
Implementation code will NOT be changed.

What's wrong with the tests?

1️⃣ wrong-commands     - curl/WebSocket commands incorrect
2️⃣ wrong-timing       - Tests need more wait time
3️⃣ wrong-expectations - Tests expect wrong behavior
4️⃣ describe           - Let me describe the issue

Your choice:
```

---

## Summary of Features

**What's Included:**
- ✅ Automatic test re-running after every fix
- ✅ Test-only fix mode (`/fix-tests`)
- ✅ Fix both code and tests (`/fix-both`)
- ✅ Test status shown in task selection
- ✅ TypeScript build verification after every code fix
- ✅ Security-specific fix examples (path traversal, apiKey)
- ✅ Regression detection (fix breaking other tests)
- ✅ Batch fix with testing for multiple tasks
- ✅ Rollback capability
- ✅ Before/after test comparison

**Benefits:**
- 🧪 Ensures fixes actually work (tests prove it)
- 🔒 Security issues flagged as HIGH priority
- 🎯 Can fix tests separately from code
- 📊 Clear visibility of test impact
- 🔍 Detects regressions immediately
- 💰 Tracks testing costs for fixes
- 📝 Complete documentation of every fix