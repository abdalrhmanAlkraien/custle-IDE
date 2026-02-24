# Review Progress - Project Status Report

Generate a comprehensive progress report showing task completion, costs, timeline, and health metrics.

---

## Command Usage
```
/review-progress
```

Generates full project status report with statistics, phase breakdown, token usage, and recommendations.

---

## What This Report Shows

1. **Overall Statistics** - Task counts, completion %, cost
2. **Phase Breakdown** - Status of each phase with visual progress
3. **Token & Cost Analysis** - Usage and projections
4. **Recent Activity** - Last 10 completed tasks
5. **Current State** - What's in progress
6. **Next Steps** - Upcoming tasks
7. **Health Metrics** - Blockers, issues, risks
8. **Recommendations** - Suggested actions
9. **Timeline Analysis** - On track vs. behind/ahead

---

## Workflow

### Step 1: Read systemTasks.md

1. **Parse all task data:**
   - Task status for all 76 tasks
   - Completion timestamps
   - Duration for each task
   - Token usage per task
   - Cost per task

2. **Calculate metrics:**
   - Total tasks by status
   - Completion percentage
   - Average time per task
   - Average cost per task
   - Total cost so far
   - Projected remaining cost

3. **Identify issues:**
   - Failed tasks (❌)
   - Blocked tasks (⚠️)
   - In-progress tasks (🔄)
   - Long-running tasks

---

### Step 2: Generate Progress Report

