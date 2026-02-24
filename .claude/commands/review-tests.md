# Review Test Results

View detailed test results for any task.

---

## Usage
```bash
/review-tests              # Show recent test results
/review-tests 2.1          # Show specific task results
/review-tests --failed     # Show only failed tests
/review-tests --phase 2    # Show all tests for a phase
```

---

## Display Format

### Recent Tests (Default)
```
📊 TEST RESULTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent Tests (Last 5):

Task 2.3 - Monaco Editor + Tabs + Save
  ✅ 5/5 passed | 8m 12s | 10 min ago
  Types: Playwright

Task 2.2 - File Explorer Sidebar
  ✅ 5/5 passed | 7m 05s | 45 min ago
  Types: Playwright

Task 2.1 - Backend File System API
  ✅ 5/5 passed | 2m 51s | 1 hour ago
  Types: curl + WebSocket

Task 1.2 - IDE Shell Layout & State Store
  ✅ 4/4 passed | 5m 30s | 2 hours ago
  Types: Playwright

Task 1.1 - Project Scaffold & Dependencies
  ✅ 4/4 passed | 4m 15s | 3 hours ago
  Types: shell commands

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall:
  Pass Rate:       100% (23/23 scenarios)
  Console Errors:  0
  Security Issues: 0
  TypeScript Errors: 0
  Total Time:      27m 53s
```

### Specific Task (`/review-tests 2.1`)
```
📊 TEST RESULTS - Task 2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: 2.1 - Backend File System API
Test File: .claude/tasks/Test2/Task 2.1.md
Results: .claude/tasks/processed/Task 2.1 - Test Results.md
Status: ✅ ALL PASSED (5/5)
Duration: 2m 51s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Open Workspace
      Type: curl
      ✓ POST /api/workspace/open → 200 OK
      ✓ Response: { path, name, tree }
      Status: ✅ PASSED (0m 45s)

[2/5] Read File
      Type: curl
      ✓ GET /api/files/read → 200 OK
      ✓ language: "typescript" detected
      Status: ✅ PASSED (0m 22s)

[3/5] Path Traversal Blocked
      Type: curl (security check)
      ✓ GET /api/files/read?path=../../etc/passwd → 403
      ✓ Response: { "error": "Access denied" }
      Status: ✅ PASSED (0m 08s)

[4/5] Write File (Atomic)
      Type: curl
      ✓ POST /api/files/write → 200 OK
      ✓ No .tmp file left behind
      Status: ✅ PASSED (0m 31s)

[5/5] File Watcher Broadcasts Change
      Type: WebSocket
      ✓ Connected to ws://localhost:3001
      ✓ Received: { type: "file:change", path: "..." }
      Status: ✅ PASSED (1m 05s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Security: ✅ Path traversal blocked | apiKey absent
TypeScript: ✅ 0 errors
Console Errors: 0
Network Errors: 0
```

### Failed Tests Only (`/review-tests --failed`)
```
📊 FAILED TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No failing tests found. All 23 scenarios pass. ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[If failures exist, shows:]

Task X.Y - [Name]
  ❌ Scenario N: [Description]
     Expected: [expected]
     Actual:   [actual]
     Fix: /fix-task X.Y
```

---

## Step 4: Update Results File

After viewing, optionally re-run:
```
Re-run tests for this task? (yes/no)
→ yes: runs /test-task X.Y
→ no:  exits
```