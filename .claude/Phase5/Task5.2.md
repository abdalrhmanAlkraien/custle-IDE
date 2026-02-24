📄 Task 5.2 — Git Panel UI (Source Control)
=========================================

🎯 Objective
------------
Build the full source control panel in the sidebar: file changes with
inline diff view, stage/unstage, commit input, push/pull, branch
switcher, and commit history — matching IntelliJ/VS Code quality.

📂 File Locations
=================
```shell
frontend/src/components/sidebar/GitPanel.tsx
frontend/src/components/sidebar/GitFileItem.tsx
frontend/src/components/sidebar/GitHistory.tsx
frontend/src/components/sidebar/BranchSwitcher.tsx
frontend/src/lib/api/gitApi.ts
frontend/src/store/gitStore.ts
```
1️⃣ gitStore.ts
===============
```typescript
interface GitStore {
  status: GitStatus | null;
  history: GitCommit[];
  branches: { current: string; local: string[]; remote: string[] };
  isLoading: boolean;
  selectedFile: string | null;
  refresh: () => Promise<void>;
  stageFile: (path: string) => Promise<void>;
  unstageFile: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (name: string) => Promise<void>;
}
```
Auto-refresh every 30 seconds + on file watcher events.

2️⃣ GitPanel.tsx layout
========================
```shell
┌─────────────────────────────┐
│ SOURCE CONTROL    [↑] [↓] [⟳]│  ← push, pull, refresh
├─────────────────────────────┤
│ Branch: main ▾              │  ← BranchSwitcher dropdown
├─────────────────────────────┤
│ STAGED CHANGES (2)    [−all]│
│  M  src/app.ts          [−] │
│  A  src/new.ts          [−] │
├─────────────────────────────┤
│ CHANGES (3)           [+all]│
│  M  src/utils.ts        [+] │
│  D  src/old.ts          [+] │
│  ?  src/temp.ts         [+] │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Commit message...       │ │
│ └─────────────────────────┘ │
│              [Commit & Push] │
├─────────────────────────────┤
│ HISTORY                     │
│  abc123 Fix login bug   2h  │
│  def456 Add auth        1d  │
└─────────────────────────────┘
```

3️⃣ GitFileItem.tsx
===================
- Status badge: M (yellow), A (green), D (red), ? (grey), R (blue)
- File name + relative path
- [+] stage / [−] unstage button
- Click file: open diff view in editor (split view: before | after)
- Hover: show full path tooltip

4️⃣ BranchSwitcher.tsx
======================
- Shows current branch with git icon
- Click: dropdown with all local branches
- Search input inside dropdown
- "Create new branch" input at bottom
- Remote branches section (greyed, click to checkout)

5️⃣ Diff View
=============
When clicking a changed file: open a special diff tab in the editor:
```typescript
// Use Monaco's createDiffEditor:
monaco.editor.createDiffEditor(container, {
  theme: 'neural-dark',
  readOnly: false, // right side editable
  renderSideBySide: true,
  originalEditable: false,
});
// original: file content from git (git show HEAD:path)
// modified: current file content
```

🧪 Test Scenarios
=================

### Scenario 1: Show changes
- Modify a file in the workspace
- Expected: File appears in CHANGES section with M badge

### Scenario 2: Stage file
- Click [+] on a changed file
- Expected: Moves to STAGED CHANGES section

### Scenario 3: Commit
- Stage files, type message, click Commit
- Expected: Commit created, changes cleared, history updates

### Scenario 4: Branch switch
- Click branch name, select different branch
- Expected: Branch switches, file tree refreshes

### Scenario 5: Diff view
- Click a modified file
- Expected: Side-by-side diff opens in editor with color highlights

### Scenario 6: Push
- Make commit, click push ↑
- Expected: Changes pushed to remote, ahead/behind updates

🔒 Non-Functional Requirements
===============================
- Auto-refresh every 30 seconds
- Commit button disabled if no staged files or no message
- Push/pull show progress spinner

✅ Deliverable
==============
```shell
Full git panel with diff view, stage/commit/push/pull, branch management
```

📊 Acceptance Criteria
======================
- [ ] Real git status shows in panel
- [ ] Stage/unstage works
- [ ] Commit creates real git commit
- [ ] Push/pull work with remote
- [ ] Branch switching works
- [ ] Diff view opens with correct changes
- [ ] No TypeScript errors

⏱️ Estimated Duration: 75-90 minutes
🔗 Dependencies: Task 5.1, Task 2.3
🔗 Blocks: Nothing