# Custle IDE — Coding Standards

## TypeScript Rules

### No `any` Type — NEVER
```typescript
// ❌ Bad
const data: any = await filesApi.readFile(path);
const msg: any = JSON.parse(event.data);

// ✅ Good
const data: FileReadResult = await filesApi.readFile(path);
const msg: WebSocketMessage = JSON.parse(event.data);
```

**Rule**: Every variable, parameter, and return type must be explicitly typed. No exceptions. Both `backend/` and `frontend/` run TypeScript strict mode.

---

### Explicit Return Types
```typescript
// ❌ Bad
function buildTree(rootPath) {
  return fs.readdir(rootPath);
}

// ✅ Good
async function buildTree(rootPath: string): Promise<FileNode[]> {
  return fs.readdir(rootPath);
}

// ✅ Good - React components
function FileTreeItem({ node, depth }: FileTreeItemProps): JSX.Element {
  return <div>{node.name}</div>;
}
```

---

### Type Imports
```typescript
// ✅ Good — use 'type' keyword for type-only imports
import { type FileNode, type ModelConfig } from '@/types';
import { filesApi } from '@/lib/api/filesApi';

// ❌ Bad — mixing type and value imports without 'type' keyword
import { FileNode, filesApi } from '@/lib/api/filesApi';
```

---

### Union Types — Not Enums
```typescript
// ✅ Good — union types
type FileChangeEvent = 'add' | 'change' | 'unlink';
type ChatMode = 'chat' | 'agent';
type SidebarPanel = 'files' | 'search' | 'git' | 'extensions';
type BottomTab = 'terminal' | 'problems' | 'output';

// ❌ Bad — TypeScript enums
enum ChatMode {
  Chat = 'chat',
  Agent = 'agent',
}
```

---

## Frontend Component Rules

### All IDE Components Must Be Client Components
```typescript
// ✅ Required on every component inside the IDE shell
'use client';

import { useIDEStore } from '@/store/ideStore';

export function FileTree(): JSX.Element {
  const { workspacePath } = useIDEStore();
  // ...
}
```

The only server component is `app/page.tsx`. Everything inside `<IDEShell />` is client-side.

---

### Component Structure Order
```typescript
'use client';

// 1. React imports
import { useState, useEffect, useCallback } from 'react';

// 2. External library imports
import dynamic from 'next/dynamic';

// 3. Store imports
import { useIDEStore } from '@/store/ideStore';
import { useModelStore } from '@/store/modelStore';

// 4. Hook imports
import { useFileTree } from '@/hooks/useFileTree';

// 5. API imports
import { filesApi } from '@/lib/api/filesApi';

// 6. Type imports
import { type FileNode } from '@/types';

// 7. Component-specific types
interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
}

// 8. Component
export function FileTreeItem({ node, depth, onSelect }: FileTreeItemProps): JSX.Element {
  // 8a. Store hooks
  const { activeTabId } = useIDEStore();

  // 8b. Local state
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // 8c. Custom hooks
  const { createFile, deleteFile } = useFileTree();

  // 8d. Derived / computed values
  const isActive = node.path === activeTabId;
  const isFolder = node.type === 'folder';
  const indent = depth * 12;

  // 8e. Event handlers
  const handleClick = useCallback(() => {
    if (isFolder) setIsOpen(o => !o);
    else onSelect(node);
  }, [isFolder, node, onSelect]);

  // 8f. Effects (use sparingly)
  useEffect(() => {
    // Only when truly needed
  }, []);

  // 8g. Early returns
  if (!node) return <></>;

  // 8h. Render
  return (
    <div style={{ paddingLeft: indent }}>
      {node.name}
    </div>
  );
}
```

---

### Dynamic Imports — Monaco and xterm Are Mandatory

```typescript
// ✅ CORRECT — must be dynamic
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <EditorPlaceholder /> }
);

const XTerminal = dynamic(
  () => import('@/components/terminal/XTerminal'),
  { ssr: false }
);

// ❌ CRASH — module-level import breaks SSR
import MonacoEditor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
```

