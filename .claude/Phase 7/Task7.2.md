# Task 7.2: Native Folder Browser & Git Status for Opened Projects

**Phase**: Phase 7 — GitHub Integration  
**Task Number**: 7.2  
**Status**: ⏳ PENDING  
**Dependencies**: 7.1 (GitHub Integration), 5.1 (Git Backend API), 2.1 (File System API)  
**Blocks**: Nothing  
**Estimated Duration**: 70-85 minutes  
**Estimated Cost**: ~$0.42 (Implementation: $0.30, Testing: $0.12)

---

## Objective

Fix two problems visible in the screenshot:

**Problem 1 — Folder opener is broken:**
The Files tab shows a manual text input for folder path. The browser cannot browse the local file system (security restriction). Replace with a backend-powered **folder browser** that lets the user navigate their real file system from the UI — no manual path typing required.

**Problem 2 — Git tab is workspace-unaware:**
When the user opens a local project that has a `.git` folder, the Git tab should automatically detect it and show: changed files, file status (modified/added/deleted/untracked), staging area, commit form, and push button. If the project is also connected to a GitHub remote (matching the user's connected GitHub account), show the remote branch and enable push.

---

## Part 1 — Native Folder Browser

### Problem

The browser's `<input type="file">` cannot select directories with full paths. Even with `webkitdirectory` it only gives relative paths. The current text input requires the user to know and type the exact absolute path.

### Solution

Add a **backend folder browser API**. The backend has full OS file system access. The frontend calls it to navigate directories and pick a folder — like a native dialog, but rendered in the browser.

### 1A. New Backend Endpoint: `GET /api/workspace/browse`

Add to `backend/src/routes/workspace.ts`:

```
GET /api/workspace/browse?path=/Users/john
  - Lists subdirectories (not files) at the given path
  - If path omitted: returns OS home directory + common locations
  - Response:
    {
      current: "/Users/john",
      parent: "/Users",
      dirs: [
        { name: "Desktop",    path: "/Users/john/Desktop",    hasChildren: true },
        { name: "Documents",  path: "/Users/john/Documents",  hasChildren: true },
        { name: "projects",   path: "/Users/john/projects",   hasChildren: true },
        { name: ".config",    path: "/Users/john/.config",    hasChildren: true }
      ],
      quickAccess: [
        { name: "Home",       path: "/Users/john" },
        { name: "Desktop",    path: "/Users/john/Desktop" },
        { name: "Documents",  path: "/Users/john/Documents" },
        { name: "Downloads",  path: "/Users/john/Downloads" }
      ]
    }

  Security: No path traversal restriction here (user is browsing their OWN machine)
            but still sanitize the path (resolve, check exists, check isDirectory)
  
  Error 400: { error: "Path does not exist" }
  Error 400: { error: "Not a directory" }
```

Implementation in `workspaceService.ts`:
```typescript
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export async function browseDirectory(dirPath?: string): Promise<BrowseResult> {
  const target = dirPath ? path.resolve(dirPath) : os.homedir();
  
  // Validate path exists and is directory
  const stat = await fs.stat(target);
  if (!stat.isDirectory()) throw new Error('Not a directory');
  
  // Read dir entries, filter to directories only
  const entries = await fs.readdir(target, { withFileTypes: true });
  const dirs = await Promise.all(
    entries
      .filter(e => e.isDirectory())
      .map(async e => {
        const fullPath = path.join(target, e.name);
        const children = await fs.readdir(fullPath).catch(() => []);
        const hasChildren = children.some(async c => {
          // check if any child is a dir — simplified: just check count > 0
          return true;
        });
        return { name: e.name, path: fullPath, hasChildren: children.length > 0 };
      })
  );
  
  const home = os.homedir();
  return {
    current: target,
    parent: path.dirname(target) !== target ? path.dirname(target) : null,
    dirs: dirs.sort((a, b) => a.name.localeCompare(b.name)),
    quickAccess: [
      { name: 'Home',      path: home },
      { name: 'Desktop',   path: path.join(home, 'Desktop') },
      { name: 'Documents', path: path.join(home, 'Documents') },
      { name: 'Downloads', path: path.join(home, 'Downloads') },
    ].filter(q => require('fs').existsSync(q.path))
  };
}
```

### 1B. New Frontend Component: `FolderBrowser.tsx`

Replace the current "Open a Folder to Start" text input with a **folder browser modal**.

**Trigger:** User clicks "Open Folder" button in Files tab → modal opens.

**UI layout:**
```
┌─────────────────────────────────────────────┐
│  📁 Open Folder                        [✕]  │
├─────────────────────────────────────────────┤
│  Quick Access                               │
│  🏠 Home   🖥 Desktop  📄 Documents  📥 Downloads │
├─────────────────────────────────────────────┤
│  📂 /Users/john/projects           [↑ Up]  │
├─────────────────────────────────────────────┤
│  📁 custle-IDE                              │
│  📁 my-api                                  │
│  📁 react-app                               │
│  📁 rust-project                            │
│  ...                                        │
├─────────────────────────────────────────────┤
│  Selected: /Users/john/projects/react-app   │
│                      [Cancel]  [Open Folder]│
└─────────────────────────────────────────────┘
```

Behavior:
- Opens at OS home directory by default
- Click a folder → navigates into it (calls `/api/workspace/browse?path=...`)
- Click "↑ Up" → navigates to parent
- Click Quick Access shortcuts → jumps directly
- Single-click selects folder (highlights it, updates "Selected:" path at bottom)
- Double-click navigates into folder
- "Open Folder" button → calls existing `POST /api/workspace/open` with selected path → closes modal

**Files to create/modify:**
```
frontend/src/components/
  sidebar/
    FolderBrowser.tsx         ← NEW: folder browser modal
    FileExplorer.tsx          ← MODIFY: replace text input with FolderBrowser trigger
```

---

## Part 2 — Git Status for Opened Local Projects

### Problem

When the user opens a local project with `.git/`, the Git tab shows nothing useful. It should automatically detect git and show the working tree status.

### Solution

When a workspace is opened via `POST /api/workspace/open`, the backend checks for `.git/`. If found, it runs `git status` and returns the git state alongside the file tree. The Git tab reacts to this and shows the full local git panel.

### 2A. Enhance `POST /api/workspace/open` Response

Modify `backend/src/routes/workspace.ts` to include git detection:

```typescript
// Current response:
{ path, name, tree }

// New response:
{
  path: string,
  name: string,
  tree: FileNode[],
  git: {
    isRepo: boolean,
    // Only present if isRepo = true:
    branch?: string,          // current branch name
    ahead?: number,           // commits ahead of remote
    behind?: number,          // commits behind remote
    remote?: string | null,   // remote URL (e.g. https://github.com/user/repo.git)
    remoteOwner?: string | null,  // parsed from remote URL
    repoName?: string | null,     // parsed from remote URL
    changes?: GitChange[]     // modified/added/deleted/untracked files
  }
}

interface GitChange {
  path: string          // file path relative to workspace root
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged'
  staged: boolean       // true = in staging area
}
```

Implementation in `backend/src/services/gitService.ts`:
```typescript
import simpleGit from 'simple-git';

export async function getWorkspaceGitStatus(workspacePath: string) {
  const git = simpleGit(workspacePath);
  
  // Check if git repo
  const isRepo = await git.checkIsRepo().catch(() => false);
  if (!isRepo) return { isRepo: false };
  
  // Get status
  const status = await git.status();
  const remotes = await git.getRemotes(true);
  const remote = remotes.find(r => r.name === 'origin')?.refs?.fetch || null;
  
  // Parse owner/repo from remote URL
  // https://github.com/owner/repo.git → { remoteOwner: 'owner', repoName: 'repo' }
  const match = remote?.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  
  // Map simple-git status to GitChange[]
  const changes: GitChange[] = [
    ...status.modified.map(f => ({ path: f, status: 'modified', staged: false })),
    ...status.staged.map(f => ({ path: f, status: 'staged', staged: true })),
    ...status.not_added.map(f => ({ path: f, status: 'untracked', staged: false })),
    ...status.deleted.map(f => ({ path: f, status: 'deleted', staged: false })),
    ...status.created.map(f => ({ path: f, status: 'added', staged: false })),
    ...status.renamed.map(f => ({ path: f.to, status: 'renamed', staged: false })),
  ];
  
  return {
    isRepo: true,
    branch: status.current,
    ahead: status.ahead,
    behind: status.behind,
    remote,
    remoteOwner: match?.[1] || null,
    repoName: match?.[2] || null,
    changes
  };
}
```

### 2B. New Backend Endpoints in `backend/src/routes/git.ts`

Add these to the existing git router:

```
POST /api/git/stage
  Body: { paths: string[] }   // file paths to stage (git add)
  Response: { success: true }

POST /api/git/unstage
  Body: { paths: string[] }   // file paths to unstage (git reset HEAD)
  Response: { success: true }

POST /api/git/commit
  Body: { message: string }
  Validates: message not empty, staged files exist
  Response: { success: true, hash: string, message: string }

POST /api/git/push
  Body: { remote?: string, branch?: string }  // defaults: 'origin', current branch
  Uses: PAT from github_credentials table (if available) for HTTPS push
        Falls back to SSH if no PAT
  Response: { success: true, branch: string }
  Error 401: { error: "No credentials for push" }
  Error 500: { error: "Push failed: ..." }

GET /api/git/status
  Response: same GitStatus shape as workspace/open git field
            Returns { isRepo: false } if no workspace open
```

### 2C. Update `frontend/src/store/gitStore.ts`

Create or update with:

```typescript
interface GitStatus {
  isRepo: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  remote: string | null;
  remoteOwner: string | null;
  repoName: string | null;
  changes: GitChange[];
}

interface GitState {
  status: GitStatus | null;
  loading: boolean;
  commitMessage: string;
  pushing: boolean;
  // Actions
  loadStatus: () => Promise<void>;
  stageFiles: (paths: string[]) => Promise<void>;
  unstageFiles: (paths: string[]) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  setCommitMessage: (msg: string) => void;
}
```

`loadStatus()` is called:
1. When workspace opens (from the git field in workspace/open response)
2. When user switches to Git tab
3. After stage/unstage/commit/push operations
4. When file:change WebSocket event is received

### 2D. Update `frontend/src/components/git/GitPanel.tsx`

The Git tab now has three sections:

```
┌─────────────────────────────────────────────┐
│  SECTION 1: GitHub Account (from Task 7.1)  │
│  [GitHubConnect or RepoList]                │
├─────────────────────────────────────────────┤
│  SECTION 2: Local Workspace Git Status      │
│  (shown when workspace has .git/)           │
│                                             │
│  Branch: main  ↑2 ahead  ↓0 behind         │
│  Remote: github.com/user/my-project  [Push] │
│                                             │
│  ── Changes (3) ──────────────────────────  │
│  [+] src/App.tsx          M  [Stage]        │
│  [+] src/utils.ts         M  [Stage]        │
│  [+] README.md            U  [Stage]        │
│                                             │
│  ── Staged (1) ────────────────────────── │
│  [-] package.json         A  [Unstage]      │
│                                             │
│  [Stage All]  [Unstage All]                 │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Commit message...                   │   │
│  └─────────────────────────────────────┘   │
│                    [Commit] [Commit & Push] │
│                                             │
│  (No .git detected — open a git project)   │
│   ← shown when isRepo: false               │
├─────────────────────────────────────────────┤
│  SECTION 3: GitHub Repos (from Task 7.1)   │
│  [RepoList — if connected]                 │
└─────────────────────────────────────────────┘
```

**Status badges:**
- `M` = Modified (orange)
- `A` = Added / New (green)
- `D` = Deleted (red)
- `R` = Renamed (blue)
- `U` = Untracked (gray)

**Push button behavior:**
- If GitHub PAT is saved (Task 7.1) AND `remoteOwner` matches the connected GitHub username → use PAT for HTTPS push
- If no PAT → attempt SSH push (may fail if no SSH key — show error message)
- Show push spinner + disable button while pushing
- After push: reload git status

**GitHub remote link:**
- If `remoteOwner` matches connected GitHub account (Task 7.1) → show as clickable link
- If different owner (fork/other account) → show URL as plain text

---

## Expected Outputs

```
backend/
  src/
    routes/
      workspace.ts    ← MODIFIED: add /browse endpoint, add git to open response
      git.ts          ← MODIFIED: add /stage, /unstage, /commit, /push, /status
    services/
      workspaceService.ts  ← MODIFIED or NEW: browseDirectory() function
      gitService.ts        ← MODIFIED: add getWorkspaceGitStatus(), stage, commit, push

frontend/
  src/
    components/
      sidebar/
        FolderBrowser.tsx    ← NEW: folder browser modal
        FileExplorer.tsx     ← MODIFIED: trigger FolderBrowser instead of text input
      git/
        GitPanel.tsx         ← MODIFIED: add local git status section
    store/
      gitStore.ts            ← NEW or MODIFIED: GitState with stage/commit/push
```

---

## Test Criteria

| # | Scenario | Type | Expected |
|---|----------|------|----------|
| 1 | Browse home directory | curl | GET /api/workspace/browse → `{ current, dirs[], quickAccess[] }` |
| 2 | Browse subdirectory | curl | GET /api/workspace/browse?path=/tmp → dirs list |
| 3 | Browse invalid path | curl | GET /api/workspace/browse?path=/nonexistent → 400 |
| 4 | Open git repo — response includes git | curl | POST /api/workspace/open (git project) → response has `git.isRepo: true, branch, changes[]` |
| 5 | Open non-git folder — git false | curl | POST /api/workspace/open (plain folder) → `git.isRepo: false` |
| 6 | Stage files | curl | POST /api/git/stage `{paths:["file.ts"]}` → 200 |
| 7 | Commit staged files | curl | POST /api/git/commit `{message:"test"}` → `{ success, hash }` |
| 8 | Folder browser modal opens | Playwright | Click "Open Folder" → modal appears with dir list |
| 9 | Navigate in browser | Playwright | Click a folder in modal → path updates, new dir list loads |
| 10 | Open folder from browser | Playwright | Select folder + click Open → file tree loads |
| 11 | Git tab shows changes | Playwright | Open git project → Git tab shows branch, file changes |
| 12 | Stage file from UI | Playwright | Click Stage on file → file moves to Staged section |
| 13 | Commit from UI | Playwright | Enter message + Commit → success, changes cleared |

---

## Critical Notes

### Folder Browser — No Path Traversal Restriction
The browse endpoint intentionally allows browsing anywhere on the user's machine. This is a single-user local app — the user IS the machine owner. Do NOT apply `validatePath()` to the browse endpoint (it would block browsing outside workspace root, which is the whole point).

### Push via PAT (HTTPS)
When pushing with GitHub PAT, construct the remote URL with credentials:
```typescript
// Inject PAT into remote URL for push
// https://github.com/user/repo.git → https://TOKEN@github.com/user/repo.git
const authedUrl = remote.replace('https://', `https://${token}@`);
await git.push(authedUrl, branch);
```
Do NOT store the URL with token in git config (security). Use it only for the push call, then restore original remote.

### .git Detection is Automatic
No user action needed — opening a workspace triggers git detection. If the folder later gets `git init`, the user can refresh via the Git tab.

### Commit & Push Button
"Commit & Push" is a convenience — runs commit then immediately runs push. If push fails (no remote, no credentials), commit still stands and an error is shown.

### reactStrictMode: false
Already set — do not change.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|---------|
| `browseDirectory` returns empty on macOS | macOS needs Full Disk Access permission for the terminal running the backend |
| Push fails with `authentication failed` | PAT needs `repo` scope. Check token in github_credentials table. |
| `git.status()` hangs | Workspace path is not a git repo — always use `checkIsRepo()` first |
| Quick Access paths don't exist on Linux | Filter quickAccess with `fs.existsSync()` before returning |
| Stage shows wrong files after commit | Reload git status from backend after every mutation |