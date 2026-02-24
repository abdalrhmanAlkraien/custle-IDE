# Custle IDE — Backend API Integration Guide

## Base Configuration

**Backend URL**: `http://localhost:3001`
**Frontend URL**: `http://localhost:3000`
**WebSocket URL**: `ws://localhost:3001`

All endpoints follow pattern: `http://localhost:3001/api/{module}/{action}`

---

## Important Notes

### Response Format

All successful responses return data directly — no wrapper object:

```typescript
// ✅ Responses return data directly
{ content: "file contents here", language: "typescript", size: 1024 }

// ✅ Success operations return
{ success: true }

// ✅ Collections return arrays directly
[{ id: "...", name: "...", type: "file" }]
```

### Error Responses

All errors return this format:
```json
{
  "error": "Path traversal not allowed"
}
```

HTTP status codes:
| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No content (delete) |
| `400` | Bad request / validation error |
| `403` | Forbidden (path traversal attempt) |
| `404` | Not found |
| `500` | Server error |

---

## Workspace API

### Get Current Workspace

**GET** `/api/workspace`

**Response** `200 OK`:
```typescript
{
  path: string;   // absolute path
  name: string;   // folder name
} | null          // null if no workspace open
```

---

### Open Workspace

**POST** `/api/workspace/open`

**Request Body**:
```typescript
{
  path: string;   // absolute path to folder
}
```

**Response** `200 OK`:
```typescript
{
  path: string;
  name: string;
  tree: FileNode[];   // full recursive file tree
}
```

**FileNode**:
```typescript
{
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;           // absolute path on disk
  relativePath: string;   // relative to workspace root
  extension?: string;
  size?: number;
  modified?: string;      // ISO-8601
  children?: FileNode[];  // only for folders
}
```

**Error Responses**:
- `400` — Path does not exist or is not a directory
- `500` — Permission denied

---

### Close Workspace

**POST** `/api/workspace/close`

**Response** `200 OK`:
```typescript
{ success: true }
```

Side effects: stops chokidar file watcher

---

### Get File Tree

**GET** `/api/workspace/tree`

**Response** `200 OK`: `FileNode[]`