Also use dynamic for large modals:
```typescript
const CommandPalette = dynamic(() => import('@/components/modals/CommandPalette'), { ssr: false });
const SettingsModal = dynamic(() => import('@/components/modals/SettingsModal'), { ssr: false });
```

---

## State Management Rules

### Decision Tree

```
Is it IDE layout / tab / chat state?
└─ YES → ideStore (Zustand, not persisted)

Is it AI model config?
└─ YES → modelStore (Zustand, persisted to localStorage)

Is it git status?
└─ YES → gitStore (Zustand, not persisted)

Is it temp UI state for one component?
└─ YES → useState

Is it file tree / search results?
└─ YES → fetch in hook, store in component state
```

---

### ideStore — All IDE Session State
```typescript
// ✅ Correct — read layout from ideStore
const { isSidebarOpen, tabs, activeTabId, chatMessages } = useIDEStore();

// ✅ Correct — open a file via ideStore
ideStore.openTab({ path, name, content, language, relativePath });

// ❌ Wrong — local state for IDE-level concerns
const [tabs, setTabs] = useState<Tab[]>([]);
const [chatMessages, setChatMessages] = useState<Message[]>([]);
```

**What goes in ideStore**:
- Workspace path and name
- Layout: panel open/closed states, active sidebar panel, active bottom tab
- Open tabs: path, content, language, dirty state
- Active tab ID
- Chat messages and loading state
- Chat mode (chat vs agent)

**What does NOT go in ideStore**:
- File tree (fetched fresh by `useFileTree`)
- Git status (in gitStore)
- Model config (in modelStore)

---

### modelStore — AI Model Config (Persisted)
```typescript
// ✅ Correct — read model config
const { activeConfig, isConnected } = useModelStore();

// ✅ Correct — save config (apiKey travels to backend only)
modelStore.setActiveConfig({ url, name, apiKey, provider, maxTokens, temperature });
```

**Key rule**: `apiKey` is stored in modelStore but is ONLY sent to the backend via `POST /api/model/config`. It is never used in any frontend fetch call directly.

---

### useState — Component-Specific Only
```typescript
// ✅ Correct — modal open state
const [isOpen, setIsOpen] = useState(false);

// ✅ Correct — rename input value
const [renameValue, setRenameValue] = useState(node.name);

// ❌ Wrong — file tree in local state (should come from useFileTree hook)
const [fileTree, setFileTree] = useState<FileNode[]>([]);
```

---

## Backend Rules (Express / Node.js)

### Path Validation — MANDATORY on Every File Route

Every route that accepts a file path must validate it before any `fs` operation:

```typescript
// ✅ CORRECT — validate first
import path from 'path';

function validatePath(requestedPath: string, workspaceRoot: string): string {
  const resolved = path.resolve(workspaceRoot, requestedPath);
  const root = path.resolve(workspaceRoot);

  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('PATH_TRAVERSAL');
  }
  return resolved;
}

router.get('/read', async (req: Request, res: Response) => {
  try {
    const safePath = validatePath(req.query.path as string, getWorkspaceRoot());
    const result = await fileService.readFile(safePath);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'PATH_TRAVERSAL') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: (err as Error).message });
  }
});

// ❌ NEVER — no validation
router.get('/read', async (req, res) => {
  const content = await fs.readFile(req.query.path, 'utf8'); // path traversal vulnerability!
  res.json({ content });
});
```

---

### API Key Never in Response

```typescript
// ✅ CORRECT — strip apiKey before responding
router.get('/config', (req: Request, res: Response) => {
  const { apiKey, ...safeConfig } = modelService.getActiveConfig();
  res.json(safeConfig);
});

// ❌ NEVER — sending apiKey to frontend
router.get('/config', (req, res) => {
  res.json(modelService.getActiveConfig()); // exposes apiKey!
});
```

---

### Consistent Error Format
```typescript
// ✅ All errors follow same shape
res.status(400).json({ error: 'Message here' });
res.status(403).json({ error: 'Access denied' });
res.status(404).json({ error: 'File not found' });
res.status(500).json({ error: error.message });

// ❌ Inconsistent
res.status(400).json({ message: 'Bad' });
res.status(500).send('error');
res.status(404).json({ status: 'not_found' });
```