Display comprehensive report:
```
╔══════════════════════════════════════════════════════════╗
║     E-COMMERCE FRONTEND - PROJECT PROGRESS REPORT        ║
╚══════════════════════════════════════════════════════════╝

Generated: Friday, February 20, 2026 at 3:45 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL STATISTICS

Total Tasks:       76
✅ Completed:       18 (23.7%)
🔄 In Progress:     1 (1.3%)
⏳ Pending:         55 (72.4%)
❌ Failed:          1 (1.3%)
⚠️  Blocked:         1 (1.3%)

Progress:          ████████░░░░░░░░░░░░░░░░░░░░ 23.7%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 COST ANALYSIS

Total Spent:       $2.88
Average per Task:  $0.16
Total Tokens:      192,000
  Input:           115,200 tokens ($0.35)
  Output:          76,800 tokens ($2.53)

Projected Cost:
  Remaining Tasks: 58
  Est. Remaining:  $9.28
  Est. Total:      $12.16
  Budget Status:   ✅ On Track

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  TIME ANALYSIS

Time Spent:        8h 15min
Average per Task:  27.5 minutes
Total Work Days:   2 days

Estimated Remaining:
  Tasks Left:      58
  Est. Time:       26h 35min
  Est. Completion: March 5, 2026
  Status:          ✅ Ahead of Schedule

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 PHASE BREAKDOWN

Phase 0: Project Initialization
[████████████] 4/4 (100%) ✅ COMPLETE
  ✅ Task 0.1: Create Next.js Project (18 min, $0.16)
  ✅ Task 0.2: Create Project Structure (12 min, $0.12)
  ✅ Task 0.3: Setup Configuration Files (25 min, $0.19)
  ✅ Task 0.4: Generate TypeScript Types (15 min, $0.14)
  Phase Cost: $0.61 | Phase Time: 70 min

Phase 1: Core Infrastructure
[████████████] 6/6 (100%) ✅ COMPLETE
  ✅ Task 1.1: Setup API Client (22 min, $0.18)
  ✅ Task 1.2: Setup Auth Store (18 min, $0.15)
  ✅ Task 1.3: Create Auth API Module (20 min, $0.17)
  ✅ Task 1.3.1: Update API Client for Dual Auth (15 min, $0.13)
  ✅ Task 1.3.2: Create Auth Helper Utilities (12 min, $0.11)
  ✅ Task 1.4: Create Auth Hooks (25 min, $0.21)
  Phase Cost: $0.95 | Phase Time: 112 min

Phase 2: Authentication Pages
[████████████] 3/3 (100%) ✅ COMPLETE
  ✅ Task 2.1: Create Login Page (28 min, $0.22)
  ✅ Task 2.2: Create Register Page (25 min, $0.20)
  ✅ Task 2.3: Create Auth Layout (18 min, $0.16)
  Phase Cost: $0.58 | Phase Time: 71 min

Phase 3: Product Module - Public
[████░░░░░░░░] 2/5 (40%) 🔄 IN PROGRESS
  ✅ Task 3.1: Create Products API Module (20 min, $0.17)
  ✅ Task 3.2: Create Products Hooks (18 min, $0.15)
  🔄 Task 3.3: Create Product Card Component
  ⏳ Task 3.4: Create Products List Page
  ⏳ Task 3.5: Create Product Detail Page
  Phase Cost: $0.32 | Phase Time: 38 min

Phase 4: Cart Module
[░░░░░░░░░░░░] 0/6 (0%) ⏳ PENDING
  ⏳ Task 4.1: Create Cart API Module
  ⏳ Task 4.2: Create Cart Store
  ⏳ Task 4.3: Create Cart Hooks
  ⏳ Task 4.4: Create Cart Item Component
  ⏳ Task 4.5: Create Cart Page
  ⏳ Task 4.6: Add "Add to Cart" Functionality

Phase 5-15: [Collapsed - All Pending]
  Total: 52 tasks remaining

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RECENT ACTIVITY (Last 10 Tasks)

Feb 20, 3:30 PM  ✅ Task 3.2  Create Products Hooks       18 min  $0.15
Feb 20, 2:45 PM  ✅ Task 3.1  Create Products API         20 min  $0.17
Feb 20, 1:50 PM  ✅ Task 2.3  Create Auth Layout          18 min  $0.16
Feb 20, 1:10 PM  ✅ Task 2.2  Create Register Page        25 min  $0.20
Feb 20, 12:20 PM ✅ Task 2.1  Create Login Page           28 min  $0.22
Feb 19, 5:45 PM  ✅ Task 1.4  Create Auth Hooks           25 min  $0.21
Feb 19, 5:05 PM  ✅ Task 1.3.2 Auth Helper Utilities      12 min  $0.11
Feb 19, 4:35 PM  ✅ Task 1.3.1 API Client Dual Auth       15 min  $0.13
Feb 19, 4:00 PM  ✅ Task 1.3  Create Auth API Module      20 min  $0.17
Feb 19, 3:20 PM  ✅ Task 1.2  Setup Auth Store            18 min  $0.15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 CURRENT STATE

In Progress:
  Task 3.3: Create Product Card Component
  Started: 3:35 PM (10 minutes ago)
  Expected files: src/components/products/ProductCard.tsx
  Status: 🔄 Implementing component

Recent Updates:
  - Last commit: 3:30 PM (Task 3.2 completed)
  - Files created today: 8 files
  - Tests passed: 18/18

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏭️  NEXT UP (Next 3 Tasks)

1. Task 3.3: Create Product Card Component (current)
   Duration: ~20 min | Est. Cost: $0.16
   Files: ProductCard.tsx, product.types.ts

2. Task 3.4: Create Products List Page
   Duration: ~35 min | Est. Cost: $0.28
   Files: app/(public)/products/page.tsx, loading.tsx

3. Task 3.5: Create Product Detail Page
   Duration: ~30 min | Est. Cost: $0.24
   Files: app/(public)/products/[slug]/page.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  BLOCKERS & ISSUES

Failed Tasks: 1
  ❌ Task 1.2.5: Database Migration Setup
     Error: PostgreSQL connection failed
     Date: Feb 19, 2:15 PM
     Action: Needs database credentials

Blocked Tasks: 1
  ⚠️  Task 5.4: Payment Integration
     Reason: Waiting for Stripe API keys
     Blocked since: Feb 20, 10:00 AM
     Impact: Blocks Phase 5 completion

Issues Detected:
  ⚠️  Warning: Phase 3 taking longer than estimated
      Expected: 1.5 hours | Actual: 1.8 hours so far
      Reason: Complex component structure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 HEALTH METRICS

Velocity:         9 tasks/day
Success Rate:     94.7% (18 of 19 attempted)
Avg Duration:     27.5 min vs 25 min estimated (+10%)
Avg Cost:         $0.16 vs $0.15 estimated (+6.7%)

Quality Indicators:
  ✅ Zero critical bugs
  ✅ All tests passing
  ✅ Code reviews complete
  ⚠️  2 minor issues in backlog

Risk Assessment:
  🟢 Schedule: Ahead by 2 days
  🟢 Budget: Under by $0.84
  🟡 Quality: Minor issues present
  🟢 Overall: LOW RISK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATIONS

Immediate Actions:
  1. ✅ Fix Task 1.2.5 database connection before continuing
  2. 📧 Request Stripe API keys for Task 5.4
  3. 📝 Document complex components in Phase 3

Optimization Opportunities:
  • Batch Tasks 4.1-4.3 together (similar cart operations)
  • Consider parallel work on Phase 5 while waiting for keys
  • Take a break after completing Phase 3 (6 tasks done today)

Next Session Suggestions:
  • Focus: Complete Phase 3 (3 tasks remaining)
  • Duration: ~1.5 hours
  • Best time: After fixing database issue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 TIMELINE COMPARISON

Original Estimate:   76 tasks in 60 days (March 30, 2026)
Current Progress:    18 tasks in 2 days
Projected Finish:    March 5, 2026
Status:              🎉 25 days ahead of schedule

Milestone Progress:
  ✅ Phase 0-2: Complete (Feb 20) - ON TIME
  🔄 Phase 3: In Progress (40%) - ON TIME
  ⏳ Phase 4-6: Starting Feb 21 - ON TIME
  ⏳ Phase 7-15: TBD - ON TRACK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 FILE SYSTEM VERIFICATION

Checking created files against completed tasks...

✅ All expected files present (85 files)
✅ No missing files detected
✅ File structure matches architecture

Key Directories:
  ✅ src/app/(auth)/ - 6 files
  ✅ src/app/(public)/ - 4 files
  ✅ src/components/ui/ - 12 files
  ✅ src/lib/api/ - 8 files
  ✅ src/lib/store/ - 3 files
  ✅ src/lib/hooks/ - 5 files
  ✅ src/types/ - 1 file

Recent Files (Last 10):
  1. src/lib/hooks/useProducts.ts
  2. src/lib/api/products.ts
  3. src/app/(auth)/layout.tsx
  4. src/app/(auth)/register/page.tsx
  5. src/app/(auth)/login/page.tsx
  6. src/lib/hooks/useAuth.ts
  7. src/lib/utils/auth.ts
  8. src/lib/api/auth.ts
  9. src/lib/store/auth.ts
  10. src/lib/api/client.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SUMMARY

Status: 🟢 HEALTHY - Project is progressing well

Strengths:
  • Ahead of schedule by 25 days
  • Under budget by ~5%
  • High task success rate (94.7%)
  • All tests passing

Action Items:
  1. Fix database connection for Task 1.2.5
  2. Request Stripe API keys
  3. Complete Phase 3 today

Next Command:
  /execute-task  (to continue with Task 3.3)
  or
  /continue-tasks  (to batch complete Phase 3)

╚══════════════════════════════════════════════════════════╝
```

