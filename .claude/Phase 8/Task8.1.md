# Task 8.1: Menu Bar — File, Edit, View, Help Dropdowns

**Phase**: Phase 8 — UI Polish & Completeness  
**Task Number**: 8.1  
**Status**: ⏳ PENDING  
**Dependencies**: 1.2 (IDE Shell Layout), 2.3 (Monaco Editor), 7.2 (Folder Browser), 7.3 (Terminal)  
**Blocks**: Nothing  
**Estimated Duration**: 60-75 minutes  
**Estimated Cost**: ~$0.38 (Implementation: $0.28, Testing: $0.10)

---

## Objective

The title bar shows **File | Edit | View | Help** as static text — clicking them does nothing. Make every menu item a functional dropdown with IDE-relevant actions, keyboard shortcuts displayed, and proper dividers. All items must connect to real application behavior already implemented in other tasks.

---

## What the Menus Should Do

### File Menu
```
File
├── Open Folder...          Cmd/Ctrl+Shift+O   → Opens FolderBrowser modal (Task 7.2)
├── Open Recent             ▶                  → Submenu: last 5 opened workspaces
├── ─────────────────────────────
├── New File                Cmd/Ctrl+N         → Creates untitled file in editor
├── Save                    Cmd/Ctrl+S         → Saves active tab
├── Save As...              Cmd/Ctrl+Shift+S   → Saves copy with new name/path
├── Save All                Cmd/Ctrl+Alt+S     → Saves all dirty tabs
├── ─────────────────────────────
├── Close File              Cmd/Ctrl+W         → Closes active tab
├── Close All Files                            → Closes all tabs
└── ─────────────────────────────
    Quit                    Cmd+Q / Alt+F4     → window.close() (Electron-style)
```

### Edit Menu
```
Edit
├── Undo                    Cmd/Ctrl+Z         → Monaco editor undo
├── Redo                    Cmd/Ctrl+Shift+Z   → Monaco editor redo
├── ─────────────────────────────
├── Cut                     Cmd/Ctrl+X         → Monaco cut selection
├── Copy                    Cmd/Ctrl+C         → Monaco copy selection
├── Paste                   Cmd/Ctrl+V         → Monaco paste
├── ─────────────────────────────
├── Find                    Cmd/Ctrl+F         → Monaco find widget
├── Replace                 Cmd/Ctrl+H         → Monaco find+replace widget
├── Find in Files           Cmd/Ctrl+Shift+F   → Opens Search panel in sidebar
├── ─────────────────────────────
├── Select All              Cmd/Ctrl+A         → Monaco select all
├── Toggle Comment          Cmd/Ctrl+/         → Monaco toggle line comment
└── Format Document         Shift+Alt+F        → Monaco format document
```

### View Menu
```
View
├── Explorer                Cmd/Ctrl+Shift+E   → ideStore.setActiveSidebarPanel('files')
├── Search                  Cmd/Ctrl+Shift+F   → ideStore.setActiveSidebarPanel('search')
├── Git                     Cmd/Ctrl+Shift+G   → ideStore.setActiveSidebarPanel('git')
├── ─────────────────────────────
├── Toggle Sidebar          Cmd/Ctrl+B         → ideStore.toggleSidebar()
├── Toggle Chat             Cmd/Ctrl+Shift+C   → ideStore.toggleChat()
├── Toggle Terminal         Ctrl+`             → ideStore.toggleBottomPanel()
├── ─────────────────────────────
├── New Terminal            Cmd/Ctrl+Shift+`   → ideStore.addTerminalTab()
├── ─────────────────────────────
├── Zoom In                 Cmd/Ctrl+=         → document.body fontSize scale up
├── Zoom Out                Cmd/Ctrl+-         → document.body fontSize scale down
└── Reset Zoom              Cmd/Ctrl+0         → Reset font scale
```

