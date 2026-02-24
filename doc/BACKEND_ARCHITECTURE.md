# Custle IDE — Backend Architecture

## Project Overview

**Type**: Local Express server — runs on the developer's machine
**Port**: 3001
**Purpose**: Gives the browser access to the real file system, terminal, git, and AI model proxy
**Language**: TypeScript (strict mode)
**Runtime**: Node.js

The backend is the critical security and capability layer. Without it, the browser cannot access local files, run real terminal commands, or keep API keys private.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Express HTTP Server                   │
│  (index.ts — bootstrap, CORS, routes, WS attach)        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      Route Layer                        │
│  /api/workspace  /api/files  /api/git                   │
│  /api/model      /api/agent  /api/completion            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
│  fileService  gitService  terminalService               │
│  modelService  agentService  watcherService             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  System / External                      │
│  fs (file system)  node-pty (shell)  simple-git (git)   │
│  chokidar (watcher)  vLLM / OpenAI / Anthropic          │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
backend/src/
├── index.ts                  ← Server bootstrap
├── config.ts                 ← Port, CORS, model defaults
├── types.ts                  ← Shared TypeScript interfaces
├── routes/
│   ├── workspace.ts          ← Open/close/tree workspace
│   ├── files.ts              ← File CRUD + search
│   ├── git.ts                ← Git operations
│   ├── model.ts              ← Model config + AI proxy
│   ├── agent.ts              ← Agent SSE endpoint
│   └── completion.ts         ← Inline completion endpoint
├── services/
│   ├── fileService.ts        ← fs/promises wrapper
│   ├── watcherService.ts     ← chokidar file watcher
│   ├── gitService.ts         ← simple-git wrapper
│   ├── terminalService.ts    ← node-pty session manager
│   ├── modelService.ts       ← Model config storage
│   └── agentService.ts       ← Agent tool loop
└── websocket/
    └── wsServer.ts           ← WebSocket message router
```

---

## Server Bootstrap (index.ts)

```typescript
import express from 'express';
import cors from 'cors';
import http from 'http';
import { config } from './config';
import { attachWebSocket } from './websocket/wsServer';
import workspaceRouter from './routes/workspace';
import filesRouter from './routes/files';
import gitRouter from './routes/git';
import modelRouter from './routes/model';
import agentRouter from './routes/agent';
import completionRouter from './routes/completion';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/workspace', workspaceRouter);
app.use('/api/files', filesRouter);
app.use('/api/git', gitRouter);
app.use('/api/model', modelRouter);
app.use('/api/agent', agentRouter);
app.use('/api/completion', completionRouter);

// WebSocket (same HTTP server — no separate WS port)
attachWebSocket(server);

server.listen(config.PORT, () => {
    console.log(`Custle IDE backend running on port ${config.PORT}`);
});
```

---

## Config (config.ts)

```typescript
export const config = {
    PORT: process.env.PORT ?? 3001,
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    DEFAULT_MODEL_URL: process.env.MODEL_URL ?? 'http://localhost:18000',
    DEFAULT_MODEL_NAME: process.env.MODEL_NAME ?? 'Qwen3-Coder-30B-A3B',
    DEFAULT_MODEL_KEY: process.env.MODEL_API_KEY ?? '',
};
```

---

## Shared Types (types.ts)

```typescript
export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    path: string;           // absolute path on disk
    relativePath: string;   // relative to workspace root
    extension?: string;
    size?: number;
    modified?: string;
    children?: FileNode[];
    isOpen?: boolean;
}

export interface WorkspaceConfig {
    rootPath: string;
    name: string;
}

export interface ModelConfig {
    url: string;
    name: string;
    apiKey: string;
    provider: 'openai-compatible' | 'anthropic' | 'openai';
    maxTokens: number;
    temperature: number;
}

export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    files: GitFileStatus[];
}