Returns fresh tree of current workspace. Ignores:
`node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `coverage`

**Error Responses**:
- `400` — No workspace open

---

## File API

### Read File

**GET** `/api/files/read`

**Query Parameters**:
- `path: string` — absolute path to file

**Response** `200 OK`:
```typescript
{
  content: string;
  language: string;   // Monaco language id (e.g. "typescript", "python")
  size: number;       // bytes
  modified: string;   // ISO-8601
}
```

**Error Responses**:
- `403` — Path outside workspace root
- `404` — File not found
- `500` — Cannot read file (binary, permission denied)

---

### Write File

**POST** `/api/files/write`

**Request Body**:
```typescript
{
  path: string;     // absolute path
  content: string;  // full file content
}
```

**Response** `200 OK`:
```typescript
{ success: true }
```

Uses atomic write (write to `.tmp`, then rename) to prevent corruption.

**Error Responses**:
- `403` — Path outside workspace root
- `500` — Write failed

---

### Create File or Folder

**POST** `/api/files/create`

**Request Body**:
```typescript
{
  path: string;
  type: 'file' | 'folder';
}
```

**Response** `201 Created`:
```typescript
{ success: true }
```

Creates all parent directories automatically.

**Error Responses**:
- `400` — File already exists
- `403` — Path outside workspace root

---

### Delete File or Folder

**DELETE** `/api/files/delete`

**Request Body**:
```typescript
{
  path: string;
}
```

**Response** `200 OK`:
```typescript
{ success: true }
```

Recursively deletes folders.

**Error Responses**:
- `403` — Path outside workspace root
- `404` — File not found

---

### Rename / Move File

**POST** `/api/files/rename`

**Request Body**:
```typescript
{
  oldPath: string;
  newPath: string;
}
```

**Response** `200 OK`:
```typescript
{ success: true }
```

**Error Responses**:
- `400` — Destination already exists
- `403` — Either path outside workspace root
- `404` — Source not found

---

### Search Files

**GET** `/api/files/search`

**Query Parameters**:
- `q: string` — search query (plain text or regex)
- `root?: string` — optional subfolder to search within

**Response** `200 OK`:
```typescript
[
  {
    path: string;
    relativePath: string;
    matches: [
      {
        lineNumber: number;
        line: string;      // line content with match
      }
    ]
  }
]
```

Searches all text files, skips binary files and ignored folders.

---

## Git API

### Get Status

**GET** `/api/git/status`

**Response** `200 OK`:
```typescript
{
  branch: string;
  ahead: number;
  behind: number;
  files: [
    {
      path: string;
      status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
      staged: boolean;
    }
  ]
}
```

**Error Responses**:
- `400` — Not a git repository

---

### Get File Diff

**GET** `/api/git/diff`

**Query Parameters**:
- `path: string` — file path

**Response** `200 OK`:
```typescript
{
  diff: string;   // unified diff string
}
```

---

### Get Commit Log

**GET** `/api/git/log`

**Query Parameters**:
- `limit?: number` — default 50

**Response** `200 OK`:
```typescript
[
  {
    hash: string;
    message: string;
    author: string;
    date: string;   // ISO-8601
  }
]
```

---

### Get Branches

**GET** `/api/git/branches`

**Response** `200 OK`:
```typescript
{
  current: string;
  local: string[];
  remote: string[];
}
```

---

### Stage Files

**POST** `/api/git/stage`

**Request Body**:
```typescript
{
  paths: string[];   // relative paths
}
```

**Response** `200 OK`: `{ success: true }`

---

### Unstage Files

**POST** `/api/git/unstage`

**Request Body**:
```typescript
{
  paths: string[];
}
```

**Response** `200 OK`: `{ success: true }`

---

### Commit

**POST** `/api/git/commit`

**Request Body**:
```typescript
{
  message: string;
}
```

**Response** `200 OK`:
```typescript
{
  success: true;
  hash: string;   // commit hash
}
```

**Error Responses**:
- `400` — Nothing staged or empty message

---

### Push

**POST** `/api/git/push`

**Response** `200 OK`:
```typescript
{
  success: true;
  output: string;
}
```

**Error Responses**:
- `500` — Auth failed, no remote, network error

---

### Pull

**POST** `/api/git/pull`

**Response** `200 OK`:
```typescript
{
  success: true;
  output: string;
  conflicts: string[];   // empty if no conflicts
}
```

---

### Checkout Branch

**POST** `/api/git/checkout`

**Request Body**:
```typescript
{
  branch: string;
}
```

**Response** `200 OK`: `{ success: true }`

**Error Responses**:
- `400` — Uncommitted changes blocking checkout

---

### Create Branch

**POST** `/api/git/branch/create`

**Request Body**:
```typescript
{
  name: string;
}
```

**Response** `200 OK`: `{ success: true }`

---

### Stash

**POST** `/api/git/stash`

**Response** `200 OK`: `{ success: true }`

---

### Stash Pop

**POST** `/api/git/stash/pop`

**Response** `200 OK`: `{ success: true }`

---

### Clone Repository

**POST** `/api/git/clone`

**Request Body**:
```typescript
{
  url: string;    // git remote URL
  path: string;   // destination path (absolute)
}
```

**Response** `200 OK`:
```typescript
{
  success: true;
  path: string;   // cloned repo path
}
```

**Error Responses**:
- `400` — Invalid URL or path already exists
- `500` — Auth failed or network error

---

## Model API

### Get Active Config

**GET** `/api/model/config`

**Response** `200 OK`:
```typescript
{
  url: string;
  name: string;
  provider: 'openai-compatible' | 'anthropic' | 'openai';
  maxTokens: number;
  temperature: number;
  // NOTE: apiKey is NEVER returned
}
```

---

### Save & Activate Config

**POST** `/api/model/config`

**Request Body**:
```typescript
{
  url: string;
  name: string;
  apiKey: string;
  provider: 'openai-compatible' | 'anthropic' | 'openai';
  maxTokens: number;
  temperature: number;
}
```

**Response** `200 OK`:
```typescript
{
  success: true;
  // apiKey NOT echoed back
}
```

---

### Test Connection

**POST** `/api/model/test`

**Request Body**: Same as save config

**Response** `200 OK`:
```typescript
{
  ok: true;
  latency: number;      // ms
  modelList: string[];  // available model names
}
```

**Error Response** `200 OK` (connection failed — not a 500):
```typescript
{
  ok: false;
  error: string;   // e.g. "ECONNREFUSED", "HTTP 401"
}
```

---

### List Saved Configs

**GET** `/api/model/list`

**Response** `200 OK`:
```typescript
[
  {
    url: string;
    name: string;
    provider: string;
    maxTokens: number;
    temperature: number;
    // apiKey NOT included
  }
]
```

---

### Chat (AI Proxy)

**POST** `/api/model/chat`

**Request Body**:
```typescript
{
  messages: [
    { role: 'system' | 'user' | 'assistant', content: string }
  ];
  stream: boolean;
  maxTokens?: number;
  temperature?: number;
}
```

**Response (stream: false)** `200 OK`:
```typescript
{
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

**Response (stream: true)** — SSE stream:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

Backend adds the API key before forwarding to vLLM/OpenAI/Anthropic.
The API key never touches the frontend.

---

## Agent API

### Run Agent

**POST** `/api/agent/run`

**Request Body**:
```typescript
{
  messages: [
    { role: 'user' | 'assistant', content: string }
  ];
  workspacePath: string;
}
```

**Response** — SSE stream of agent steps:

```
data: {"type":"tool_call","tool":"read_file","args":{"path":"/workspace/src/app.ts"}}
data: {"type":"tool_result","tool":"read_file","result":"const express...","success":true}
data: {"type":"thinking","content":"I'll now modify the file to add the route..."}
data: {"type":"tool_call","tool":"write_file","args":{"path":"...","content":"..."}}
data: {"type":"tool_result","tool":"write_file","result":"","success":true}
data: {"type":"text","content":"Done! I added the `/health` route to your Express server."}
data: [DONE]
```

**SSE Event Types**:
```typescript
// Tool being called
{ type: 'tool_call', tool: string, args: Record<string, string> }

// Tool result
{ type: 'tool_result', tool: string, result: string, success: boolean }

// Model thinking out loud (optional)
{ type: 'thinking', content: string }

// Final text response
{ type: 'text', content: string }

// Error
{ type: 'error', content: string }
```

**Available Agent Tools**:
| Tool | Description | Args |
|------|-------------|------|
| `read_file` | Read file contents | `path` |
| `write_file` | Write content to file | `path`, `content` |
| `list_files` | List directory contents | `path` |
| `run_terminal` | Run shell command | `command`, `cwd` |
| `search_files` | Search text in files | `query` |
| `create_file` | Create file or folder | `path`, `type` |
| `delete_file` | Delete file or folder | `path` |

**Security**: Agent cannot access paths outside workspace root. Returns error result for any path traversal attempt.

**Max Iterations**: 20 — after which agent stops and reports incomplete.

---

## Completion API

### Get Inline Completion

**POST** `/api/completion`

**Request Body**:
```typescript
{
  prefix: string;     // code before cursor (up to 50 lines)
  suffix: string;     // code after cursor (up to 10 lines)
  language: string;   // Monaco language id
  filePath: string;   // for context
}
```

**Response** `200 OK`:
```typescript
{
  completion: string;   // text to insert at cursor
}
```

Returns empty string if model has no suggestion.

Backend uses: `max_tokens: 150`, `temperature: 0.1`, stop sequences `["\n\n", "```"]`

---

## WebSocket Protocol

Connect to: `ws://localhost:3001`

### Client → Server Messages

```typescript
// Create terminal session
{ type: 'terminal:create', sessionId: string, cwd: string }

// Send input to terminal
{ type: 'terminal:input', sessionId: string, data: string }

// Resize terminal
{ type: 'terminal:resize', sessionId: string, cols: number, rows: number }

// Kill terminal session
{ type: 'terminal:kill', sessionId: string }

// Keep-alive
{ type: 'ping' }
```

### Server → Client Messages

```typescript
// Terminal output
{ type: 'terminal:output', sessionId: string, data: string }

// Single file changed on disk
{ type: 'file:change', event: 'add' | 'change' | 'unlink', path: string }

// Folder structure changed — re-fetch tree
{ type: 'tree:refresh' }

// Keep-alive response
{ type: 'pong' }
```

### WebSocket Usage Pattern

```typescript
// In useTerminal.ts
const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL!
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

const ws = new WebSocket(wsUrl);

// Create session on connect
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'terminal:create',
    sessionId: uuid(),
    cwd: workspacePath,
  }));
};

// Route messages
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'terminal:output': terminal.write(msg.data); break;
    case 'tree:refresh':    refetchTree(); break;
    case 'file:change':     handleFileChange(msg); break;
    case 'pong':            break;
  }
};

// Auto-reconnect
ws.onclose = () => {
  setTimeout(connect, Math.min(1000 * 2 ** retries++, 30000));
};
```

---

## Frontend API Layer Pattern

Each domain has its own file in `frontend/src/lib/api/`:

```typescript
// filesApi.ts
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL; // http://localhost:3001

export const filesApi = {
  openWorkspace: (path: string) =>
    axios.post(`${BASE}/api/workspace/open`, { path }).then(r => r.data),

  getTree: () =>
    axios.get(`${BASE}/api/workspace/tree`).then(r => r.data),

  readFile: (path: string) =>
    axios.get(`${BASE}/api/files/read`, { params: { path } }).then(r => r.data),

  writeFile: (path: string, content: string) =>
    axios.post(`${BASE}/api/files/write`, { path, content }).then(r => r.data),

  createFile: (path: string) =>
    axios.post(`${BASE}/api/files/create`, { path, type: 'file' }).then(r => r.data),

  createFolder: (path: string) =>
    axios.post(`${BASE}/api/files/create`, { path, type: 'folder' }).then(r => r.data),

  deleteFile: (path: string) =>
    axios.delete(`${BASE}/api/files/delete`, { data: { path } }).then(r => r.data),

  renameFile: (oldPath: string, newPath: string) =>
    axios.post(`${BASE}/api/files/rename`, { oldPath, newPath }).then(r => r.data),

  searchFiles: (q: string) =>
    axios.get(`${BASE}/api/files/search`, { params: { q } }).then(r => r.data),
};
```

```typescript
// gitApi.ts
export const gitApi = {
  getStatus: () =>
    axios.get(`${BASE}/api/git/status`).then(r => r.data),

  getDiff: (path: string) =>
    axios.get(`${BASE}/api/git/diff`, { params: { path } }).then(r => r.data),

  getLog: (limit = 50) =>
    axios.get(`${BASE}/api/git/log`, { params: { limit } }).then(r => r.data),

  getBranches: () =>
    axios.get(`${BASE}/api/git/branches`).then(r => r.data),

  stage: (paths: string[]) =>
    axios.post(`${BASE}/api/git/stage`, { paths }).then(r => r.data),

  unstage: (paths: string[]) =>
    axios.post(`${BASE}/api/git/unstage`, { paths }).then(r => r.data),

  commit: (message: string) =>
    axios.post(`${BASE}/api/git/commit`, { message }).then(r => r.data),

  push: () =>
    axios.post(`${BASE}/api/git/push`).then(r => r.data),

  pull: () =>
    axios.post(`${BASE}/api/git/pull`).then(r => r.data),

  checkout: (branch: string) =>
    axios.post(`${BASE}/api/git/checkout`, { branch }).then(r => r.data),

  createBranch: (name: string) =>
    axios.post(`${BASE}/api/git/branch/create`, { name }).then(r => r.data),

  clone: (url: string, path: string) =>
    axios.post(`${BASE}/api/git/clone`, { url, path }).then(r => r.data),
};
```

```typescript
// modelApi.ts
export const modelApi = {
  getConfig: () =>
    axios.get(`${BASE}/api/model/config`).then(r => r.data),

  saveConfig: (config: ModelConfig) =>
    axios.post(`${BASE}/api/model/config`, config).then(r => r.data),

  testConnection: (config: ModelConfig) =>
    axios.post(`${BASE}/api/model/test`, config).then(r => r.data),

  listConfigs: () =>
    axios.get(`${BASE}/api/model/list`).then(r => r.data),
};
```

```typescript
// chatApi.ts — streaming uses fetch, not axios
export async function* streamChat(
  messages: Message[],
  signal: AbortSignal
): AsyncGenerator<string> {
  const response = await fetch(`${BASE}/api/model/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chat failed: HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content ?? '';
          if (content) yield content;
        } catch { /* skip malformed lines */ }
      }
    }
  }
}

