# Log Tokens - Manual Token Usage Tracking

Manually log token usage for completed tasks when automatic tracking isn't available.

---

## Command Usage

### Log Current Task
```
/log-tokens
```
Logs tokens for the most recently completed task.

### Log Specific Task
```
/log-tokens 2.1
/log-tokens Task 2.1
```
Logs tokens for a specific task by number.

### Bulk Log
```
/log-tokens --bulk
```
Log tokens for multiple tasks at once.

---

## When to Use This Command

Use `/log-tokens` when:
- ✅ Just completed a task manually
- ✅ Task completed but tokens not automatically tracked
- ✅ Reviewing old tasks without token data
- ✅ Correcting incorrect token counts

Do NOT use when:
- ❌ Task not yet completed
- ❌ Tokens already logged (use update instead)
- ❌ Using API with automatic tracking

---

## Where to Find Token Counts

### Claude.ai Web Interface
1. Look at bottom-right of conversation
2. Usage indicator shows token counts
3. Click for detailed breakdown
4. Note: Shows cumulative for entire conversation

### Claude API Response
Token counts in response headers:
```
x-input-tokens: 12450
x-output-tokens: 8230
```

### Calculate from Conversation
If token counts not visible:
- Before task: Note conversation tokens
- After task: Note new total
- Used = After - Before

---

## Workflow

### Step 1: Identify Task

**If no task specified:**
```
📊 TOKEN LOGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent completed tasks without token data:

1. Task 2.3: Monaco Editor + Tabs + Save ⚠️ NO TOKENS
2. Task 2.2: File Explorer Sidebar       ✅ HAS TOKENS
3. Task 2.1: Backend File System API     ✅ HAS TOKENS
4. Task 1.2: IDE Shell Layout & Store    ✅ HAS TOKENS

Which task to log tokens for? (1 or task number):
```

**If task specified:**
```
📊 TOKEN LOGGING - Task 2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: 2.1 - Backend File System API
Status: ✅ COMPLETED
Completed: Feb 23, 1:15 PM
Duration: 35 minutes

Current Token Data: ⚠️ NOT LOGGED

Ready to log tokens? (yes/no)
```

---

### Step 2: Request Token Counts
```
📊 TOKEN INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1: Backend File System API

Please provide token counts from your Claude interface:

WHERE TO FIND:
- Claude.ai: Check usage indicator (bottom-right)
- API: Check response headers
- Conversation: Before/After difference

IMPORTANT: Only count tokens used FOR THIS TASK
If logging from ongoing conversation:
  - Before task tokens: _____
  - After task tokens: _____
  - Task tokens = After - Before

Enter token counts:

Input Tokens: _____
Output Tokens: _____

(Or type 'help' for more guidance)
```

**User enters numbers:**
```
Input Tokens: 9840
Output Tokens: 6560
```

---

### Step 3: Validate Input
```
🔍 VALIDATING INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Tokens:  9,840
Output Tokens: 6,560
Total Tokens:  16,400

Validation:
✓ Numbers are valid
✓ Input/Output ratio: 1.50:1 (healthy)
✓ Total within expected range for this task

Cost Calculation:
  Input:  (9,840 / 1,000,000) × $3.00  = $0.030
  Output: (6,560 / 1,000,000) × $15.00 = $0.098
  Total:  $0.128

  + Testing tokens (estimated 30%):      $0.055
  Total with testing:                    $0.183

Comparison to Averages:
  Task tokens:   16,400
  Project avg:   16,200 tokens
  This task:     1% ABOVE average ✅

  Task cost:     $0.25
  Project avg:   $0.248
  This task:     1% ABOVE average ✅

Does this look correct? (yes/no/retry)
```

**If numbers seem wrong:**
```
⚠️  WARNING: Unusual Token Counts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input Tokens:  80,000
Output Tokens: 2,000
Total:         82,000

Issues detected:
⚠️  Very high input tokens (5x average)
⚠️  Very low output tokens (0.3x average)
⚠️  Unusual ratio: 40:1 (expect 1.4-1.6:1)

Possible causes:
- Included entire conversation instead of just task
- Counted cumulative instead of task-only
- Task involved extensive file reading (backend services)

Are these counts correct? (yes/no)

If no, let's try again:
  - Check if you counted just THIS task
  - Use Before/After method to isolate task
  - Verify you're looking at the right conversation

Retry? (yes/no)
```