export interface GitFileStatus {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
    staged: boolean;
}

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}
```

---

## Route Layer

### Workspace Routes (/api/workspace)

```
GET  /api/workspace          → { path, name } | null
POST /api/workspace/open     → body: { path } → sets workspace, returns FileNode tree
POST /api/workspace/close    → clears workspace + stops watcher
GET  /api/workspace/tree     → returns full FileNode tree
```

### File Routes (/api/files)

```
GET    /api/files/read        → ?path= → { content, language, size, modified }
POST   /api/files/write       → { path, content } → { success }
POST   /api/files/create      → { path, type: 'file'|'folder' } → { success }
DELETE /api/files/delete      → { path } → { success }
POST   /api/files/rename      → { oldPath, newPath } → { success }
GET    /api/files/search      → ?q=&root= → [{ path, matches: [{line, content, lineNumber}] }]
```

### Git Routes (/api/git)

```
GET  /api/git/status          → GitStatus
GET  /api/git/diff            → ?path= → unified diff string
GET  /api/git/log             → ?limit=50 → GitCommit[]
GET  /api/git/branches        → { current, local[], remote[] }
POST /api/git/stage           → { paths: string[] }
POST /api/git/unstage         → { paths: string[] }
POST /api/git/commit          → { message: string }
POST /api/git/push            → { success, output }
POST /api/git/pull            → { success, output, conflicts }
POST /api/git/checkout        → { branch: string }
POST /api/git/branch/create   → { name: string }
POST /api/git/stash           → { success }
POST /api/git/stash/pop       → { success }
POST /api/git/clone           → { url, path } → { success }
```

### Model Routes (/api/model)

```
GET  /api/model/config        → current config (NO apiKey in response)
POST /api/model/config        → body: ModelConfig → saves + activates
POST /api/model/test          → body: ModelConfig → { ok, latency, modelList }
GET  /api/model/list          → saved configs (NO apiKeys in response)
POST /api/model/chat          → { messages, stream } → proxies to AI (SSE if stream:true)
```

### Agent Routes (/api/agent)

```
POST /api/agent/run           → { messages, workspacePath } → SSE stream of agent steps
```

SSE event types:
```
data: {"type":"tool_call","tool":"read_file","args":{"path":"..."}}
data: {"type":"tool_result","tool":"read_file","result":"...content...","success":true}
data: {"type":"thinking","content":"I'll now write the component..."}
data: {"type":"text","content":"Done! I created src/Button.tsx with..."}
data: [DONE]
```

### Completion Routes (/api/completion)

```
POST /api/completion          → { prefix, suffix, language, filePath } → { completion }
```

---

## Service Layer

### fileService.ts

```typescript
import fs from 'fs/promises';
import path from 'path';

// Core operations
readFile(filePath: string): Promise<{ content, language, size, modified }>
writeFile(filePath: string, content: string): Promise<void>   // atomic write
createFile(filePath: string): Promise<void>                   // creates parent dirs
createFolder(folderPath: string): Promise<void>
deleteFile(filePath: string): Promise<void>                   // recursive for folders
renameFile(oldPath: string, newPath: string): Promise<void>
buildTree(rootPath: string): Promise<FileNode[]>              // respects ignore list
searchFiles(query: string, rootPath: string): Promise<SearchResult[]>
```

**Ignored paths in tree/search**:
```typescript
const IGNORE = [
    'node_modules', '.git', 'dist', 'build', '.next',
    '__pycache__', 'coverage', '.DS_Store', '*.pyc'
];
```

**Atomic write pattern** (prevents corruption):
```typescript
async function writeFile(filePath: string, content: string) {
    const tmpPath = filePath + '.tmp.' + Date.now();
    await fs.writeFile(tmpPath, content, 'utf8');
    await fs.rename(tmpPath, filePath); // atomic on same filesystem
}
```

---

### watcherService.ts

```typescript
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

let watcher: chokidar.FSWatcher | null = null;

export function startWatcher(rootPath: string, wss: WebSocketServer) {
    watcher = chokidar.watch(rootPath, {
        ignored: /(node_modules|\.git|dist|build|\.next)/,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100 },
    });

    watcher.on('add', (path) => broadcast(wss, { type: 'file:change', event: 'add', path }));
    watcher.on('change', (path) => broadcast(wss, { type: 'file:change', event: 'change', path }));
    watcher.on('unlink', (path) => broadcast(wss, { type: 'file:change', event: 'unlink', path }));
    watcher.on('addDir', () => broadcast(wss, { type: 'tree:refresh' }));
    watcher.on('unlinkDir', () => broadcast(wss, { type: 'tree:refresh' }));
}

export function stopWatcher() {
    watcher?.close();
    watcher = null;
}

function broadcast(wss: WebSocketServer, msg: object) {
    const data = JSON.stringify(msg);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
    });
}
```

---

### terminalService.ts

```typescript
import * as pty from 'node-pty';

interface TerminalSession {
    id: string;
    pty: pty.IPty;
    cwd: string;
}

const sessions = new Map<string, TerminalSession>();

export function createSession(sessionId: string, cwd: string, cols = 80, rows = 24) {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols, rows, cwd,
        env: { ...process.env, TERM: 'xterm-256color' },
    });

    sessions.set(sessionId, { id: sessionId, pty: ptyProcess, cwd });
    return ptyProcess;
}

export function writeToSession(sessionId: string, data: string) {
    sessions.get(sessionId)?.pty.write(data);
}

export function resizeSession(sessionId: string, cols: number, rows: number) {
    sessions.get(sessionId)?.pty.resize(cols, rows);
}