export async function* streamAgent(
  messages: Message[],
  workspacePath: string,
  signal: AbortSignal
): AsyncGenerator<AgentEvent> {
  const response = await fetch(`${BASE}/api/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, workspacePath }),
    signal,
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          yield JSON.parse(line.slice(6)) as AgentEvent;
        } catch { /* skip */ }
      }
    }
  }
}
```

---

## Error Handling Pattern

```typescript
// In hooks and components
try {
  await filesApi.writeFile(path, content);
  toast.success('Saved');
} catch (error) {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error ?? error.message;
    toast.error(msg);
  } else {
    toast.error('Unexpected error');
  }
}
```

---

## Example Workflows

### 1. Open Workspace and Load First File

```typescript
// Open workspace
const { path, name, tree } = await filesApi.openWorkspace('/Users/dev/myproject');
ideStore.setWorkspace(path, name);

// User clicks first file in tree
const file = await filesApi.readFile(tree[0].children[0].path);
ideStore.openTab({
  path: tree[0].children[0].path,
  relativePath: tree[0].children[0].relativePath,
  name: tree[0].children[0].name,
  content: file.content,
  language: file.language,
});
```

### 2. Edit and Save File

```typescript
// User types in Monaco — update store
ideStore.updateTabContent(tabId, newContent);

// User presses Ctrl+S
await filesApi.writeFile(activeTab.path, activeTab.content);
ideStore.markTabClean(tabId);
toast.success('Saved');
```

### 3. Chat with File Context

```typescript
const systemPrompt = `You are Custle IDE's AI assistant.
Active file: ${activeTab.relativePath}
Content:
\`\`\`${activeTab.language}
${activeTab.content.slice(0, 3000)}
\`\`\``;

const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage },
];

