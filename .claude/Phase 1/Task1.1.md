📄 Task 1.1 — Monorepo Scaffold & Backend Server
=========================================

🎯 Objective
------------
Create the monorepo structure with a Next.js frontend and an Express
backend server that runs locally, giving the browser access to the real
file system, terminal, and git.

📂 File Locations
=================
```shell
package.json                          ← root workspace
frontend/package.json
frontend/next.config.ts
frontend/src/app/layout.tsx
frontend/src/app/globals.css
frontend/src/app/page.tsx
backend/package.json
backend/tsconfig.json
backend/src/index.ts
backend/src/config.ts
backend/src/types.ts
.env.example
.gitignore
```

1️⃣ Monorepo Setup
==================
```bash
mkdir neural-ide && cd neural-ide
npm init -y

# Root package.json workspaces:
{
  "name": "neural-ide",
  "private": true,
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
    "build": "npm run build -w backend && npm run build -w frontend"
  }
}

# Install root dev deps:
npm install -D concurrently
```

2️⃣ Backend Setup
=================
```bash
mkdir backend && cd backend
npm init -y
npm install express cors ws node-pty simple-git chokidar uuid dotenv axios
npm install -D typescript @types/express @types/cors @types/ws @types/node \
  @types/uuid ts-node-dev
```

### backend/src/config.ts
```typescript
export const config = {
  PORT: process.env.PORT ?? 3001,
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  // Model config — overrideable at runtime via API
  DEFAULT_MODEL_URL: process.env.MODEL_URL ?? 'http://localhost:18000',
  DEFAULT_MODEL_NAME: process.env.MODEL_NAME ?? 'Qwen3-Coder-30B-A3B',
  DEFAULT_MODEL_KEY: process.env.MODEL_API_KEY ?? '',
};
```

### backend/src/index.ts
Bootstrap Express with:
- CORS configured for frontend URL
- JSON body parser, 50mb limit
- WebSocket server attached to same HTTP server
- Mount routers: /api/files, /api/git, /api/terminal, /api/model, /api/workspace
- On start: print "NeuralIDE backend running on port 3001"

3️⃣ Frontend Setup
==================
```bash
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir \
  --no-eslint --import-alias "@/*"
npm install zustand axios lucide-react react-resizable-panels \
  @monaco-editor/react react-markdown remark-gfm rehype-highlight \
  @xterm/xterm @xterm/addon-fit @xterm/addon-web-links uuid @types/uuid
```

### frontend/.env.local
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

4️⃣ Shared Types — backend/src/types.ts
========================================
```typescript
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;          // absolute path on disk
  relativePath: string;  // relative to workspace root
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
```

🧪 Test Scenarios
=================

### Scenario 1: Backend starts
- Run `npm run dev` from root
- Expected: "NeuralIDE backend running on port 3001" in console

### Scenario 2: Frontend starts
- Expected: localhost:3000 loads without errors

### Scenario 3: CORS works
- Expected: No CORS errors in browser console when frontend fetches backend

🔒 Non-Functional Requirements
===============================
- Backend must use TypeScript with strict mode
- node-pty requires native compilation — document this in README

✅ Deliverable
==============
```shell
Both servers start with npm run dev, no errors
```
📊 Acceptance Criteria
======================
- [ ] `npm run dev` starts both servers
- [ ] Backend on :3001, frontend on :3000
- [ ] No TypeScript errors in either
- [ ] CORS configured correctly

⏱️ Estimated Duration: 20-30 minutes
🔗 Dependencies: None
🔗 Blocks: All tasks