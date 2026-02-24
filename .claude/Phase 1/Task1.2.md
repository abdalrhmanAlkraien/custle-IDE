📄 Task 1.2 — IDE Shell, Store & Layout
=========================================

🎯 Objective
------------
Build the complete IDE shell UI with all panel zones, Zustand store,
and the gorgeous dark theme. Every panel is a placeholder with correct
dimensions — ready to receive real components in later tasks.

📂 File Locations
=================
```shell
frontend/src/store/ideStore.ts
frontend/src/store/modelStore.ts
frontend/src/components/ide/IDEShell.tsx
frontend/src/components/ide/TitleBar.tsx
frontend/src/components/ide/ActivityBar.tsx
frontend/src/components/ide/StatusBar.tsx
frontend/src/app/globals.css
frontend/src/app/page.tsx
```
1️⃣ Design System — globals.css
================================
```css
:root {
  --bg-0: #0d0d14;
  --bg-1: #111118;
  --bg-2: #16161f;
  --bg-3: #1c1c28;
  --bg-4: #232333;
  --border: #2a2a3d;
  --border-bright: #3d3d58;
  --text-0: #eeeef5;
  --text-1: #9999bb;
  --text-2: #55556b;
  --accent: #7b68ee;
  --accent-bright: #9d8fff;
  --accent-dim: #3d3580;
  --accent-glow: rgba(123, 104, 238, 0.12);
  --green: #50fa7b;
  --red: #ff5555;
  --yellow: #ffb86c;
  --cyan: #8be9fd;
  --pink: #ff79c6;
  --orange: #ffb86c;
  --purple: #bd93f9;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-ui: 'Inter', system-ui, sans-serif;
}

/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; }
body { font-family: var(--font-ui); background: var(--bg-0); color: var(--text-0); }

/* Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }
```

2️⃣ ideStore.ts
===============
Full Zustand store with ALL IDE state:
```typescript
interface Tab {
  id: string;
  path: string;           // absolute path
  relativePath: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorLine: number;
  cursorCol: number;
}

interface IDEStore {
  // Workspace
  workspacePath: string | null;
  workspaceName: string;
  setWorkspace: (path: string, name: string) => void;

  // Layout
  activeSidebarPanel: 'files' | 'search' | 'git' | 'extensions';
  sidebarWidth: number;
  chatWidth: number;
  bottomHeight: number;
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  isBottomOpen: boolean;
  activeBottomTab: 'terminal' | 'problems' | 'output';
  setSidebarPanel: (p: IDEStore['activeSidebarPanel']) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  toggleBottom: () => void;
  setBottomTab: (t: IDEStore['activeBottomTab']) => void;

  // Tabs & Editor
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id' | 'isDirty' | 'cursorLine' | 'cursorCol'>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabClean: (id: string) => void;
  updateCursor: (id: string, line: number, col: number) => void;

  // Chat
  chatMode: 'chat' | 'agent';
  setChatMode: (m: IDEStore['chatMode']) => void;
}
```

3️⃣ modelStore.ts
=================
```typescript
interface ModelConfig {
  url: string;
  name: string;
  apiKey: string;
  provider: 'openai-compatible' | 'anthropic' | 'openai';
  maxTokens: number;
  temperature: number;
}

interface ModelStore {
  configs: ModelConfig[];     // saved model configs
  activeConfig: ModelConfig;  // currently selected
  isConnected: boolean;
  isChecking: boolean;
  addConfig: (c: ModelConfig) => void;
  removeConfig: (url: string) => void;
  setActiveConfig: (c: ModelConfig) => void;
  setConnected: (v: boolean) => void;
  checkConnection: () => Promise<void>;
}

// Persist to localStorage using zustand/middleware persist
```