const controller = new AbortController();
let assistantMsg = '';

for await (const chunk of streamChat(messages, controller.signal)) {
    assistantMsg += chunk;
    ideStore.updateLastMessage(assistantMsg);
}
```

### 4. Agent Completes a Task

```typescript
const controller = new AbortController();

for await (const event of streamAgent(messages, workspacePath, controller.signal)) {
    switch (event.type) {
        case 'tool_call':
            addStepCard({ tool: event.tool, args: event.args, status: 'running' });
            break;
        case 'tool_result':
            updateStepCard({ tool: event.tool, result: event.result, status: event.success ? 'done' : 'error' });
            break;
        case 'text':
            appendChatMessage({ role: 'assistant', content: event.content });
            break;
        case 'error':
            toast.error(event.content);
            break;
    }
}
```

### 5. Clone and Open GitHub Repo

```typescript
// Clone to local path
const { path } = await gitApi.clone(
    'https://github.com/user/repo',
    '/Users/dev/projects/repo'
);

// Open as workspace
const { tree } = await filesApi.openWorkspace(path);
ideStore.setWorkspace(path, 'repo');
```

### 6. Stage, Commit, Push

```typescript
// Stage specific files
await gitApi.stage(['src/app.ts', 'src/utils.ts']);

// Commit
await gitApi.commit('Add health check endpoint');

// Push
const { output } = await gitApi.push();
toast.success(`Pushed: ${output}`);

// Refresh git status
gitStore.refresh();
```