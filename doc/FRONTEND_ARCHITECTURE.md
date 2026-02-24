# Custle IDE — Frontend Architecture

## Project Overview

**Type**: Web IDE (VS Code / Cursor alternative)
**Users**: Developers running Custle IDE locally
**Backend**: Node.js/Express backend on port 3001 (same machine)
**Frontend**: Next.js 14 (App Router), TypeScript, Zustand

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   IDE Shell Layer                       │
│  (IDEShell, TitleBar, ActivityBar, StatusBar)           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   Panel Components                      │
│  (EditorArea, Sidebar, ChatPanel, TerminalPanel)        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    State Management                     │
│  ideStore (Zustand) | modelStore (Zustand+persist)      │
│  gitStore (Zustand) | hooks (useFileTree, useTerminal)  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                      API Layer                          │
│  (lib/api/filesApi, gitApi, modelApi, chatApi)          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              HTTP + WebSocket Layer                     │
│  (axios for REST | WebSocket for terminal + watcher)    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Local Express Backend                      │
│  (REST API + WebSocket at http://localhost:3001)        │
└─────────────────────────────────────────────────────────┘
```

---

## Critical Import Rules

### Monaco Editor — ALWAYS dynamic import

```typescript
// ✅ CORRECT — browser only
const MonacoEditor = dynamic(
    () => import('@monaco-editor/react'),
    { ssr: false }
);

// ❌ WRONG — crashes Next.js SSR
import MonacoEditor from '@monaco-editor/react';
```

### xterm.js — ALWAYS dynamic import

```typescript
// ✅ CORRECT — browser only
const XTerminal = dynamic(
    () => import('@/components/terminal/XTerminal'),
    { ssr: false }
);

// ❌ WRONG — crashes Next.js SSR
import { Terminal } from '@xterm/xterm';
```

### next.config.ts — reactStrictMode MUST be false

```typescript
// ✅ CORRECT — Monaco breaks with strict mode
const config: NextConfig = {
    reactStrictMode: false,
};

// ❌ WRONG
const config: NextConfig = {
    reactStrictMode: true,
};
```

---

## Data Flow Patterns

### Reading Files

```
User clicks file in FileTree
    ↓
FileTreeItem calls openFile(node)
    ↓
filesApi.readFile(node.path) → GET /api/files/read?path=...
    ↓
Backend validates path against workspace root
    ↓
Backend reads file from disk
    ↓
Returns { content, language, size, modified }
    ↓
ideStore.openTab({ path, content, language, ... })
    ↓
EditorArea renders MonacoEditor with content
    ↓
StatusBar updates language + cursor position
```

### Saving Files (Ctrl+S)

```
User presses Ctrl+S in Monaco editor
    ↓
Monaco keybinding fires saveFile()
    ↓
filesApi.writeFile(tab.path, tab.content)
    → POST /api/files/write { path, content }
    ↓
Backend validates path, writes atomically
    ↓
ideStore.markTabClean(activeTabId)
    ↓
Dirty indicator (●) disappears from tab
    ↓
Toast: "Saved"
```

### AI Chat (Streaming)

```
User types message, presses Enter
    ↓
ChatPanel sends to chatApi.streamChat(messages)
    → POST /api/model/chat { messages, stream: true }
    ↓
Backend adds API key, proxies to vLLM/OpenAI/Anthropic
    ↓
SSE stream returned to frontend
    ↓
ChatPanel appends chunks to assistant message
    ↓
ReactMarkdown renders code blocks with syntax highlight
    ↓
Auto-scroll to bottom as content arrives
```

### Agent Tool Execution

```
User sends task in Agent mode
    ↓
ChatPanel sends to POST /api/agent/run (SSE)
    ↓
Backend starts agent loop (max 20 iterations):
    ├─ Send messages + tools to model
    ├─ Model returns tool_calls
    ├─ Backend executes tool (read_file, write_file, run_terminal...)
    ├─ Stream step result as SSE event
    └─ Append result to messages, repeat
    ↓
Frontend receives SSE events:
    { type: 'tool_call', tool: 'read_file', args: {...} }
    { type: 'tool_result', tool: 'read_file', result: '...' }
    { type: 'text', content: 'Done! I created...' }
    ↓
AgentStepCard rendered per tool call
    ↓
Final text rendered as ChatMessage
```

### Real-time File Watching

```
Backend chokidar watches workspace root
    ↓
File changes on disk (external editor, git pull, etc.)
    ↓
chokidar emits 'change' | 'add' | 'unlink' event
    ↓
Backend broadcasts via WebSocket:
    { type: 'file:change', event: 'change', path: '...' }
    { type: 'tree:refresh' }
    ↓
useFileWatcher hook receives message
    ↓
If 'tree:refresh' → refetchTree()
If 'file:change' and file is open in tab → re-read file content
    ↓
FileTree updates, open tab content stays in sync
```

---

## State Management Strategy

### ideStore (Zustand — NOT persisted)

**What**: All IDE UI state for the current session
**Where**: `frontend/src/store/ideStore.ts`

```typescript
interface IDEStore {
    // Workspace
    workspacePath: string | null;
    workspaceName: string;

    // Layout
    activeSidebarPanel: 'files' | 'search' | 'git' | 'extensions';
    isSidebarOpen: boolean;
    isChatOpen: boolean;
    isBottomOpen: boolean;
    activeBottomTab: 'terminal' | 'problems' | 'output';

    // Tabs & Editor
    tabs: Tab[];
    activeTabId: string | null;

    // Chat
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    chatMode: 'chat' | 'agent';
}
```

**Key Principles**:
- ✅ All IDE layout state lives here
- ✅ All open tabs and their content live here
- ✅ Chat messages live here
- ❌ Do NOT persist to localStorage (workspace changes between sessions)
- ❌ Do NOT store file tree here (fetched fresh from backend)

---

### modelStore (Zustand — persisted to localStorage)

**What**: AI model configuration
**Where**: `frontend/src/store/modelStore.ts`

```typescript
interface ModelStore {
    configs: ModelConfig[];     // All saved model configs
    activeConfig: ModelConfig;  // Currently selected
    isConnected: boolean;
    checkConnection: () => Promise<void>;
}

interface ModelConfig {
    url: string;
    name: string;
    apiKey: string;             // Sent to backend only, never used in frontend fetch
    provider: 'openai-compatible' | 'anthropic' | 'openai';
    maxTokens: number;
    temperature: number;
}
```

**Key Principles**:
- ✅ Persisted — model configs survive page reload
- ✅ API key stored here but ONLY sent to backend, never used in frontend fetch
- ✅ Connection status refreshed on mount

---

### gitStore (Zustand — NOT persisted)

**What**: Git status for current workspace
**Where**: `frontend/src/store/gitStore.ts`

```typescript
interface GitStore {
    status: GitStatus | null;
    history: GitCommit[];
    branches: { current: string; local: string[]; remote: string[] };
    isLoading: boolean;
    refresh: () => Promise<void>;
    // actions: stageFile, unstageFile, commit, push, pull, checkout
}
```

**Key Principles**:
- ✅ Auto-refreshes every 30 seconds
- ✅ Refreshes on file watcher events
- ❌ Do NOT persist (git state is always read fresh from disk)

---

### Local Component State (useState)

Use for:
- Modal open/closed
- Dropdown visibility
- Inline rename input active/inactive

**Key Principles**:
- ✅ Temporary, single-component UI state only
- ❌ Do NOT use for anything shared between components
- ❌ Do NOT use for file content (goes in ideStore tabs)

---

## Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx            ← Root layout: fonts, globals
│   ├── globals.css           ← CSS variables design system
│   └── page.tsx              ← Single page: renders <IDEShell />
├── components/
│   ├── ide/
│   │   ├── IDEShell.tsx      ← react-resizable-panels root layout
│   │   ├── TitleBar.tsx      ← Logo, menus, model pill, mode toggle
│   │   ├── ActivityBar.tsx   ← 46px left icon rail
│   │   └── StatusBar.tsx     ← 22px bottom strip
│   ├── editor/
│   │   ├── EditorArea.tsx    ← Tabs + editor zone
│   │   ├── EditorTabs.tsx    ← Tab bar with dirty indicator
│   │   ├── MonacoEditor.tsx  ← Monaco (dynamic, ssr:false)
│   │   └── EditorPlaceholder.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx       ← Panel switcher
│   │   ├── WorkspaceSelector.tsx
│   │   ├── FileTree.tsx      ← Recursive tree
│   │   ├── FileTreeItem.tsx  ← Single node with context menu
│   │   └── SearchPanel.tsx   ← Full-text search
│   ├── chat/
│   │   ├── ChatPanel.tsx     ← Chat + Agent panel
│   │   ├── ChatMessage.tsx   ← Markdown rendering
│   │   ├── ChatInput.tsx     ← Textarea + toolbar
│   │   └── AgentStepCard.tsx ← Collapsible tool call card
│   ├── terminal/
│   │   ├── BottomPanel.tsx   ← Tab bar: Terminal/Problems/Output
│   │   ├── TerminalPanel.tsx ← Terminal tab content
│   │   └── XTerminal.tsx     ← xterm.js (dynamic, ssr:false)
│   ├── git/
│   │   ├── GitPanel.tsx      ← Source control panel
│   │   ├── GitFileItem.tsx   ← File with status badge
│   │   ├── GitHistory.tsx    ← Commit list
│   │   └── BranchSwitcher.tsx
│   ├── modals/
│   │   ├── ModelConfigModal.tsx
│   │   ├── CommandPalette.tsx
│   │   └── SettingsModal.tsx
│   └── ui/
│       ├── Toast.tsx
│       └── ConfirmDialog.tsx
├── store/
│   ├── ideStore.ts
│   ├── modelStore.ts
│   └── gitStore.ts
├── hooks/
│   ├── useFileWatcher.ts     ← WebSocket file change listener
│   ├── useFileTree.ts        ← File tree fetch + CRUD operations
│   ├── useTerminal.ts        ← WebSocket terminal session
│   └── useKeyboard.ts        ← Global keyboard shortcut registration
└── lib/
    ├── api/
    │   ├── filesApi.ts       ← File system REST calls
    │   ├── gitApi.ts         ← Git REST calls
    │   ├── modelApi.ts       ← Model config + connection test
    │   └── chatApi.ts        ← Chat + agent streaming
    ├── languageMap.ts        ← Extension → Monaco language
    ├── fileIcons.ts          ← Extension → emoji icon
    ├── monacoTheme.ts        ← neural-dark theme definition
    ├── vllmClient.ts         ← SSE streaming client
    └── completionProvider.ts ← Monaco inline completion provider
```

---

## API Layer Patterns

### Base Pattern

```typescript
// lib/api/filesApi.ts
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL; // http://localhost:3001

export const filesApi = {
    readFile: (path: string) =>
        axios.get(`${BASE}/api/files/read`, { params: { path } })
            .then(r => r.data),

    writeFile: (path: string, content: string) =>
        axios.post(`${BASE}/api/files/write`, { path, content })
            .then(r => r.data),

    createFile: (path: string) =>
        axios.post(`${BASE}/api/files/create`, { path, type: 'file' })
            .then(r => r.data),

    deleteFile: (path: string) =>
        axios.delete(`${BASE}/api/files/delete`, { data: { path } })
            .then(r => r.data),

    searchFiles: (q: string) =>
        axios.get(`${BASE}/api/files/search`, { params: { q } })
            .then(r => r.data),
};
```

**API Layer Principles**:
- ✅ One file per domain (filesApi, gitApi, modelApi, chatApi)
- ✅ Return `r.data` — backend returns data directly, no wrapper to unwrap
- ✅ Always type the return value
- ❌ Never put API calls directly in components
- ❌ Never add AI API keys in frontend axios calls

---

### WebSocket Connection Pattern

```typescript
// hooks/useFileWatcher.ts
const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL!
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');

const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'tree:refresh') refetchTree();
    if (msg.type === 'file:change') handleFileChange(msg.path);
    if (msg.type === 'terminal:output') appendToTerminal(msg.sessionId, msg.data);
};

// Auto-reconnect with backoff
ws.onclose = () => {
    setTimeout(connect, Math.min(1000 * 2 ** retryCount, 30000));
};
```

**WebSocket Principles**:
- ✅ Always convert `http://` → `ws://`
- ✅ Auto-reconnect with exponential backoff
- ✅ Kill PTY session on WS close
- ❌ Never send API keys over WebSocket

---

### Streaming Chat (SSE)

```typescript
// lib/chatApi.ts — streaming via fetch (not axios)
export async function* streamChat(messages: Message[], signal: AbortSignal) {
    const response = await fetch(`${BASE}/api/model/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, stream: true }),
        signal, // AbortController signal
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const data = JSON.parse(line.slice(6));
                yield data.choices[0]?.delta?.content ?? '';
            }
        }
    }
}
```

---

## Component Patterns

### IDE Shell Layout (react-resizable-panels)

```
<TitleBar />           ← h-[38px], fixed top
<div flex overflow-hidden>
  <ActivityBar />      ← w-[46px], fixed left
  <PanelGroup horizontal>
    <Panel sidebar />  ← 18% default, collapsible
    <ResizeHandle />
    <Panel editor>
      <PanelGroup vertical>
        <Panel editor-content />  ← 68% default
        <ResizeHandle />
        <Panel bottom />          ← 32% default, collapsible
      </PanelGroup>
    </Panel>
    <ResizeHandle />
    <Panel chat />     ← 25% default, collapsible
  </PanelGroup>
