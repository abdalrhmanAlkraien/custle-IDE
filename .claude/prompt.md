# Current Task Execution

**Last Updated**: Not started
**Current Task Number**: NONE
**Current Phase**: NONE
**Status**: READY_FOR_NEXT_TASK

---

## Purpose

This file holds the current task being executed in the interactive task-by-task workflow.

---

## How This File Works

### State 1: Ready (Current State)
When status is `READY_FOR_NEXT_TASK`:
- File is empty/cleared
- Waiting for user to run `/execute-task`
- No task currently in progress

### State 2: Task Loaded
When user starts a task:
- Task details copied from `.claude/PhaseX/Task X.Y.md`
- Status changes to `IN_PROGRESS`
- Timestamps recorded
- Task displayed to user for confirmation

### State 3: Execution
During task execution:
- This file contains full task context
- Claude references this file during work
- Token usage tracked
- Progress shown to user

### State 4: Completion
After task completes:
- Results presented to user
- User chooses action (continue/review/fix/pause)
- If user chooses "continue":
   - This file cleared
   - Status back to `READY_FOR_NEXT_TASK`
   - Ready for next task

---

## Interactive Workflow
```
User: /execute-task
   ↓
Claude reads .claude/systemTasks.md
   ↓
Finds next PENDING task
   ↓
Reads .claude/PhaseX/Task X.Y.md
   ↓
Copies task details to THIS FILE
   ↓
Shows summary to user
   ↓
User confirms (yes/no/skip)
   ↓
Claude executes task
   ↓
Runs: cd backend && npm run build (0 errors required)
Runs: cd frontend && npm run build (0 errors required)
   ↓
Generates test scenarios → .claude/TestX/Task X.Y.md
   ↓
Executes tests (curl / WebSocket / Playwright)
   ↓
Creates .claude/processed/Task X.Y.md
Creates .claude/processed/Task X.Y - Test Results.md
   ↓
Updates .claude/systemTasks.md (ONCE)
   ↓
Presents review options
   ↓
User chooses:
  - continue → Clear this file, start next task
  - review → Show files created
  - review-tests → Show test results
  - re-test → Run tests again
  - fix → Enter fix mode
  - pause → Save state, stop
```

---

## Current Task

_No task currently loaded_

**Status**: READY_FOR_NEXT_TASK

---

## Task Format (When Loaded)

When a task is being executed, this file will contain:
```markdown
# Current Task Execution

**Last Updated**: 2026-02-23 14:30:00
**Current Task Number**: X.Y
**Current Phase**: Phase X
**Status**: IN_PROGRESS

---

## Task X.Y: [Task Name]

**Task Definition**: .claude/PhaseX/Task X.Y.md
**Started At**: 2026-02-23 14:30:00

---

### Description

[Full description from task definition file]

---

### Requirements

1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]
...

---

### Expected Outputs

- File 1: backend/src/...
- File 2: frontend/src/...
...

---

### Test Criteria

✓ [Test 1]
✓ [Test 2]
✓ [Test 3]
...

---

### Estimated Duration

[Time estimate from task file]

---

### Token Usage (Tracking)

**Start Token Count**: [Recorded at start]
**Current Token Count**: [Updated during execution]

---

## Execution Progress

⚙️ [Current step being executed]

[Progress updates appear here during execution]

---

## Completion

**Finished At**: [Timestamp when done]
**Duration**: [Calculated time]
**Final Token Count**: [Total tokens used]
**Cost**: [Calculated cost]
**TypeScript Build**: [backend: 0 errors | frontend: 0 errors]
**Test Results**: [X/Y scenarios passed]
```

---

## Instructions for Claude

### When Executing `/execute-task`

1. **Check this file first**
   - If status is `READY_FOR_NEXT_TASK` → proceed
   - If status is `IN_PROGRESS` → ask if should continue or restart

2. **Load next task**
   - Read `.claude/systemTasks.md`
   - Find first task with ⏳ PENDING status
   - Read task definition from `.claude/PhaseX/Task X.Y.md`

3. **Update this file**
   - Copy task details here
   - Set status to `IN_PROGRESS`
   - Record start timestamp
   - Display to user for confirmation

4. **Execute task**
   - Follow requirements from task definition exactly
   - Backend files → `backend/src/`
   - Frontend files → `frontend/src/`
   - Update progress in this file as you work
   - Track token usage

5. **Verify TypeScript (mandatory)**
   - Run `cd backend && npm run build` → must show 0 errors
   - Run `cd frontend && npm run build` → must show 0 errors
   - Fix any errors before proceeding to tests

6. **Generate & run tests**
   - Create `.claude/TestX/Task X.Y.md`
   - Run curl / WebSocket / Playwright tests per task type
   - Security checks: path traversal → 403, apiKey absent from responses

7. **After completion**
   - Create `.claude/processed/Task X.Y.md`
   - Create `.claude/processed/Task X.Y - Test Results.md`
   - Update `.claude/systemTasks.md` **EXACTLY ONCE**
   - Present review options to user
   - **Wait for user decision** before clearing this file

8. **User chooses "continue"**
   - Clear this file
   - Reset status to `READY_FOR_NEXT_TASK`
   - Proceed to next pending task

9. **User chooses other option**
   - Keep this file as-is
   - Handle user's choice (review/fix/pause/re-test)
   - Wait for further instructions

---

## Important Notes

- **Never clear this file until user says "continue"**
- **Never update systemTasks.md more than once per task**
- This file is for task execution only
- Task definitions live in `.claude/PhaseX/Task X.Y.md`
- Completed task docs go in `.claude/processed/Task X.Y.md`
- This file should be empty between tasks
- Always run TypeScript build verification before tests
- Never import Monaco or xterm at module level (dynamic + ssr:false)
- Never return apiKey in any backend API response
- Always validate file paths against workspace root

---

## Quick Commands

When this file contains an in-progress task:

- `continue`  - Complete task and move to next
- `pause`     - Stop execution, save state
- `status`    - Show current task progress
- `abandon`   - Cancel current task, mark as failed

---

**Current State**: Empty, ready for next task via `/execute-task`