---

### Service Layer — No Express in Services

Services must not import or reference Express types:

```typescript
// ✅ CORRECT — pure TypeScript service
// services/fileService.ts
export async function readFile(filePath: string): Promise<FileReadResult> {
  const content = await fs.readFile(filePath, 'utf8');
  return { content, language: detectLanguage(filePath), size: content.length };
}

// ❌ WRONG — Express leaking into service
import { Request, Response } from 'express';
export async function readFile(req: Request, res: Response) { ... }
```

---

### PTY Cleanup — Always

```typescript
// ✅ CORRECT — cleanup on close
ws.on('close', () => {
  const sessionIds = getSessionsForConnection(ws);
  sessionIds.forEach(id => terminalService.killSession(id));
});

process.on('exit', () => {
  terminalService.killAllSessions();
});

// ❌ WRONG — sessions leak as zombie processes
ws.on('close', () => {}); // nothing
```

---

### Agent Iteration Cap — Always Enforced

```typescript
// ✅ CORRECT
const MAX_ITERATIONS = 20;
let iterations = 0;

while (iterations < MAX_ITERATIONS) {
  iterations++;
  // ...
}

// ❌ WRONG — infinite loop risk
while (true) {
  const response = await callModel(messages);
  if (!response.tool_calls?.length) break;
  // if model never stops calling tools → server hangs forever
}
```

---

## API Layer Rules (Frontend)

### One File Per Domain
```
lib/api/
├── filesApi.ts       ← workspace + file CRUD + search
├── gitApi.ts         ← all git operations
├── modelApi.ts       ← model config + connection test
└── chatApi.ts        ← streaming chat + agent SSE
```

### Always Return Typed Data
```typescript
// ✅ Good — typed return value, unwrapped
export const filesApi = {
  readFile: (path: string): Promise<FileReadResult> =>
    axios.get(`${BASE}/api/files/read`, { params: { path } }).then(r => r.data),
};

// ❌ Bad — returning raw axios response
export const filesApi = {
  readFile: (path: string) =>
    axios.get(`${BASE}/api/files/read`, { params: { path } }),
    // caller gets AxiosResponse — not typed, not clean
};
```

### Streaming Uses fetch, Not axios
```typescript
// ✅ Correct — SSE requires fetch + ReadableStream
export async function* streamChat(messages: Message[], signal: AbortSignal) {
  const response = await fetch(`${BASE}/api/model/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: true }),
    signal,
  });
  // ... parse SSE lines
}

// ❌ Wrong — axios doesn't support streaming well
const response = await axios.post('/api/model/chat', { stream: true });
```

### Always Use AbortController for Streaming
```typescript
// ✅ Correct — allow cancellation
const controller = new AbortController();

// Store ref so Stop button can cancel
abortRef.current = controller;

for await (const chunk of streamChat(messages, controller.signal)) {
  appendChunk(chunk);
}

// Stop button
abortRef.current?.abort();
```

---

## CSS / Styling Rules

### Always Use CSS Variables for Colors
```typescript
// ✅ Correct
<div style={{ background: 'var(--bg-2)', color: 'var(--text-0)' }} />
<div className="bg-[var(--bg-2)] text-[var(--text-0)]" />
<div className="border-[var(--border)] hover:bg-[var(--bg-3)]" />

// ❌ Never hardcode colors
<div style={{ background: '#16161f' }} />
<div className="bg-zinc-900" />
```

### Font Rules
```typescript
// ✅ Code, terminal, file names, paths → JetBrains Mono
<span className="font-mono text-sm">{node.relativePath}</span>
<div className="font-mono">{terminalOutput}</div>

// ✅ UI text → Inter (default body font)
<span className="text-sm">{node.name}</span>
<button className="text-xs">Save</button>
```

### No RTL Required
Custle IDE targets developers only and has no RTL/i18n requirement. Use standard `ml-`, `mr-`, `pl-`, `pr-` Tailwind classes freely.

---

## WebSocket Rules

### Always Convert URL Protocol
```typescript
// ✅ Correct
const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL!
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