export function killSession(sessionId: string) {
    const session = sessions.get(sessionId);
    if (session) {
        session.pty.kill();
        sessions.delete(sessionId);
    }
}

// Cleanup all on process exit
process.on('exit', () => {
    sessions.forEach((s) => s.pty.kill());
});
```

---

### gitService.ts

```typescript
import simpleGit, { SimpleGit } from 'simple-git';

let git: SimpleGit;

export function initGit(workspacePath: string) {
    git = simpleGit(workspacePath);
}

export async function getStatus(): Promise<GitStatus> {
    const s = await git.status();
    return {
        branch: s.current ?? 'HEAD',
        ahead: s.ahead,
        behind: s.behind,
        files: [
            ...s.modified.map(p => ({ path: p, status: 'modified', staged: false })),
            ...s.staged.map(p => ({ path: p, status: 'modified', staged: true })),
            ...s.created.map(p => ({ path: p, status: 'added', staged: false })),
            ...s.deleted.map(p => ({ path: p, status: 'deleted', staged: false })),
            ...s.not_added.map(p => ({ path: p, status: 'untracked', staged: false })),
        ] as GitFileStatus[],
    };
}

// All other git operations delegated to simple-git directly
```

---

### modelService.ts

```typescript
// Stores model configs in memory + optionally .env.local
// API keys are NEVER returned to frontend in any response

interface StoredConfig {
    url: string;
    name: string;
    apiKey: string;   // kept server-side only
    provider: string;
    maxTokens: number;
    temperature: number;
}

let activeConfig: StoredConfig = { /* defaults from config.ts */ };
const savedConfigs: StoredConfig[] = [];

export function getActiveConfig() {
    // Return config WITHOUT apiKey
    const { apiKey, ...safe } = activeConfig;
    return safe;
}

export function setActiveConfig(config: StoredConfig) {
    activeConfig = config;
    if (!savedConfigs.find(c => c.url === config.url && c.name === config.name)) {
        savedConfigs.push(config);
    }
}

export async function testConnection(config: StoredConfig) {
    const start = Date.now();
    const response = await fetch(`${config.url}/v1/models`, {
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
        ok: true,
        latency: Date.now() - start,
        modelList: data.data?.map((m: any) => m.id) ?? [],
    };
}
```

---

### agentService.ts

```typescript
// Agent tool definitions
const AGENT_TOOLS = [
    { name: 'read_file',    description: 'Read file contents',             parameters: { path: 'string' } },
    { name: 'write_file',   description: 'Write content to file',          parameters: { path: 'string', content: 'string' } },
    { name: 'list_files',   description: 'List files in a directory',      parameters: { path: 'string' } },
    { name: 'run_terminal', description: 'Run a shell command',            parameters: { command: 'string', cwd: 'string' } },
    { name: 'search_files', description: 'Search text across all files',   parameters: { query: 'string' } },
    { name: 'create_file',  description: 'Create a new file or folder',    parameters: { path: 'string', type: 'string' } },
    { name: 'delete_file',  description: 'Delete a file or folder',        parameters: { path: 'string' } },
];

// Agent loop — streams SSE events
export async function* runAgent(
    messages: Message[],
    workspacePath: string
): AsyncGenerator<AgentEvent> {
    const MAX_ITERATIONS = 20;
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
        iterations++;

        const response = await callModel(messages, AGENT_TOOLS);

        if (!response.tool_calls?.length) {
            // Natural end — model returned text without tool calls
            yield { type: 'text', content: response.content };
            break;
        }

        for (const toolCall of response.tool_calls) {
            yield { type: 'tool_call', tool: toolCall.name, args: toolCall.arguments };

            const result = await executeTool(toolCall, workspacePath);

            yield { type: 'tool_result', tool: toolCall.name, result, success: !result.error };

            // Append tool result to messages for next iteration
            messages = [
                ...messages,
                { role: 'assistant', tool_calls: [toolCall] },
                { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) },
            ];
        }
    }

    if (iterations >= MAX_ITERATIONS) {
        yield { type: 'text', content: 'Maximum iterations reached. Task may be incomplete.' };
    }
}