---

### Step 4: Update systemTasks.md
```
💾 UPDATING SYSTEM TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updating .claude/systemTasks.md...

Step 1/5: Locating Task 2.1...
  ✓ Found in Phase 2

Step 2/5: Updating task fields...
  ✓ Input Tokens: 9,840
  ✓ Output Tokens: 6,560
  ✓ Total Tokens: 16,400
  ✓ Cost Estimate: $0.25

Step 3/5: Updating Phase 2 totals...
  Before: 2 tasks, $0.44 total
  After:  3 tasks, $0.69 total
  ✓ Phase totals updated

Step 4/5: Updating Progress Summary...
  Before: Total Cost: $0.99
  After:  Total Cost: $1.24
  ✓ Grand totals updated

Step 5/5: Updating Token Usage by Phase table...
  Phase 2: Updated with new tokens/cost
  ✓ Table updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes Applied to .claude/systemTasks.md:

### Task 2.1: Backend File System API
- **Input Tokens**: 9,840
- **Output Tokens**: 6,560
- **Total Tokens**: 16,400
- **Cost Estimate**: $0.25

Phase 2 Totals:
- Total Cost: $0.69 (was $0.44)

Project Totals:
- Total Tokens: 81,000 (was 64,600)
- Total Cost: $1.24 (was $0.99)

✓ All updates successful
```

---

### Step 5: Update Processed Documentation
```
📝 UPDATING PROCESSED FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updating .claude/processed/Task 2.1.md...

Adding token usage section:

## Token Usage

**Input Tokens**: 9,840
**Output Tokens**: 6,560
**Total Tokens**: 16,400

**Cost Breakdown**:
- Input Cost:  (9,840 / 1,000,000) × $3  = $0.030
- Output Cost: (6,560 / 1,000,000) × $15 = $0.098
- Testing Cost (estimated):               = $0.055
- **Total Cost**: $0.25 (approx)

**Logged**: Feb 23, 2026 at 2:30 PM (manual entry)

✓ Processed file updated
```

---

### Step 6: Show Confirmation & Context
```
✅ TOKEN LOGGING COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Successfully logged tokens for Task 2.1!

TASK DETAILS:
  Task:         2.1 - Backend File System API
  Input:        9,840 tokens
  Output:       6,560 tokens
  Total:        16,400 tokens
  Cost:         $0.25

FILES UPDATED:
  ✓ .claude/systemTasks.md
  ✓ .claude/processed/Task 2.1.md

PROJECT IMPACT:
  Before: $0.99 total (4 tasks)
  After:  $1.24 total (5 tasks logged)
  Change: +$0.25

AVERAGES:
  Project avg: $0.248/task
  This task:   $0.250 (1% above avg) ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CURRENT PROJECT STATUS

Total Tokens:  81,000
Total Cost:    $1.24
Tasks Logged:  5 / 5 completed (100%) ✅
Avg per Task:  $0.248

Budget:        $5.00
Spent:         $1.24 (24.8%)
Remaining:     $3.76 (75.2%)
Status:        🟢 On Track

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?

1️⃣ log-another  - Log tokens for another task
2️⃣ review       - See full token usage report
3️⃣ continue     - Resume task execution
4️⃣ done         - Finish logging

Your choice:
```

---

## Bulk Logging

### Multiple Tasks at Once
```
/log-tokens --bulk
```

Shows:
```
📊 BULK TOKEN LOGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasks needing token data:

1. Task 2.1: Backend File System API ⚠️
2. Task 2.2: File Explorer Sidebar   ⚠️
3. Task 2.3: Monaco Editor + Tabs    ⚠️

Enter tokens for each task:

Task 2.1 - Backend File System API:
  Input Tokens: 9840
  Output Tokens: 6560

Task 2.2 - File Explorer Sidebar:
  Input Tokens: 9120
  Output Tokens: 6080

Task 2.3 - Monaco Editor + Tabs + Save:
  Input Tokens: 11280
  Output Tokens: 7520

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
  Total Input:  30,240 tokens
  Total Output: 20,160 tokens
  Total:        50,400 tokens
  Total Cost:   $0.76 (approx with testing)

Looks correct? (yes/no)

[If yes, updates all at once]

✅ Logged 3 tasks successfully!
  Total added to project: $0.76
  Project total: $1.24
```

