# Review Token Usage - Cost Analysis & Optimization

Generate comprehensive token usage reports with cost analysis, trends, efficiency metrics, and optimization recommendations.

---

## Command Usage

### Full Report (Default)
```
/review-token-usage
```
Complete analysis with all sections.

### Quick Summary
```
/review-token-usage --quick
```
Just the key numbers.

### Specific Phase
```
/review-token-usage --phase 2
```
Detailed analysis of one phase.

### Date Range
```
/review-token-usage --today
/review-token-usage --week
```
Filter by time period.

### Export
```
/review-token-usage --export csv
```
Export data to CSV file.

---

## Report Sections

The complete report includes:
1. Executive Summary
2. Overall Statistics
3. Cost Breakdown by Phase
4. Task-Level Analysis
5. Efficiency Metrics
6. Trend Analysis
7. Cost Projections
8. Budget Tracking
9. Optimization Recommendations
10. Export Options

---

## Workflow

### Step 1: Read & Parse systemTasks.md

1. **Extract token data for all tasks:**
   - Task number and name
   - Input tokens
   - Output tokens
   - Total tokens
   - Cost
   - Completion timestamp
   - Duration

2. **Calculate aggregates:**
   - Total tokens (input + output)
   - Total cost
   - Average per task
   - Cost by phase
   - Tokens by phase
   - Daily spending rate

3. **Identify patterns:**
   - Highest cost tasks
   - Lowest cost tasks
   - Outliers (unusually high/low)
   - Trends over time

---