</div>
<StatusBar />          ← h-[22px], fixed bottom
```

### All IDE Components Must Be Client Components

```typescript
// ✅ CORRECT — 'use client' required on all IDE components
'use client';

import { useIDEStore } from '@/store/ideStore';

export function FileTree() {
    const { workspacePath } = useIDEStore();
    // ...
}
```

The IDE is a single-page fully interactive application — no server components inside the IDE shell. Only `app/page.tsx` is a server component and it immediately renders `<IDEShell />`.

---

## Design System

### CSS Variables (globals.css)

```css
:root {
    --bg-0: #0d0d14;       /* deepest — editor background */
    --bg-1: #111118;       /* panels */
    --bg-2: #16161f;       /* cards, hover targets */
    --bg-3: #1c1c28;       /* active states */
    --bg-4: #232333;       /* selected items */
    --border: #2a2a3d;
    --border-bright: #3d3d58;
    --text-0: #eeeef5;     /* primary */
    --text-1: #9999bb;     /* secondary */
    --text-2: #55556b;     /* muted */
    --accent: #7b68ee;     /* purple — primary accent */
    --accent-bright: #9d8fff;
    --accent-dim: #3d3580;
    --accent-glow: rgba(123, 104, 238, 0.12);
    --green: #50fa7b;
    --red: #ff5555;
    --yellow: #ffb86c;
    --cyan: #8be9fd;
    --pink: #ff79c6;
}
```

### Fonts

- **UI text**: Inter — menus, labels, chat, sidebar
- **Code**: JetBrains Mono — editor, terminal, file names, code blocks in chat

### Always Use CSS Variables

```typescript
// ✅ CORRECT
<div style={{ background: 'var(--bg-2)', color: 'var(--text-0)' }} />
<div className="bg-[var(--bg-2)] text-[var(--text-0)]" />