---

## Error Handling

### Task Already Has Tokens
```
⚠️  TOKENS ALREADY LOGGED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1 already has token data:

Current:
  Input:  9,840 tokens
  Output: 6,560 tokens
  Total:  16,400 tokens
  Cost:   $0.25

What would you like to do?

1️⃣ update    - Replace with new values
2️⃣ add       - Add to existing (for fixes)
3️⃣ skip      - Keep current, cancel
4️⃣ view      - See full token details

Your choice:
```

### Invalid Numbers Entered
```
❌ INVALID INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input:  "nine thousand"
Output: "6k"

Error: Please enter numeric values only

Examples of valid input:
  9840
  9,840

Try again? (yes/no)
```

### Task Not Found
```
❌ TASK NOT FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 9.9 does not exist in systemTasks.md

Valid task range: 1.1 - 6.2 (12 tasks total)

Recent tasks:
  • Task 2.3: Monaco Editor + Tabs + Save
  • Task 2.2: File Explorer Sidebar
  • Task 2.1: Backend File System API

Try again? (yes/no)
```

### Task Not Completed
```
⚠️  TASK NOT COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 3.1: Model Config & Connection
Status: ⏳ PENDING (not started)

You can only log tokens for completed tasks.

Last completed: Task 2.3

Log tokens for Task 2.3 instead? (yes/no)
```

---

## Update Existing Token Data
```
/log-tokens --update 2.1
```

Shows:
```
🔄 UPDATE TOKEN DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1: Backend File System API

Current Token Data:
  Input:  9,840 tokens
  Output: 6,560 tokens
  Total:  16,400 tokens
  Cost:   $0.25
  Logged: Feb 23, 2:30 PM

Why update?
1️⃣ correction  - Original numbers were wrong
2️⃣ fix-added   - Task was fixed, adding fix tokens
3️⃣ recount     - Recounted conversation tokens

Your choice:

[If fix-added:]
This will ADD to existing tokens (not replace)

Current:  16,400 tokens ($0.25)
Fix tokens to add:
  Input: 820
  Output: 400

New total: 17,620 tokens ($0.27)

Proceed? (yes/no)
```

---

## Quick Log (Fast Entry)
```
/log-tokens 2.1 9840 6560
```

Shows confirmation and logs immediately:
```
⚡ QUICK LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1: Backend File System API
Input:  9,840
Output: 6,560
Total:  16,400
Cost:   $0.25

✓ Logged successfully!

Project total: $1.24
```

---

## Help Guide
```
/log-tokens --help
```

Shows:
```
📖 TOKEN LOGGING HELP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USAGE:
  /log-tokens              Log current task
  /log-tokens 2.1          Log specific task
  /log-tokens --bulk       Log multiple tasks
  /log-tokens --update 2.1 Update existing data

HOW TO FIND TOKEN COUNTS:

1. Claude.ai Web Interface:
   • Look at bottom-right corner
   • Click usage indicator for details
   • Shows cumulative conversation tokens
   • Calculate: After Task - Before Task

2. Claude API:
   • Check response headers
   • x-input-tokens: 9840
   • x-output-tokens: 6560

3. If Unsure:
   • Estimate based on task complexity
   • Use project averages as guide
   • Simple tasks (scaffold, config): 12,000-15,000 tokens
   • Medium tasks (backend routes, components): 15,000-18,000 tokens
   • Complex tasks (agent, Monaco, terminal): 18,000-24,000 tokens

COST FORMULA:
  Input Cost  = (Input / 1,000,000) × $3
  Output Cost = (Output / 1,000,000) × $15
  Total Cost  = Input Cost + Output Cost
  (Add ~30% for testing tokens)

TIPS:
  • Log tokens right after completing task
  • Only count tokens used FOR THAT TASK
  • If conversation includes multiple tasks, subtract
  • Keep browser tab open to see usage indicator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Integration with Other Commands

### After Task Completion

When `/execute-task` completes without automatic token tracking:
```
✅ TASK COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 2.1: Backend File System API

[... results ...]

⚠️  TOKEN TRACKING NEEDED

Would you like to log token usage now?

1️⃣ yes       - Log tokens now
2️⃣ later     - Continue without logging (can log later)
3️⃣ estimate  - Use project average ($0.248)

Your choice:

[If yes, launches /log-tokens]
```