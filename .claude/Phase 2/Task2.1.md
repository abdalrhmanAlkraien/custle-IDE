📄 Task 2.1 — Backend File System API
=========================================

🎯 Objective
------------
Build the backend REST API that gives the frontend full read/write access
to real files on the local machine, plus a file watcher via WebSocket
that pushes changes in real time.

📂 File Locations
=================
```shell
backend/src/routes/files.ts
backend/src/routes/workspace.ts
backend/src/services/fileService.ts
backend/src/services/watcherService.ts
backend/src/websocket/wsServer.ts
```

1️⃣ Workspace API — /api/workspace
====================================
```shell
GET  /api/workspace          → returns current workspace {path, name} or null
POST /api/workspace/open     → body: {path: string} → sets workspace root,
returns full FileNode tree
POST /api/workspace/close    → clears workspace
GET  /api/workspace/tree     → returns full FileNode tree of current workspace
```

Rules for tree building:
- Ignore: node_modules, .git (show git folder separately), dist, build,
  __pycache__, .DS_Store, *.pyc, .next, coverage
- Max depth: 8 levels
- Sort: folders first, then files, both alphabetically

2️⃣ File API — /api/files
==========================
```shell
GET    /api/files/read?path=<abs>      → returns {content, language, size, modified}
POST   /api/files/write                → body: {path, content} → writes file, returns {success}
POST   /api/files/create               → body: {path, type: 'file'|'folder'} → creates
DELETE /api/files/delete               → body: {path} → deletes file or folder recursively
POST   /api/files/rename               → body: {oldPath, newPath} → renames/moves
GET    /api/files/search?q=&root=      → searches file contents, returns matches
```

3️⃣ fileService.ts
==================
```typescript
import fs from 'fs/promises';
import path from 'path';

// readFile: read with encoding detection, return content + metadata
// writeFile: atomic write (write to tmp, then rename)
// createFile/Folder: with parent dir creation
// deleteFile: recursive for folders
// searchFiles: walk all non-ignored files, regex search content
//   return: { path, relativePath, matches: [{line, content, lineNumber}] }
// buildTree: recursive FileNode builder with ignore list
```

4️⃣ watcherService.ts — Real-time file watching
================================================
```typescript
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';

// Watch workspace root with chokidar
// On file add/change/delete: broadcast to all connected WS clients:
// { type: 'file:change', event: 'add'|'change'|'unlink', path: string }
// On folder add/delete:
// { type: 'tree:refresh' }  ← frontend re-fetches tree
```

5️⃣ wsServer.ts
===============
```typescript
// WebSocket message types:
// CLIENT → SERVER:
//   { type: 'terminal:input', sessionId: string, data: string }
//   { type: 'terminal:resize', sessionId: string, cols: number, rows: number }
//   { type: 'ping' }
//
// SERVER → CLIENT:
//   { type: 'terminal:output', sessionId: string, data: string }
//   { type: 'file:change', event: string, path: string }
//   { type: 'tree:refresh' }
//   { type: 'pong' }
```

🧪 Test Scenarios
=================

### Scenario 1: Open workspace
```bash
curl -X POST http://localhost:3001/api/workspace/open \
  -H "Content-Type: application/json" \
  -d '{"path": "/Users/yourname/projects/test-project"}'
```
Expected: Full file tree returned as JSON

### Scenario 2: Read file
```bash
curl "http://localhost:3001/api/files/read?path=/Users/yourname/projects/test-project/README.md"
```
Expected: {content: "...", language: "markdown", ...}

### Scenario 3: Write file
```bash
curl -X POST http://localhost:3001/api/files/write \
  -H "Content-Type: application/json" \
  -d '{"path": "/tmp/test.ts", "content": "const x = 1;"}'
```
Expected: {success: true}, file exists on disk

### Scenario 4: File watcher
- Open workspace, then edit a file externally (e.g. in VS Code)
- Expected: WebSocket message received by frontend within 300ms

### Scenario 5: Search
```bash
curl "http://localhost:3001/api/files/search?q=useState&root=/path/to/project"
```
Expected: List of files and line matches

🔒 Non-Functional Requirements
===============================
- NEVER allow path traversal outside workspace root — validate all paths
- Atomic writes to prevent file corruption
- Watcher must be stopped when workspace closes

✅ Deliverable
==============
```shell
Full file system REST API + WebSocket file watcher
```

📊 Acceptance Criteria
======================
- [ ] All 10 endpoints return correct responses
- [ ] Path traversal attack returns 403
- [ ] File watcher sends events within 500ms of change
- [ ] Search works across all text files
- [ ] No TypeScript errors

⏱️ Estimated Duration: 60-75 minutes
🔗 Dependencies: Task 1.1
🔗 Blocks: Task 2.2, Task 2.3