### Help Menu
```
Help
├── About Custle IDE                           → Modal: version, description, links
├── Keyboard Shortcuts      Cmd/Ctrl+Shift+?   → Modal: full shortcut reference
├── ─────────────────────────────
├── GitHub Repository                          → window.open('https://github.com/...')
├── Report an Issue                            → window.open GitHub issues
├── ─────────────────────────────
└── Check Backend Status                       → GET /api/health → toast (online/offline)
```

---

## Architecture

### New Components

```
frontend/src/components/
  titlebar/
    TitleBar.tsx            ← MODIFY: wire MenuBar into existing TitleBar
    MenuBar.tsx             ← NEW: renders all 4 menus, manages open state
    MenuDropdown.tsx        ← NEW: single menu dropdown (reusable)
    AboutModal.tsx          ← NEW: About Custle IDE modal
    ShortcutsModal.tsx      ← NEW: Keyboard shortcuts reference modal
```

### New Backend Endpoint

```
GET /api/health
  Response: { status: 'ok', version: '0.1.0', uptime: number }
  Used by Help → Check Backend Status
```

### ideStore Additions

Add these actions if not already present:

```typescript
// Sidebar
setActiveSidebarPanel: (panel: 'files' | 'search' | 'git') => void;
toggleSidebar: () => void;
toggleChat: () => void;
toggleBottomPanel: () => void;

// Workspace history (for File → Open Recent)
recentWorkspaces: string[];          // last 5 workspace paths
addRecentWorkspace: (path: string) => void;

// Zoom
zoomLevel: number;                   // default 0, range -3 to +5
setZoomLevel: (level: number) => void;
```

`recentWorkspaces` and `zoomLevel` should be **persisted** (Zustand persist middleware to localStorage).

---

## Requirements

### 1. Create `frontend/src/components/titlebar/MenuDropdown.tsx`

Generic reusable dropdown component:

```typescript
interface MenuAction {
  label: string;
  shortcut?: string;           // display only, e.g. "Cmd+S"
  onClick?: () => void;
  disabled?: boolean;
  dividerAfter?: boolean;      // renders a separator after this item
  submenu?: MenuAction[];      // for "Open Recent ▶"
  icon?: React.ReactNode;
}

interface MenuDropdownProps {
  label: string;               // "File", "Edit", etc.
  items: MenuAction[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}
```

**Visual spec:**
```
┌──────────────────────────────┐
│  Open Folder...   Ctrl+Shift+O│
│  Open Recent    ▶             │
│ ──────────────────────────── │  ← divider
│  New File         Ctrl+N      │
│  Save             Ctrl+S      │  ← disabled if no active tab (grayed)
│  Save As...       Ctrl+Shft+S │
│  Save All         Ctrl+Alt+S  │
│ ──────────────────────────── │
│  Close File       Ctrl+W      │
│  Close All Files              │
│ ──────────────────────────── │
│  Quit             Cmd+Q       │
└──────────────────────────────┘
```

Styling:
- Background: `#252526` (VS Code dark)
- Item hover: `#094771` (VS Code selection blue)
- Text: `#cccccc`
- Shortcut text: `#858585` (dimmed, right-aligned)
- Disabled item: `#555555` cursor-not-allowed
- Divider: `1px solid #3c3c3c`
- Border: `1px solid #454545`
- Shadow: `0 4px 12px rgba(0,0,0,0.5)`
- Min width: `240px`
- Item padding: `4px 20px 4px 12px`
- Font size: `13px`

**Behavior:**
- Click outside → close (useEffect with document click listener)
- Escape key → close
- Only one menu open at a time (managed by MenuBar)
- Hover between menu labels while one is open → switches to hovered menu (like native app menus)