// Tool executor — validates paths before any file operation
async function executeTool(toolCall: ToolCall, workspacePath: string) {
    const { name, arguments: args } = toolCall;

    // Security: validate all file paths against workspace root
    if (args.path) {
        const resolved = path.resolve(workspacePath, args.path);
        if (!resolved.startsWith(path.resolve(workspacePath))) {
            return { error: 'Access denied: path outside workspace' };
        }
    }

    switch (name) {
        case 'read_file':    return fileService.readFile(args.path);
        case 'write_file':   return fileService.writeFile(args.path, args.content);
        case 'list_files':   return fileService.buildTree(args.path);
        case 'run_terminal': return runCommand(args.command, args.cwd ?? workspacePath);
        case 'search_files': return fileService.searchFiles(args.query, workspacePath);
        case 'create_file':  return fileService.createFile(args.path);
        case 'delete_file':  return fileService.deleteFile(args.path);
        default:             return { error: `Unknown tool: ${name}` };
    }
}
```

---

## WebSocket Server (wsServer.ts)

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import * as terminalService from '../services/terminalService';

export function attachWebSocket(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        ws.on('message', (raw) => {
            const msg = JSON.parse(raw.toString());
            handleMessage(ws, msg, wss);
        });

        ws.on('close', () => {
            // Clean up any terminal sessions for this WS connection
            // (tracked separately in terminalService)
        });
    });

    return wss;
}

function handleMessage(ws: WebSocket, msg: any, wss: WebSocketServer) {
    switch (msg.type) {
        case 'terminal:create':
            const ptyProcess = terminalService.createSession(msg.sessionId, msg.cwd);
            ptyProcess.onData((data) => {
                ws.send(JSON.stringify({ type: 'terminal:output', sessionId: msg.sessionId, data }));
            });
            break;

        case 'terminal:input':
            terminalService.writeToSession(msg.sessionId, msg.data);
            break;

        case 'terminal:resize':
            terminalService.resizeSession(msg.sessionId, msg.cols, msg.rows);
            break;

        case 'terminal:kill':
            terminalService.killSession(msg.sessionId);
            break;

        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
    }
}
```

---

## Security Rules

### Path Traversal Prevention (CRITICAL)

Every route that accepts a file path MUST validate it:

```typescript
import path from 'path';

function validatePath(requestedPath: string, workspaceRoot: string): string {
    const resolved = path.resolve(workspaceRoot, requestedPath);
    const root = path.resolve(workspaceRoot);

    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
        throw new Error('Path traversal not allowed');
    }

    return resolved;
}

// In route handler:
router.get('/read', async (req, res) => {
    try {
        const safePath = validatePath(req.query.path as string, getWorkspaceRoot());
        const result = await fileService.readFile(safePath);
        res.json(result);
    } catch (error) {
        if (error.message === 'Path traversal not allowed') {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.status(500).json({ error: error.message });
    }
});
```

### API Key Protection

```typescript
// ✅ CORRECT — apiKey used server-side, never returned
router.get('/config', (req, res) => {
    const { apiKey, ...safeConfig } = modelService.getActiveConfig();
    res.json(safeConfig); // apiKey stripped
});

// ✅ CORRECT — proxy adds key, browser never sees it
router.post('/chat', async (req, res) => {
    const config = modelService.getActiveConfigWithKey(); // internal use only
    const response = await fetch(`${config.url}/v1/chat/completions`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(req.body),
    });
    // pipe response to client
});
```

---

## Error Response Format

All routes return consistent error format:

```typescript
// Success
res.json({ data: result });           // 200
res.json({ success: true });          // 200

// Client error
res.status(400).json({ error: 'Message' });   // Bad request
res.status(403).json({ error: 'Message' });   // Forbidden (path traversal)
res.status(404).json({ error: 'Message' });   // Not found

// Server error
res.status(500).json({ error: error.message }); // Internal error
```

---

## node-pty Installation Notes

node-pty requires native compilation. If `npm install` fails:

```bash
# Option 1: Rebuild
cd backend && npm rebuild node-pty

# Option 2: Build from source
npm install --build-from-source node-pty

# Prerequisites on macOS
xcode-select --install

# Prerequisites on Ubuntu/Debian
sudo apt-get install -y make python3 g++ build-essential
```

---

## Development Workflow

```bash
# Start backend in dev mode (auto-restart on file changes)
cd backend && npm run dev

# Build TypeScript (verify no errors)
cd backend && npm run build

# Run built version
cd backend && npm start
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## Key Architecture Principles

### ✅ Always Do This

1. Validate ALL file paths against workspace root before any fs operation
2. Strip API keys from all responses to frontend
3. Kill PTY sessions on WebSocket close and process exit
4. Use atomic writes for file save (write to .tmp, then rename)
5. Stop chokidar watcher when workspace is closed
6. Cap agent iterations at 20
7. Return consistent error format `{ error: string }` for all failures
8. TypeScript strict mode — `tsc --noEmit` must pass with 0 errors

### ❌ Never Do This

1. Return `apiKey` in any response
2. Allow path traversal — always return 403
3. Leave PTY sessions running after connection drops
4. Let agent access paths outside workspace root
5. Call AI model directly from route — use modelService
6. Leave chokidar watcher running after workspace closes
7. Use `any` type
8. Catch errors silently — always log and return error response