---

### Step 3: File System Check

**Detailed verification:**

1. **Read completed tasks from systemTasks.md**
2. **For each completed task:**
   - Read its processed documentation
   - Extract "Files Created" section
   - Check if each file exists in filesystem

3. **Generate file report:**
```
📁 FILE SYSTEM AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verifying 85 expected files from 18 completed tasks...

✅ Task 0.1: All files present (28 files)
✅ Task 0.2: All files present (12 files)
✅ Task 0.3: All files present (8 files)
✅ Task 0.4: All files present (1 file)
✅ Task 1.1: All files present (2 files)
✅ Task 1.2: All files present (1 file)
✅ Task 1.3: All files present (2 files)
✅ Task 1.3.1: All files present (1 file)
✅ Task 1.3.2: All files present (1 file)
✅ Task 1.4: All files present (1 file)
✅ Task 2.1: All files present (3 files)
✅ Task 2.2: All files present (3 files)
✅ Task 2.3: All files present (2 files)
✅ Task 3.1: All files present (2 files)
✅ Task 3.2: All files present (1 file)

SUMMARY: ✅ All 85 files verified and present

Missing Files: None
Unexpected Files: None
File System Health: 🟢 EXCELLENT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Step 4: Generate Recommendations

**Based on current state:**
```
💡 INTELLIGENT RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 URGENT (Action Required)
  1. Fix Task 1.2.5 database connection
     Impact: Blocking future tasks
     Time to fix: ~15 minutes
     Priority: HIGH

  2. Request Stripe API keys
     Impact: Will block Phase 5
     Time needed: External dependency
     Priority: MEDIUM