// ❌ Wrong — http:// in WebSocket constructor throws
const ws = new WebSocket('http://localhost:3001');
```

### Always Auto-Reconnect
```typescript
// ✅ Correct — exponential backoff reconnect
let retries = 0;

function connect() {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => { retries = 0; };

  ws.onclose = () => {
    const delay = Math.min(1000 * 2 ** retries++, 30000);
    setTimeout(connect, delay);
  };
}
```

### Always Parse Messages Safely
```typescript
// ✅ Correct — try/catch on parse
ws.onmessage = (event) => {
  try {
    const msg: WebSocketMessage = JSON.parse(event.data);
    handleMessage(msg);
  } catch {
    console.warn('Malformed WS message:', event.data);
  }
};

// ❌ Wrong — uncaught parse error crashes the handler
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data); // throws if malformed
  handleMessage(msg);
};
```

---

## File Size Guidelines

| File type | Max lines | Action if exceeded |
|-----------|-----------|-------------------|
| React component | 250 lines | Split into sub-components |
| Custom hook | 120 lines | Split into multiple hooks |
| API module | 150 lines | Split by sub-domain |
| Service (backend) | 200 lines | Split by responsibility |
| Route file (backend) | 100 lines | Split route handlers |

---

## Import Order

```typescript
// 1. React
import { useState, useCallback } from 'react';

// 2. Next.js
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// 3. External libraries
import { WebSocket } from 'ws';         // backend
import axios from 'axios';              // frontend

// 4. Stores
import { useIDEStore } from '@/store/ideStore';

// 5. Hooks
import { useFileTree } from '@/hooks/useFileTree';

// 6. API modules
import { filesApi } from '@/lib/api/filesApi';

// 7. Type imports (always use 'type' keyword)
import { type FileNode, type Tab } from '@/types';

// 8. Relative imports
import { FileTreeItem } from './FileTreeItem';
```

---

## Error Handling

### Frontend — Always Show User Feedback
```typescript
// ✅ Correct — user sees what went wrong
try {
  await filesApi.writeFile(path, content);
  toast.success('Saved');
} catch (error) {
  const msg = axios.isAxiosError(error)
    ? (error.response?.data?.error ?? error.message)
    : 'Unexpected error';
  toast.error(msg);
}

// ❌ Wrong — silently fails
try {
  await filesApi.writeFile(path, content);
} catch { /* nothing */ }
```

### Backend — Always Log and Respond
```typescript
// ✅ Correct
router.post('/commit', async (req: Request, res: Response) => {
  try {
    const result = await gitService.commit(req.body.message);
    res.json(result);
  } catch (err: unknown) {
    console.error('[git/commit]', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// ❌ Wrong — silent catch
router.post('/commit', async (req, res) => {
  try {
    const result = await gitService.commit(req.body.message);
    res.json(result);
  } catch { res.status(500).end(); } // no message, no log
});
```

---

## Key Principles Summary

### ✅ Always Do

1. TypeScript strict — no `any`, explicit return types everywhere
2. `'use client'` on all IDE components (frontend)
3. `reactStrictMode: false` in next.config.ts
4. Dynamic import Monaco and xterm (`ssr: false`)
5. Validate all file paths against workspace root (backend)
6. Strip `apiKey` from all API responses (backend)
7. Kill PTY sessions on WebSocket close and process exit
8. Cap agent iterations at 20
9. Use CSS variables for all colors
10. Auto-reconnect WebSocket with exponential backoff
11. AbortController for all streaming requests
12. Convert `http://` → `ws://` for WebSocket URLs

### ❌ Never Do

1. Use `any` type — anywhere, ever
2. Import Monaco or xterm at module level (SSR crash)
3. Put AI API keys in frontend code or `.env.local`
4. Skip path validation on any file route (path traversal)
5. Return `apiKey` in any HTTP response
6. Leave PTY sessions running (memory + process leak)
7. Let agent loop without iteration cap (server hang)
8. Hardcode colors — always CSS variables
9. Call AI model directly from browser (bypasses key protection)
10. Update systemTasks.md more than once per task execution