### 2. Create `frontend/src/components/titlebar/MenuBar.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import MenuDropdown from './MenuDropdown';
import { useIdeStore } from '@/store/ideStore';

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const store = useIdeStore();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Register global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Ctrl+` → toggle terminal
      if (e.key === '`' && mod) { e.preventDefault(); store.toggleBottomPanel(); }
      // Ctrl+B → toggle sidebar
      if (e.key === 'b' && mod) { e.preventDefault(); store.toggleSidebar(); }
      // Ctrl+Shift+E → explorer
      if (e.key === 'E' && mod && e.shiftKey) { e.preventDefault(); store.setActiveSidebarPanel('files'); }
      // Ctrl+Shift+G → git
      if (e.key === 'G' && mod && e.shiftKey) { e.preventDefault(); store.setActiveSidebarPanel('git'); }
      // Ctrl+Shift+F → search / find in files
      if (e.key === 'F' && mod && e.shiftKey) { e.preventDefault(); store.setActiveSidebarPanel('search'); }
      // Ctrl+N → new file
      if (e.key === 'n' && mod && !e.shiftKey) { e.preventDefault(); store.openNewUntitledTab(); }
      // Ctrl+W → close tab
      if (e.key === 'w' && mod) { e.preventDefault(); store.closeActiveTab(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [store]);

  const fileItems = buildFileMenu(store, setOpenMenu);
  const editItems = buildEditMenu(store);
  const viewItems = buildViewMenu(store, setOpenMenu);
  const helpItems = buildHelpMenu(store);

  return (
    <div className="flex items-center" style={{ position: 'relative', zIndex: 1000 }}>
      {[
        { label: 'File', items: fileItems },
        { label: 'Edit', items: editItems },
        { label: 'View', items: viewItems },
        { label: 'Help', items: helpItems },
      ].map(menu => (
        <MenuDropdown
          key={menu.label}
          label={menu.label}
          items={menu.items}
          isOpen={openMenu === menu.label}
          onToggle={() => setOpenMenu(open => open === menu.label ? null : menu.label)}
          onClose={() => setOpenMenu(null)}
        />
      ))}
    </div>
  );
}
```

### 3. File Menu — Action Implementations

**Open Folder:**
```typescript
onClick: () => { store.openFolderBrowser(); setOpenMenu(null); }
// ideStore.openFolderBrowser() sets a flag that FolderBrowser.tsx watches
```

**Open Recent submenu:**
```typescript
submenu: store.recentWorkspaces.map(path => ({
  label: path.split('/').slice(-2).join('/'), // show last 2 path segments
  onClick: () => workspaceApi.open(path).then(ws => store.setWorkspace(ws))
}))
```

**New File:**
```typescript
onClick: () => {
  store.openTab({
    id: `untitled-${Date.now()}`,
    path: null,
    name: 'Untitled',
    content: '',
    language: 'plaintext',
    isDirty: false,
    isUntitled: true,
  });
}
```

**Save / Save As / Save All:** call existing `filesApi.writeFile()` on active/all tabs.

**Close File / Close All:** call existing `store.closeTab()` / `store.closeAllTabs()`.

### 4. Edit Menu — Monaco Trigger Implementations

Monaco editor actions are triggered via the editor instance. Store the editor reference:

```typescript
// In ideStore or editorRef:
monacoEditor: monaco.editor.IStandaloneCodeEditor | null;
setMonacoEditor: (editor: monaco.editor.IStandaloneCodeEditor) => void;
```

Then in menu actions:
```typescript
// Undo
onClick: () => store.monacoEditor?.trigger('menu', 'undo', null)

// Redo  
onClick: () => store.monacoEditor?.trigger('menu', 'redo', null)

// Find
onClick: () => store.monacoEditor?.trigger('menu', 'actions.find', null)

// Replace
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.startFindReplaceAction', null)

// Select All
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.selectAll', null)

// Toggle Comment
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.commentLine', null)

// Format Document
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.formatDocument', null)

// Cut / Copy / Paste — use document.execCommand (deprecated but works for menus)
// or navigator.clipboard APIs
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.clipboardCutAction', null)
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.clipboardCopyAction', null)
onClick: () => store.monacoEditor?.trigger('menu', 'editor.action.clipboardPasteAction', null)
```

**Disabled state:** Edit actions disabled when `store.monacoEditor === null` (no file open).

### 5. View Menu — Panel Toggle Implementations

```typescript
// All call ideStore actions:
Explorer:  store.setActiveSidebarPanel('files'); store.setSidebarOpen(true);
Search:    store.setActiveSidebarPanel('search'); store.setSidebarOpen(true);
Git:       store.setActiveSidebarPanel('git'); store.setSidebarOpen(true);