// ❌ WRONG — hardcoded colors break theming
<div style={{ background: '#16161f' }} />
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileTreeItem.tsx` |
| Stores | camelCase | `ideStore.ts` |
| Hooks | camelCase + use | `useFileTree.ts` |
| API modules | camelCase | `filesApi.ts` |
| Utilities | camelCase | `languageMap.ts` |
| Page | lowercase | `page.tsx` |

---

## Error Handling

### API Errors

```typescript
// In API layer — catch and rethrow with message
try {
    return await filesApi.readFile(path);
} catch (error) {
    if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error ?? error.message);
    }
    throw error;
}
```

### Toast Notifications

```typescript
import { useToast } from '@/hooks/useToast';

const { toast } = useToast();
toast.success('File saved');
toast.error('Failed to connect to backend');
toast.info('Agent completed task');
toast.warning('Workspace not set');
```

---

## Performance Rules

### Debounce Reference

| Feature | Debounce |
|---------|---------|
| Search panel query | 400ms |
| AI autocomplete trigger | 700ms |
| Git status auto-refresh | 30,000ms interval |
| File watcher response | immediate |

### AbortController for AI Requests

```typescript
// Always allow cancellation — attach to Stop button
const controller = new AbortController();

const response = await fetch('/api/model/chat', {
    signal: controller.signal,
});

// On Stop button click or new message typed:
controller.abort();
```

---

## Key Architecture Principles

### ✅ Always Do This

1. Dynamic import Monaco and xterm with `ssr: false`
2. Add `'use client'` to all IDE components
3. Keep `reactStrictMode: false` in next.config.ts
4. Read IDE state from ideStore, model config from modelStore
5. Proxy ALL AI calls through backend `/api/model/chat`
6. Convert `http://` → `ws://` for WebSocket URLs
7. Use CSS variables for all colors
8. Use JetBrains Mono for all code and terminal text
9. Use AbortController for all streaming AI requests
10. Auto-reconnect WebSocket with exponential backoff

### ❌ Never Do This

1. Import Monaco or xterm at module level (SSR crash)
2. Put AI API keys in `.env.local` or any frontend code
3. Call vLLM/OpenAI directly from browser
4. Use `any` type
5. Hardcode colors — always use CSS variables
6. Call backend API directly from a React component
7. Leave PTY sessions running after terminal tab closes
8. Let agent run more than 20 iterations
9. Update systemTasks.md more than once per task