### Step 2: Generate Comprehensive Report
```
╔══════════════════════════════════════════════════════════╗
║         TOKEN USAGE & COST ANALYSIS REPORT               ║
╚══════════════════════════════════════════════════════════╝

Generated: Monday, February 23, 2026 at 4:30 PM
Report Period: Feb 23, 2026 (1 day)
Tasks Analyzed: 5 of 12 completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EXECUTIVE SUMMARY

Total Spent:        $1.24
Tasks Completed:    5 (41.7%)
Avg Cost per Task:  $0.248
Status:             🟢 Under Budget

Key Findings:
  ✓ Costs tracking within estimate
  ✓ TypeScript verification adds ~5% overhead (expected)
  ⚠️ Phase 2 tasks slightly over estimate (Monaco complexity)
  ✓ On track for $4.39 total (below $5.00 budget)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 OVERALL STATISTICS

┌─────────────────────────────────────────────────────────┐
│ TOTAL USAGE                                             │
├─────────────────────────────────────────────────────────┤
│ Input Tokens:       48,200 ($0.145)                    │
│ Output Tokens:      32,800 ($0.492)                    │
│ Total Tokens:       81,000                             │
│ Implementation:     $0.86 (69.4%)                      │
│                                                          │
│ Testing Tokens:     29,840                             │
│ Testing Cost:       $0.38 (30.6%)                      │
│                                                          │
│ GRAND TOTAL:        $1.24                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ AVERAGES (Per Task)                                     │
├─────────────────────────────────────────────────────────┤
│ Avg Input:          9,640 tokens                       │
│ Avg Output:         6,560 tokens                       │
│ Avg Total:          16,200 tokens                      │
│ Avg Cost:           $0.248                             │
│ Avg Duration:       34 minutes                         │
│ Cost per Hour:      $0.44                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMPLETION STATUS                                        │
├─────────────────────────────────────────────────────────┤
│ Completed:          5 / 12 tasks (41.7%)               │
│ Remaining:          7 tasks                            │
│ Est. Remaining:     113,400 tokens                     │
│ Est. Cost:          $3.15                              │
│ PROJECTED TOTAL:    $4.39                              │
└─────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 COST BREAKDOWN BY PHASE

Phase 1: Foundation
[████████████] 2/2 (100%) ✅ COMPLETE
┌──────────────────────────────────────────────────────┐
│ Tasks:          2                                    │
│ Input:         18,400 tokens ($0.055)               │
│ Output:        12,200 tokens ($0.183)               │
│ Total:         30,600 tokens                        │
│ Cost:          $0.40                                │
│ Avg/Task:      $0.200                               │
│ Efficiency:    🟢 EXCELLENT                         │
└──────────────────────────────────────────────────────┘

Tasks:
  • 1.1: Project Scaffold & Dependencies  - 14,800 tok ($0.19)
  • 1.2: IDE Shell Layout & State Store   - 15,800 tok ($0.21)

Phase 2: File System & Editor
[████████████] 3/3 (100%) ✅ COMPLETE
┌──────────────────────────────────────────────────────┐
│ Tasks:          3                                    │
│ Input:         29,800 tokens ($0.089)               │
│ Output:        20,600 tokens ($0.309)               │
│ Total:         50,400 tokens                        │
│ Cost:          $0.84                                │
│ Avg/Task:      $0.280 (13% over estimate)           │
│ Efficiency:    🟡 GOOD                              │
└──────────────────────────────────────────────────────┘

Tasks:
  • 2.1: Backend File System API          - 16,400 tok ($0.25)
  • 2.2: File Explorer Sidebar            - 15,200 tok ($0.23)
  • 2.3: Monaco Editor + Tabs + Save      - 18,800 tok ($0.28)

Note: Higher cost due to Monaco dynamic import complexity + security validation

Phase 3: AI Chat & Agent
[░░░░░░░░░░░░] 0/2 (0%) ⏳ PENDING
┌──────────────────────────────────────────────────────┐
│ Tasks:          0 / 2                                │
│ Cost:           $0.00                               │
│ Status:         ⏳ NOT STARTED                       │
└──────────────────────────────────────────────────────┘

Remaining (Estimated):
  • 3.1: Model Config & Connection        - ~18,000 tok (~$0.27)
  • 3.2: AI Chat & Agent Panel            - ~22,000 tok (~$0.33)

Phase 4-6: Pending
┌──────────────────────────────────────────────────────┐
│ Remaining:      5 tasks                              │
│ Est. Tokens:    73,400 tokens                       │
│ Est. Cost:      $2.55                               │
│ Status:         ⏳ NOT STARTED                       │
└──────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 TASK-LEVEL ANALYSIS

┌─────────────────────────────────────────────────────────┐
│ MOST EXPENSIVE TASKS (Completed)                        │
├─────────────────────────────────────────────────────────┤
│ 1. Task 2.3: Monaco Editor + Tabs    18,800 tok  $0.28 │
│ 2. Task 2.1: Backend File System API 16,400 tok  $0.25 │
│ 3. Task 1.2: IDE Shell & State Store 15,800 tok  $0.21 │
│ 4. Task 2.2: File Explorer Sidebar   15,200 tok  $0.23 │
│ 5. Task 1.1: Project Scaffold        14,800 tok  $0.19 │
└─────────────────────────────────────────────────────────┘

Analysis:
  • Monaco task highest cost (dynamic import + theming)
  • Backend tasks consistent (~$0.24 avg)
  • Frontend tasks slightly higher (Playwright testing adds tokens)

┌─────────────────────────────────────────────────────────┐
│ MOST EFFICIENT TASKS (Best Value)                       │
├─────────────────────────────────────────────────────────┤
│ 1. Task 1.1: Project Scaffold        14,800 tok  $0.19 │
│ 2. Task 2.2: File Explorer Sidebar   15,200 tok  $0.23 │
│ 3. Task 2.1: Backend File System API 16,400 tok  $0.25 │
└─────────────────────────────────────────────────────────┘

Why efficient:
  • Clear file structure to generate
  • Well-defined acceptance criteria
  • curl-based tests (cheaper than Playwright)

┌─────────────────────────────────────────────────────────┐
│ OUTLIERS                                                 │
├─────────────────────────────────────────────────────────┤
│ HIGH: Task 2.3 (Monaco) - 16% over avg                 │
│       Reason: dynamic import pattern + dark theme setup │
└─────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 EFFICIENCY METRICS

┌─────────────────────────────────────────────────────────┐
│ TOKEN EFFICIENCY SCORE: 8.5/10 (GOOD)                   │
└─────────────────────────────────────────────────────────┘

Metrics:
  • Tokens per Task:     16,200 avg (target: <20,000) ✅
  • Cost per Task:       $0.248 avg (target: <$0.30)  ✅
  • Input/Output Ratio:  1.47:1 (healthy balance)     ✅
  • Fix Overhead:        0% so far (target: <5%)      ✅
  • Test Cost Ratio:     30.6% (target: <35%)         ✅

┌─────────────────────────────────────────────────────────┐
│ EFFICIENCY BY TEST TYPE                                  │
├─────────────────────────────────────────────────────────┤
│ curl tests (backend):     low token cost    🟢          │
│ WebSocket tests:          medium cost       🟢          │
│ Playwright (frontend):    higher cost       🟡          │
└─────────────────────────────────────────────────────────┘

Interpretation:
  🟢 Excellent (<17k tokens)
  🟡 Good (17-22k tokens)
  🟠 Acceptable (22-28k tokens)
  🔴 Review needed (>28k tokens)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📉 TREND ANALYSIS

Cost Trend (Today):
  Tasks 1.1-1.2: $0.195/task avg (Phase 1 — setup)
  Tasks 2.1-2.3: $0.253/task avg (Phase 2 — complexity spike)
  Trend: 📈 Rising with complexity (expected)

Phase-over-Phase:
  Phase 1: $0.200/task (baseline scaffold)
  Phase 2: $0.280/task (+40% — security + Monaco)
  
  Reason: Phase 2 adds backend security validation,
  atomic writes, WebSocket, and Monaco dynamic imports

Velocity vs Cost:
  Tasks/Day: ~5 tasks
  Cost/Day:  $1.24
  TypeScript verification: ~5% overhead per task ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 COST PROJECTIONS

┌─────────────────────────────────────────────────────────┐
│ BASED ON CURRENT AVERAGES                                │
├─────────────────────────────────────────────────────────┤
│ Completed:          5 tasks                             │
│ Avg Cost:           $0.248/task                         │
│ Remaining:          7 tasks                             │
│ Est. Remaining:     $3.15                               │
│ PROJECTED TOTAL:    $4.39                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BEST CASE SCENARIO (Optimistic)                          │
├─────────────────────────────────────────────────────────┤
│ Assumption: Patterns established, efficiency improves   │
│ Avg Cost: $0.220/task                                   │
│ Remaining: $1.54                                        │
│ Total: $2.78                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ WORST CASE SCENARIO (Conservative)                       │
├─────────────────────────────────────────────────────────┤
│ Assumption: Agent streaming + node-pty are complex      │
│ Avg Cost: $0.320/task                                   │
│ Remaining: $2.24                                        │
│ Total: $3.48                                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ TASK-BY-TASK PROJECTION                                  │
├─────────────────────────────────────────────────────────┤
│ 3.1: Model Config & Connection     ~$0.27               │
│ 3.2: AI Chat & Agent Panel         ~$0.33 (streaming)  │
│ 4.1: Real Terminal (node-pty)      ~$0.30 (native)     │
│ 5.1: Git Backend API               ~$0.25               │
│ 5.2: Git Panel UI                  ~$0.26               │
│ 6.1: AI Inline Autocomplete        ~$0.27               │
│ 6.2: Polish, Shortcuts & Settings  ~$0.47 (largest)    │
│                                                          │
│ TOTAL PROJECTED:                   $4.39                │
└─────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 BUDGET TRACKING

┌─────────────────────────────────────────────────────────┐
│ BUDGET STATUS                                            │
├─────────────────────────────────────────────────────────┤
│ Original Budget:    $5.00                               │
│ Spent So Far:       $1.24 (24.8%)                       │
│ Remaining Budget:   $3.76 (75.2%)                       │
│ Projected Total:    $4.39 (87.8%)                       │
│ Buffer Remaining:   $0.61 (12.2%)                       │
│                                                          │
│ Status: 🟢 UNDER BUDGET                                 │
│                                                          │
│ Budget Progress:                                         │
│ [████░░░░░░░░░░░░░░░░░░░░░░░░░░] 24.8%                 │
│                                                          │
│ Projected at Completion:                                 │
│ [██████████████░░░░░░░░░░░░░░░░] 87.8%                 │
└─────────────────────────────────────────────────────────┘

Budget Alerts:
  ✅ On track — 24.8% spent, 41.7% tasks done
  ⚠️ Buffer is thin ($0.61) — monitor closely
  ✅ No overspend risk at current rate

Burn Rate:
  Daily Spend: $1.24/day
  Days Remaining: ~2.5 days (at current pace)
  Projected Finish: Feb 25-26, 2026

Budget Milestones:
  ✅ 42% tasks done, 24.8% budget used (ahead)
  ⏳ 75% tasks - projected $3.29 (target: $3.75)
  ⏳ 100% tasks - projected $4.39 (target: $5.00)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 OPTIMIZATION RECOMMENDATIONS

🔴 HIGH PRIORITY (Immediate Action)

1. **Monitor Task 3.2 (Agent Panel)**
   Risk: SSE streaming + agent loop logic is complex
   Est. Cost: $0.33 (33% over avg)
   Action: Read BACKEND_ARCHITECTURE.md carefully before starting
   Note: 20-iteration cap is already in task spec — follow it

2. **Monitor Task 4.1 (node-pty)**
   Risk: Native module may need rebuild, adds tokens
   Action: Run `npm rebuild node-pty` before testing
   Contingency: If node-pty fails, budget $0.05 for fix tokens

🟡 MEDIUM PRIORITY (Plan For)

3. **Batch Tasks 5.1 + 5.2 (Git)**
   Current: Setup overhead per task
   Opportunity: Execute together (same git domain)
   Est. Savings: $0.05 (setup time)

4. **Reuse Test Patterns**
   Current: Each task generates test scenarios fresh
   Opportunity: Reference TEST_SCENARIOS.md patterns
   Est. Savings: ~$0.03/task × 7 remaining = $0.21

🟢 LOW PRIORITY (Nice to Have)

5. **Task 6.2 (Polish) is largest task**
   Estimated $0.47 — largest remaining task
   Multiple features: Ctrl+P palette, sidebar toggle, toasts, settings modal
   Consider splitting if context window becomes large

TOTAL POTENTIAL SAVINGS: ~$0.30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 DETAILED BREAKDOWN (Optional)

Include full task-by-task breakdown? (yes/no)

[If yes, shows every single task with:]
  • Task number and name
  • Input tokens
  • Output tokens
  • Total tokens
  • Cost (implementation + testing)
  • Duration
  • TypeScript errors at completion
  • Test pass rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 EXPORT OPTIONS

1️⃣  Export Full Report (Markdown)
    File: .claude/reports/token-report-2026-02-23.md

2️⃣  Export Data (CSV)
    File: .claude/reports/token-data-2026-02-23.csv
    Fields: Task, Phase, Tokens, Cost, Date, Duration

3️⃣  Export Summary (JSON)
    File: .claude/reports/token-summary-2026-02-23.json

4️⃣  Copy to Clipboard

5️⃣  No Export

Your choice (1-5):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SUMMARY & NEXT STEPS

HEALTH: 🟢 GOOD (buffer is thin but manageable)

Key Takeaways:
  ✅ 24.8% budget used for 41.7% of work done
  ✅ All tasks tested — 100% pass rate so far
  ⚠️ $0.61 buffer — monitor Tasks 3.2 and 4.1 closely
  ✅ TypeScript strict mode maintained throughout

Immediate Actions:
  1. Continue with Task 3.1 (Model Config)
  2. Read BACKEND_ARCHITECTURE.md before Task 3.2 (agent)
  3. Prepare node-pty rebuild command for Task 4.1

Next Command:
  /execute-task       (continue normal execution)
  /continue-tasks 3   (batch next 3 tasks)

╚══════════════════════════════════════════════════════════╝
```