Toggle Sidebar:  store.toggleSidebar()
Toggle Chat:     store.toggleChat()
Toggle Terminal: store.toggleBottomPanel()
New Terminal:    store.addTerminalTab()

// Zoom
Zoom In:  store.setZoomLevel(store.zoomLevel + 1)
Zoom Out: store.setZoomLevel(store.zoomLevel - 1)
Reset:    store.setZoomLevel(0)
```

**Zoom implementation:**
```typescript
// In ideStore — when zoomLevel changes:
useEffect(() => {
  const scale = 1 + (zoomLevel * 0.1);  // each step = 10% size change
  document.documentElement.style.fontSize = `${scale * 100}%`;
}, [zoomLevel]);
```

### 6. Create `frontend/src/components/titlebar/AboutModal.tsx`

```
┌────────────────────────────────────────┐
│                                   [✕]  │
│         🧠  Custle IDE                  │
│         Version 0.1.0                  │
│                                        │
│  AI-powered local IDE with             │
│  Monaco editor, real terminal,         │
│  Git integration, and AI agent.        │
│                                        │
│  Backend:  http://localhost:3001  ✅   │
│  Frontend: http://localhost:3000       │
│                                        │
│  Built with Next.js, TypeScript,       │
│  Monaco Editor, xterm.js              │
│                            [Close]     │
└────────────────────────────────────────┘
```

Checks backend health on open: `GET /api/health` → shows ✅ or ❌.

### 7. Create `frontend/src/components/titlebar/ShortcutsModal.tsx`

Full keyboard shortcut reference, organized by category:

```
┌──────────────────────────────────────────────────┐
│  Keyboard Shortcuts                         [✕]  │
├──────────────────────────────────────────────────┤
│  General                                         │
│  Open Folder          Ctrl+Shift+O               │
│  New File             Ctrl+N                     │
│  Save                 Ctrl+S                     │
│  Save As              Ctrl+Shift+S               │
│  Close File           Ctrl+W                     │
├──────────────────────────────────────────────────┤
│  Panels                                          │
│  Toggle Sidebar       Ctrl+B                     │
│  Toggle Terminal      Ctrl+`                     │
│  Toggle Chat          Ctrl+Shift+C               │
│  Explorer             Ctrl+Shift+E               │
│  Git                  Ctrl+Shift+G               │
│  Search               Ctrl+Shift+F               │
├──────────────────────────────────────────────────┤
│  Editor                                          │
│  Find                 Ctrl+F                     │
│  Find & Replace       Ctrl+H                     │
│  Select All           Ctrl+A                     │
│  Toggle Comment       Ctrl+/                     │
│  Format Document      Shift+Alt+F                │
│  Undo                 Ctrl+Z                     │
│  Redo                 Ctrl+Shift+Z               │
├──────────────────────────────────────────────────┤
│  Terminal                                        │
│  New Terminal         Ctrl+Shift+`               │
└──────────────────────────────────────────────────┘
```

### 8. Modify `frontend/src/components/titlebar/TitleBar.tsx`

Replace static menu labels with `<MenuBar />`:

```typescript
// Before (static):
<span>File</span>
<span>Edit</span>
<span>View</span>
<span>Help</span>

// After (functional):
import MenuBar from './MenuBar';

// In TitleBar JSX:
<div className="flex items-center gap-1">
  <span className="font-semibold text-sm mr-4">🧠 NeuralIDE</span>
  <MenuBar />
</div>
```

### 9. Add `GET /api/health` to backend

In `backend/src/index.ts`, add before other routes:

```typescript
const startTime = Date.now();

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    workspace: workspaceService.getWorkspacePath() || null,
  });
});
```

---

## Expected Outputs

```
backend/
  src/
    index.ts                   ← MODIFY: add GET /api/health

