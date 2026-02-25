# Task 7.1: GitHub Integration — Token Auth, Credential Storage & Repository Browser

**Phase**: Phase 7 — GitHub Integration  
**Task Number**: 7.1  
**Status**: ⏳ PENDING  
**Dependencies**: 5.1 (Git Backend API), 5.2 (Git Panel UI)  
**Blocks**: 7.2 (Clone & Open Repository)  
**Estimated Duration**: 75-90 minutes  
**Estimated Cost**: ~$0.45 (Implementation: $0.32, Testing: $0.13)

---

## Objective

Enable the user to connect their GitHub account from the browser by entering a Personal Access Token (PAT). The token is validated against the GitHub API, then saved to a **LiteDB** (better-sqlite3) in-memory/file-backed database alongside the user's GitHub profile. The Git tab then loads and displays all repositories from the user's GitHub account (public + private).

---

## Background — What the Screenshot Shows

The current Git tab shows:
- **"Open a workspace to use Git"** — local git only
- No GitHub account connection
- No repo browser

After this task, the Git tab will show:
- **Connect GitHub** button (when not connected)
- GitHub profile (avatar, username) once connected
- Full list of the user's repositories (filterable)
- Clone button per repo → handled in Task 7.2

---

## Architecture

### New Components

```
backend/src/
├── db/
│   └── database.ts             ← better-sqlite3 setup + schema init
├── routes/
│   └── github.ts               ← NEW: /api/github/* endpoints
└── services/
    └── githubService.ts        ← NEW: GitHub API calls + credential ops

frontend/src/
├── components/
│   └── git/
│       ├── GitPanel.tsx        ← MODIFY: add GitHub section
│       ├── GitHubConnect.tsx   ← NEW: token input + connect UI
│       └── RepoList.tsx        ← NEW: repository browser
└── store/
    └── githubStore.ts          ← NEW: Zustand store for GitHub state
```

### Database Schema (better-sqlite3)

```sql
-- Credentials table (one row per user — single-user app)
CREATE TABLE IF NOT EXISTS github_credentials (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  token       TEXT NOT NULL,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  name        TEXT,
  connected_at TEXT NOT NULL
);

-- Cached repositories (refreshed on demand)
CREATE TABLE IF NOT EXISTS github_repos (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  full_name    TEXT NOT NULL UNIQUE,
  description  TEXT,
  private      INTEGER NOT NULL DEFAULT 0,
  clone_url    TEXT NOT NULL,
  ssh_url      TEXT NOT NULL,
  html_url     TEXT NOT NULL,
  language     TEXT,
  updated_at   TEXT NOT NULL,
  stargazers   INTEGER DEFAULT 0,
  fork         INTEGER DEFAULT 0
);
```

---

## Requirements

### 1. Install Dependencies

```bash
cd backend
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### 2. Create `backend/src/db/database.ts`

```typescript
import Database from 'better-sqlite3';
import path from 'path';

// Use in-memory DB during tests, file-backed otherwise
const DB_PATH = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'data', 'custle.db');