4️⃣ IDEShell.tsx
================
```typescript
// Layout using react-resizable-panels:
//
// <TitleBar />   ← full width, h-[38px], fixed
// <div flex-1 flex overflow-hidden>
//   <ActivityBar />    ← w-[46px] fixed
//   <PanelGroup direction="horizontal">
//     <Panel ref={sidebarPanel} defaultSize={18} minSize={10} maxSize={35} collapsible>
//       <Sidebar />           ← Task 2.2
//     </Panel>
//     <PanelResizeHandle className="w-[1px] bg-border hover:bg-accent-dim" />
//     <Panel defaultSize={57}>
//       <PanelGroup direction="vertical">
//         <Panel defaultSize={68} minSize={20}>
//           <EditorArea />    ← Task 2.1
//         </Panel>
//         <PanelResizeHandle className="h-[1px] bg-border hover:bg-accent-dim" />
//         <Panel ref={bottomPanel} defaultSize={32} minSize={10} collapsible>
//           <BottomPanel />   ← Task 4.1
//         </Panel>
//       </PanelGroup>
//     </Panel>
//     <PanelResizeHandle className="w-[1px] bg-border hover:bg-accent-dim" />
//     <Panel ref={chatPanel} defaultSize={25} minSize={18} maxSize={45} collapsible>
//       <ChatPanel />         ← Task 3.1
//     </Panel>
//   </PanelGroup>
// </div>
// <StatusBar />   ← full width, h-[22px], fixed
```

5️⃣ TitleBar.tsx
================
Height 38px. Three zones:
- **Left**: Logo `⬡ NeuralIDE` (Inter 700, accent color) + animated pulse dot
- **Center**: Menu bar — [File] [Edit] [View] [Terminal] [Help]
    - "File" dropdown: Open Folder, Open GitHub Repo, Save, Save All
    - All dropdowns are UI only for now (wired in later tasks)
- **Right**:
    - Model pill: `[●] Qwen3-Coder-30B ▾` — clicking opens Model Config modal (Task 6.1)
    - GitHub connect button (Task 5.x)
    - Agent/Chat mode toggle (Task 3.1)

6️⃣ ActivityBar.tsx
===================
46px wide. Icons from lucide-react, tooltips on hover:
- `<FolderOpen />` → files panel
- `<Search />` → search panel
- `<GitBranch />` → git panel
- `<Puzzle />` → extensions (placeholder)
- Bottom pinned: `<Settings />` → opens settings modal

7️⃣ StatusBar.tsx
=================
22px, background var(--accent-dim). Items:
- Left: `<GitBranch size={11}/>` + current branch name (from git store)
- Left: sync status (↑2 ↓0 indicators)
- Left: active file's language
- Right: cursor position "Ln X, Col Y" from active tab
- Right: file encoding "UTF-8"
- Right: line ending "LF"
- Right: "AI ✦" indicator (lights up when autocomplete is fetching)

🧪 Test Scenarios
=================

### Scenario 1: Full chrome renders
- Open localhost:3000
- Expected: TitleBar + ActivityBar + 3 panel zones + StatusBar all visible

### Scenario 2: Panels resize
- Drag resize handle between sidebar and editor
- Expected: Smooth resize, min/max respected

### Scenario 3: Panel collapse
- Double-click sidebar resize handle
- Expected: Sidebar collapses to 0, more space for editor

### Scenario 4: Activity bar switching
- Click Search icon
- Expected: Sidebar switches to search panel placeholder

### Scenario 5: Model pill
- Check right side of title bar
- Expected: Model name visible with connection status dot

🔒 Non-Functional Requirements
===============================
- 'use client' on all components
- No layout shift on load
- Resize handles must be clickable (at least 4px wide/tall)

✅ Deliverable
==============
```shell
Full IDE chrome with correct layout, resizable panels, store initialized
```

📊 Acceptance Criteria
======================
- [ ] All 6 layout zones render correctly
- [ ] Panels resize and collapse
- [ ] Activity bar switches sidebar panel
- [ ] Store initializes without errors
- [ ] Model store persists to localStorage
- [ ] No TypeScript errors, no console errors

⏱️ Estimated Duration: 60-75 minutes
🔗 Dependencies: Task 1.1
🔗 Blocks: All feature tasks