---

## Quick Summary Version
```
/review-token-usage --quick
```

Displays:
```
📊 TOKEN USAGE - QUICK SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spent:      $1.24 / $5.00 (24.8%)
Tasks:      5 / 12 (41.7%)
Avg/Task:   $0.248
Projected:  $4.39 (under budget ✅)
Buffer:     $0.61 remaining

Status: 🟢 GOOD

Top Costs:
  1. Task 2.3: Monaco Editor ($0.28)
  2. Task 2.1: File System API ($0.25)
  3. Task 2.2: File Explorer ($0.23)

Watch: Task 3.2 (agent streaming) and Task 4.1 (node-pty)

For detailed report: /review-token-usage
```

---

## CSV Export Format

`token-data-2026-02-23.csv`:
```csv
Task,Phase,Name,Input_Tokens,Output_Tokens,Total_Tokens,Impl_Cost,Test_Cost,Total_Cost,Date,Duration_Min,TS_Errors,Test_Pass_Rate
1.1,1,Project Scaffold & Dependencies,8880,5920,14800,0.13,0.06,0.19,2026-02-23,35,0,100%
1.2,1,IDE Shell Layout & State Store,9520,6280,15800,0.14,0.07,0.21,2026-02-23,30,0,100%
2.1,2,Backend File System API,9840,6560,16400,0.17,0.08,0.25,2026-02-23,35,0,100%
2.2,2,File Explorer Sidebar,9120,6080,15200,0.15,0.08,0.23,2026-02-23,32,0,100%
2.3,2,Monaco Editor + Tabs + Save,11280,7520,18800,0.19,0.09,0.28,2026-02-23,38,0,100%
```