frontend/
  src/
    components/
      titlebar/
        TitleBar.tsx           ← MODIFY: replace static labels with <MenuBar />
        MenuBar.tsx            ← NEW: all 4 menus, keyboard shortcuts registration
        MenuDropdown.tsx       ← NEW: reusable dropdown component
        AboutModal.tsx         ← NEW: About dialog with backend health check
        ShortcutsModal.tsx     ← NEW: keyboard shortcut reference modal
    store/
      ideStore.ts              ← MODIFY: add recentWorkspaces, zoomLevel,
                                          monacoEditor ref, openFolderBrowser flag,
                                          openNewUntitledTab(), closeActiveTab()
```

---

## Test Criteria

| # | Scenario | Type | Expected |
|---|----------|------|----------|
| 1 | Health endpoint | curl | GET /api/health → `{ status: "ok", version, uptime }` |
| 2 | File menu opens | Playwright | Click "File" → dropdown visible with all items |
| 3 | Edit menu opens | Playwright | Click "Edit" → dropdown visible |
| 4 | View menu opens | Playwright | Click "View" → dropdown visible |
| 5 | Help menu opens | Playwright | Click "Help" → dropdown visible |
| 6 | Only one menu at a time | Playwright | Open File, click Edit → File closes, Edit opens |
| 7 | Close on outside click | Playwright | Open menu, click elsewhere → menu closes |
| 8 | Close on Escape | Playwright | Open menu, press Escape → menu closes |
| 9 | Toggle sidebar via View | Playwright | View → Toggle Sidebar → sidebar hides/shows |
| 10 | Toggle terminal via View | Playwright | View → Toggle Terminal → terminal panel hides/shows |
| 11 | Keyboard shortcut Ctrl+B | Playwright | Press Ctrl+B → sidebar toggles |
| 12 | Keyboard shortcut Ctrl+` | Playwright | Press Ctrl+` → terminal toggles |
| 13 | Help → About modal | Playwright | Click Help → About → modal appears with version |
| 14 | Help → Keyboard Shortcuts | Playwright | Click Help → Keyboard Shortcuts → modal with table |
| 15 | Help → Check Backend Status | Playwright | Click → toast shows "Backend online ✅" |

---

## Critical Notes

### Monaco Editor Ref
The edit menu requires a reference to the Monaco editor instance. Store it in `ideStore` via `setMonacoEditor()`. Call this from `MonacoEditor.tsx` on `onMount` callback:
```typescript
editor.onMount={(editorInstance) => {
  store.setMonacoEditor(editorInstance);
}}
```

### Shortcut Conflicts with Monaco
Monaco handles `Ctrl+F`, `Ctrl+S` etc internally. The `MenuBar` global listener should use `e.preventDefault()` only for shortcuts NOT already handled by Monaco (panel toggles, sidebar switches). Do NOT preventDefault on `Ctrl+F` when editor is focused — let Monaco handle it.

### z-index Layering
Menu dropdowns must render above everything including Monaco editor and the sidebar. Use `z-index: 1000` on the dropdown container. Monaco's internal elements use z-index ~50.

### Cmd vs Ctrl
Display `Cmd` on macOS, `Ctrl` on Windows/Linux:
```typescript
const mod = navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl';
```

### No Form Tags
Do NOT use `<form>` elements — use `<button onClick>` for all menu items per project rules.

---

## Common Issues & Solutions

| Issue | Solution |
|-------|---------|
| Dropdown renders behind Monaco | Set `z-index: 1000` + `position: relative` on MenuBar wrapper |
| Keyboard shortcut fires twice | Check listener cleanup in useEffect return |
| Monaco triggers not working | Confirm `monacoEditor` ref is set in `ideStore` before calling |
| Submenu "Open Recent" is empty | Check `recentWorkspaces` is being populated on workspace open |
| Click outside not working | Use `mousedown` not `click` — avoids the same-click-that-opened firing close |