// Ensure data directory exists for file-backed mode
if (DB_PATH !== ':memory:') {
  import('fs').then(fs => fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }));
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS github_credentials (
    id           INTEGER PRIMARY KEY DEFAULT 1,
    token        TEXT NOT NULL,
    username     TEXT NOT NULL,
    avatar_url   TEXT,
    name         TEXT,
    connected_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS github_repos (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    full_name    TEXT NOT NULL UNIQUE,
    description  TEXT,
    private      INTEGER NOT NULL DEFAULT 0,
    clone_url    TEXT NOT NULL,
    ssh_url      TEXT NOT NULL,
    html_url     TEXT NOT NULL,
    language     TEXT,
    updated_at   TEXT NOT NULL,
    stargazers   INTEGER DEFAULT 0,
    fork         INTEGER DEFAULT 0
  );
`);

export default db;
```

### 3. Create `backend/src/services/githubService.ts`

Implement these functions using the `github_credentials` and `github_repos` tables:

```typescript
interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
  fork: boolean;
}

// Validate token by calling GET https://api.github.com/user
// Returns user profile if valid, throws if invalid
export async function validateToken(token: string): Promise<GitHubUser>

// Save validated token + user profile to github_credentials (upsert on id=1)
export function saveCredentials(token: string, user: GitHubUser): void

// Retrieve saved credentials. Returns null if not connected.
export function getCredentials(): { token: string; username: string; avatar_url: string; name: string | null } | null

// Delete credentials and repos (disconnect)
export function deleteCredentials(): void

// Fetch all repos from GitHub API (handles pagination, max 500 repos)
// GET https://api.github.com/user/repos?per_page=100&page=N&sort=updated
// Saves to github_repos table, replacing previous cache
// Returns saved repo count
export async function fetchAndSaveRepos(token: string): Promise<number>

// Get all cached repos from DB, ordered by updated_at DESC
export function getCachedRepos(): GitHubRepo[]
```

**Security requirements:**
- Token passed in `Authorization: token <PAT>` header to GitHub API
- Token stored as-is in DB (single-user local app — no multi-user concern)
- Token NEVER returned in any API response (only username/avatar_url/name)

### 4. Create `backend/src/routes/github.ts`

Implement these endpoints:

```
POST /api/github/connect
  Body: { token: string }
  - Validates token via GitHub API
  - Saves credentials to DB
  - Fetches and caches all repos
  - Response: { username, avatar_url, name, repo_count }
  - Error 401: { error: "Invalid GitHub token" }

GET /api/github/status
  - Returns current connection status
  - Response (connected):    { connected: true, username, avatar_url, name }
  - Response (disconnected): { connected: false }
  - NEVER includes token in response

GET /api/github/repos
  - Returns cached repos from DB
  - If not connected: 401 { error: "Not connected to GitHub" }
  - Response: { repos: GitHubRepo[], count: number }

POST /api/github/repos/refresh
  - Re-fetches repos from GitHub API and updates cache
  - Response: { repo_count: number, refreshed_at: string }

DELETE /api/github/disconnect
  - Removes credentials and cached repos
  - Response: { success: true }
```

### 5. Register Route in `backend/src/index.ts`

```typescript
import githubRouter from './routes/github';
app.use('/api/github', githubRouter);
```

### 6. Create `frontend/src/store/githubStore.ts`

```typescript
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers: number;
  fork: boolean;
}

interface GitHubState {
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  name: string | null;
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;
  // Actions
  checkStatus: () => Promise<void>;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  loadRepos: () => Promise<void>;
  refreshRepos: () => Promise<void>;
}
```

All API calls go to `http://localhost:3001/api/github/*`.

### 7. Create `frontend/src/components/git/GitHubConnect.tsx`

Shown when `connected === false`. Renders:

```
┌─────────────────────────────────┐
│  🔗 Connect GitHub              │
│                                 │
│  Enter your Personal Access     │
│  Token (PAT) to connect.        │
│                                 │
│  [••••••••••••••••••••••]  [Connect] │
│                                 │
│  Need a token? → github.com/    │
│  settings/tokens (link)         │
│                                 │
│  Required scopes: repo, user    │
└─────────────────────────────────┘
```

- Password input (masked by default, toggle to reveal)
- Connect button → calls `githubStore.connect(token)`
- Shows loading spinner during connection
- Shows error message inline if connection fails
- On success: component unmounts, GitPanel shows profile + repos

### 8. Create `frontend/src/components/git/RepoList.tsx`

Shown when `connected === true`. Renders:

```
┌─────────────────────────────────────┐
│  [avatar] username           [↪ Disconnect] │
│                                     │
│  [🔍 Filter repos...      ] [↻ Refresh] │
│                                     │
│  ● my-project          ★ 12   TypeScript │
│    Last updated: 2 days ago   [Clone] │
│                                     │
│  🔒 private-repo               Rust │
│    Last updated: 1 week ago   [Clone] │
│  ...                                │
│  42 repositories                    │
└─────────────────────────────────────┘
```

- Avatar + username header with Disconnect button
- Search/filter input (client-side, filters by repo name)
- Refresh button → calls `githubStore.refreshRepos()`
- Each repo row: name, language badge, star count, private lock icon, last updated (relative), Clone button (→ Task 7.2)
- Empty state: "No repositories found"
- Loading skeleton while fetching

### 9. Modify `frontend/src/components/git/GitPanel.tsx`

Add a **GitHub section** at the top of the Git tab (above the existing local git status section):

```typescript
// At top of GitPanel, load GitHub status on mount
useEffect(() => {
  githubStore.checkStatus();
}, []);

// Render GitHub section
{!githubStore.connected
  ? <GitHubConnect />
  : <RepoList />
}

// Then existing local git section below (unchanged)
<Divider />
{/* existing local git status, branches, commits... */}
```

---

## Expected Outputs

```
backend/
  src/
    db/
      database.ts                ← NEW
    routes/
      github.ts                  ← NEW
    services/
      githubService.ts           ← NEW
    index.ts                     ← MODIFIED (register /api/github)
  data/
    .gitkeep                     ← NEW (ensure data/ dir committed)

frontend/
  src/
    store/
      githubStore.ts             ← NEW
    components/
      git/
        GitHubConnect.tsx        ← NEW
        RepoList.tsx             ← NEW
        GitPanel.tsx             ← MODIFIED (add GitHub section)
```

---

## Test Criteria

| # | Scenario | Type | Expected |
|---|----------|------|----------|
| 1 | Connect with valid PAT | curl | POST /api/github/connect → 200 `{ username, avatar_url, repo_count }` |
| 2 | Connect with invalid token | curl | POST /api/github/connect → 401 `{ error: "Invalid GitHub token" }` |
| 3 | Token never in response | curl | GET /api/github/status → no `token` field in response body |
| 4 | Status endpoint (connected) | curl | GET /api/github/status → `{ connected: true, username }` |
| 5 | Load cached repos | curl | GET /api/github/repos → array of repos, count > 0 |
| 6 | Refresh repos | curl | POST /api/github/repos/refresh → `{ repo_count, refreshed_at }` |
| 7 | Disconnect | curl | DELETE /api/github/disconnect → `{ success: true }` |
| 8 | Status after disconnect | curl | GET /api/github/status → `{ connected: false }` |
| 9 | GitHubConnect UI renders | Playwright | Git tab shows token input + Connect button when not connected |
| 10 | RepoList renders after connect | Playwright | Connect flow → repos list visible with names + Clone buttons |
| 11 | Filter repos client-side | Playwright | Type in filter → repo list narrows to matching names |

---

## Critical Notes

### Token Security
- **NEVER** return the `token` field from any `/api/github/*` endpoint — only `username`, `avatar_url`, `name`
- Test #3 explicitly verifies this — it will fail if token appears

### Database File
- DB file saved to `backend/data/custle.db` (create `data/` directory)
- Add `backend/data/*.db` to `.gitignore`
- In-memory for tests (`NODE_ENV=test`)

### GitHub API Rate Limits
- GitHub API rate limit: 5000 req/hour for authenticated requests
- Pagination: fetch repos in pages of 100 (`per_page=100`)
- Stop after 5 pages (500 repos max) to avoid long waits

### Clone Button (Task 7.2)
- The Clone button in `RepoList.tsx` should render but can show "Coming in Task 7.2" toast for now
- Do NOT implement clone logic here — that is Task 7.2

### reactStrictMode: false
- Already set in `next.config.ts` — do not change

---

## Common Issues & Solutions

| Issue | Solution |
|-------|---------|
| `better-sqlite3` build fails | Run `npm rebuild better-sqlite3` after install |
| GitHub API returns 401 | Token needs `repo` and `user` scopes |
| CORS error from frontend | Ensure `/api/github` is covered by existing CORS config in `index.ts` |
| DB file permission error | Ensure `backend/data/` directory exists and is writable |
| Repos not loading after connect | Check that `fetchAndSaveRepos` is called inside `connect` endpoint, not just status |