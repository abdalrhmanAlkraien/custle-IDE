📄 Task 5.1 — Git Backend API
=========================================

🎯 Objective
------------
Build the full git API using simple-git: status, diff, stage, commit,
push, pull, branch management, and commit history.

📂 File Locations
=================
```shell
backend/src/routes/git.ts
backend/src/services/gitService.ts
```
1️⃣ Git Routes — /api/git
==========================
```shell
GET  /api/git/status              → {branch, ahead, behind, files: GitFileStatus[]}
GET  /api/git/diff?path=          → unified diff for a file
GET  /api/git/log?limit=50        → commit history [{hash, message, author, date}]
GET  /api/git/branches            → {current, local[], remote[]}
POST /api/git/stage               → body: {paths: string[]} → git add
POST /api/git/unstage             → body: {paths: string[]} → git restore --staged
POST /api/git/commit              → body: {message: string} → git commit
POST /api/git/push                → git push, returns {success, output}
POST /api/git/pull                → git pull, returns {success, output, conflicts}
POST /api/git/checkout            → body: {branch: string} → git checkout
POST /api/git/branch/create       → body: {name: string} → git checkout -b
POST /api/git/stash               → git stash
POST /api/git/stash/pop           → git stash pop
POST /api/git/clone               → body: {url: string, path: string} → git clone
```

2️⃣ gitService.ts
=================
```typescript
import simpleGit, { SimpleGit } from 'simple-git';

let git: SimpleGit;

export function initGit(workspacePath: string) {
  git = simpleGit(workspacePath);
}

export async function getStatus(): Promise<GitStatus> {
  const status = await git.status();
  const files: GitFileStatus[] = [
    ...status.modified.map(p => ({ path: p, status: 'modified', staged: false })),
    ...status.staged.map(p => ({ path: p, status: 'modified', staged: true })),
    ...status.created.map(p => ({ path: p, status: 'added', staged: false })),
    ...status.deleted.map(p => ({ path: p, status: 'deleted', staged: false })),
    ...status.not_added.map(p => ({ path: p, status: 'untracked', staged: false })),
  ];
  return { branch: status.current!, ahead: status.ahead,
           behind: status.behind, files };
}
// implement all other git operations
```

🧪 Test Scenarios
=================

### Scenario 1: Get status
```bash
curl http://localhost:3001/api/git/status
```
Expected: Real git status of workspace

### Scenario 2: Stage and commit
```bash
curl -X POST http://localhost:3001/api/git/stage \
  -d '{"paths": ["src/test.ts"]}'
curl -X POST http://localhost:3001/api/git/commit \
  -d '{"message": "test commit"}'
```
Expected: File staged and committed

### Scenario 3: Clone repo
```bash
curl -X POST http://localhost:3001/api/git/clone \
  -d '{"url": "https://github.com/user/repo", "path": "/tmp/repo"}'
```
Expected: Repo cloned, workspace opened

🔒 Non-Functional Requirements
===============================
- All git operations must run within workspace root
- Push/pull must handle auth errors gracefully

✅ Deliverable
==============
```shell
Full git REST API using simple-git
```

📊 Acceptance Criteria
======================
- [ ] All git endpoints return correct data
- [ ] Stage/commit/push/pull work on real repo
- [ ] Clone works
- [ ] Error responses for non-git folders

⏱️ Estimated Duration: 45-60 minutes
🔗 Dependencies: Task 2.1
🔗 Blocks: Task 5.2