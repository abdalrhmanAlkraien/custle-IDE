📄 Task 2.2 — File Explorer Sidebar
=========================================

🎯 Objective
------------
Build the file explorer that shows the real local file tree, supports
full CRUD operations, drag & drop, context menu, and live updates
from the file watcher WebSocket.

📂 File Locations
=================
```shell
frontend/src/components/sidebar/Sidebar.tsx
frontend/src/components/sidebar/FileTree.tsx
frontend/src/components/sidebar/FileTreeItem.tsx
frontend/src/components/sidebar/SearchPanel.tsx
frontend/src/components/sidebar/WorkspaceSelector.tsx
frontend/src/lib/api/filesApi.ts
frontend/src/lib/fileIcons.ts
frontend/src/hooks/useFileWatcher.ts
frontend/src/hooks/useFileTree.ts
```

1️⃣ filesApi.ts
===============
```typescript
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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

2️⃣ useFileWatcher.ts
=====================
```typescript
// Connect to WS at NEXT_PUBLIC_BACKEND_URL (replace http with ws)
// On 'tree:refresh': call refetchTree()
// On 'file:change': if file is open in a tab, re-read and update content
// Auto-reconnect on disconnect with exponential backoff
```

3️⃣ WorkspaceSelector.tsx
=========================
Shown when no workspace is open:
- Large centered card: "Open a Folder to Start"
- Input field for folder path + "Open" button
- Recent workspaces list (last 5, stored in localStorage)
- Clicking recent workspace opens it directly

4️⃣ FileTreeItem.tsx
====================
- Folder: chevron (▶/▼) + folder icon + name + item count badge
    - Click: toggle expand/collapse (persist open state in store)
    - Right-click: context menu
- File: language icon + name + git status badge (M/A/D/?)
    - Click: open file in editor via readFile API → openTab in store
    - Right-click: context menu
- Inline rename: double-click name → input field → Enter to save → call renameFile API
- Context menu items:
    - New File (in this folder)
    - New Folder (in this folder)
    - Rename
    - Delete (with confirmation dialog)
    - Copy Path
    - Reveal in Finder/Explorer

5️⃣ SearchPanel.tsx
===================
- Input with debounce 400ms → call searchFiles API
- Results: grouped by file, show filename + relative path
- Each match: line number + highlighted line content (bold the match)
- Click match: open file in editor + scroll to that line
- "X results in Y files" count
- Case sensitive / regex toggle buttons
- Empty state: "Type to search across all files"

🧪 Test Scenarios
=================

### Scenario 1: Open workspace
- Enter a local folder path in WorkspaceSelector
- Expected: File tree loads showing real folder structure

### Scenario 2: Open file
- Click any file in tree
- Expected: File opens in Monaco editor with real content

### Scenario 3: Create file
- Right-click folder → New File → type name → Enter
- Expected: File created on disk, appears in tree immediately

### Scenario 4: Rename file
- Double-click filename → type new name → Enter
- Expected: File renamed on disk, tree updates

### Scenario 5: Delete file
- Right-click → Delete → confirm
- Expected: File deleted on disk, removed from tree,
  tab closed if open

### Scenario 6: External file change
- Edit a file in another editor
- Expected: Tree shows M badge, open tab content updates within 1 second

### Scenario 7: Search
- Type "useState" in search panel
- Expected: All occurrences shown with file and line number

🔒 Non-Functional Requirements
===============================
- File tree must handle 1000+ files without freezing (virtualize if needed)
- Delete must show confirmation dialog before deleting
- Rename must validate: no empty name, no path separators

✅ Deliverable
==============
```shell
Full working file explorer connected to real local file system
```
📊 Acceptance Criteria
======================
- [ ] Open workspace loads real files
- [ ] CRUD operations work and reflect on disk
- [ ] External changes auto-update in UI
- [ ] Search returns real results
- [ ] Context menu all items functional
- [ ] No TypeScript errors

⏱️ Estimated Duration: 75-90 minutes
🔗 Dependencies: Task 2.1, Task 1.2
🔗 Blocks: Task 2.3