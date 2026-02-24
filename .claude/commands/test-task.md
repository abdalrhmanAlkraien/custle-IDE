# Test Task - Execute Tests for Completed Task

Run or re-run tests for any task.

---

## Usage
```bash
# Test current/most recent task
/test-task

# Test specific task
/test-task 2.1

# Test with options
/test-task 2.1 --verbose
/test-task 2.1 --scenario 3
```

---

## Workflow

### Step 1: Identify Task
```
🧪 TEST TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: 2.1 - Backend File System API
Status: ✅ COMPLETED
Last Tested: 2 hours ago

Test File: .claude/Test2/Task 2.1.md
Previous Results: 5/5 passed

Re-run tests? (yes/no):
```

---

### Step 2: Execute Tests

Run all scenarios from `.claude/TestX/Task X.Y.md`.

Test type is determined by the task:

**Backend API tasks** (2.1, 3.1, 5.1):
```bash
# curl scenarios
curl -s http://localhost:3001/api/[endpoint] | jq .

# Security check — must return 403
curl -s "http://localhost:3001/api/files/read?path=../../etc/passwd" | jq .
```

**WebSocket tasks** (2.1 watcher, 4.1 terminal):
```javascript
const ws = new WebSocket('ws://localhost:3001');
ws.send(JSON.stringify({ type: 'ping' }));
// expect: { type: 'pong' }
```

**Frontend UI tasks** (1.2, 2.2, 2.3, 3.1, 3.2, 4.1, 5.2, 6.1, 6.2):
```javascript
// Playwright scenarios
await playwright_navigate({ url: 'http://localhost:3000' });
// ... test steps
```

Show results as each scenario runs:
```
🧪 EXECUTING TESTS - Task X.Y
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/5] Scenario 1: [Name]
      Status: 🔄 Running...
      ✓ [Check 1]
      ✓ [Check 2]
      Status: ✅ PASSED

[2/5] Scenario 2: [Name]
      Status: 🔄 Running...
      ...
```

---

### Step 3: Show Results

**All passed:**
```
✅ ALL TESTS PASSED (5/5)

Duration: 4m 12s
Console Errors: 0
Security Issues: 0
TypeScript Errors: 0

Changed since last test:
  - None (code unchanged)

Proceed? (yes/done):
```

**Some failed:**
```
❌ TESTS FAILED (3/5 passed)

Failed Scenarios:
  [3/5] Path traversal not blocked
        Expected: 403 { "error": "Access denied" }
        Actual: 200 with file contents

  [4/5] apiKey in response
        Expected: apiKey absent from GET /api/model/config
        Actual: apiKey present in response

Options:
1️⃣  auto-fix  - Analyze and fix automatically
2️⃣  guide-fix - Walk through fix together
3️⃣  show-code - Show failing test code
4️⃣  done      - Exit without fixing

Your choice:
```

---

### Step 4: Update Results

Save updated results to `.claude/processed/Task X.Y - Test Results.md`

Update `.claude/systemTasks.md` test section with new results.

```
📝 RESULTS SAVED

Updated: .claude/processed/Task X.Y - Test Results.md
Updated: .claude/systemTasks.md

Test run complete.
```

---

## Options

### --verbose
Shows full curl output / Playwright logs for each scenario.

### --scenario N
Runs only scenario N from the test file:
```
🧪 RUNNING SCENARIO 3 ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3/5] Scenario 3: Path Traversal Blocked
      ✓ GET /api/files/read?path=../../etc/passwd → 403
      ✓ Response: { "error": "Access denied" }
      Status: ✅ PASSED
```

### --security
Runs only security-related scenarios (path traversal, apiKey checks):
```
🔒 SECURITY TESTS ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Path Traversal: ✅ Blocked (403)
apiKey in response: ✅ Absent
Workspace root enforced: ✅
```