🟡 RECOMMENDED (Optimize)
  3. Take a 10-minute break
     Reason: 6 tasks completed in one session
     Benefit: Maintain quality and focus

  4. Batch tasks 4.1-4.3 together
     Reason: Similar cart operations
     Benefit: Save ~15 minutes setup time

  5. Review Phase 3 complexity
     Reason: Taking 20% longer than estimated
     Action: Adjust estimates for Phase 7-8

🟢 OPTIONAL (Nice to Have)
  6. Document ProductCard component thoroughly
     Benefit: Reusable pattern for other components

  7. Set up git commit hooks
     Benefit: Automated testing before commits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 SUGGESTED SCHEDULE

Today (Feb 20):
  ✅ Complete Phase 3 (1.5 hours remaining)
  ✅ Fix database issue (15 min)
  ✅ Total: 2 hours

Tomorrow (Feb 21):
  □ Phase 4: Cart Module (6 tasks, ~3 hours)
  □ Break: 15 min
  □ Phase 5: Start Checkout (2 tasks, ~1.5 hours)

This Week:
  Target: Complete Phases 3-6 (22 tasks)
  Estimated: 12 hours of work
  Status: On track for March 5 finish

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 WHEN TO TAKE BREAKS

Recommended break times:
  • After every 5 tasks (~2 hours) - Take 10 min break
  • After completing a phase - Take 15-30 min break
  • After 4 hours of work - Take 1 hour break

Your status: 6 tasks done today
Recommendation: ✅ Take a break after Task 3.3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Additional Features

### Compare with Initial Estimates
```
📊 VARIANCE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time Variance:
  Estimated avg: 25 min/task
  Actual avg: 27.5 min/task
  Variance: +10% (2.5 min slower)

Cost Variance:
  Estimated avg: $0.15/task
  Actual avg: $0.16/task
  Variance: +6.7% ($0.01 more per task)

Analysis:
  Phase 0: -5% (faster than expected)
  Phase 1: +8% (slightly slower)
  Phase 2: +15% (auth pages more complex)
  Phase 3: +20% (product components detailed)

Trend: ⚠️  Increasing complexity
Action: Consider adjusting future estimates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Export Options

At end of report, offer exports:
```
📤 EXPORT OPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like to export this report?

1️⃣  Save to file  - Save as progress-report.md
2️⃣  Export CSV    - Export metrics to progress.csv
3️⃣  Copy text     - Copy report to clipboard
4️⃣  No thanks     - Continue without saving

Your choice:
```

---

## Quick Stats Version

For quick checks:
```
/review-progress --quick
```

Shows abbreviated version:
```
📊 QUICK PROGRESS CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: [18/76] ████░░░░░░░░░░░░░░░░░░░░ 23.7%
Cost: $2.88 / ~$12.16 estimated
Phase: 3 of 15 (In Progress)
Status: 🟢 On Track

Last task: Task 3.2 (3:30 PM)
Next: Task 3.3 (In Progress)

Issues: 1 failed, 1 blocked
Health: 🟢 HEALTHY

For full report: /review-progress
```

---

This comprehensive review-progress command provides **complete visibility** into project health, progress, costs, and next steps! 📊✅