# Custle IDE

AI-Powered Local Code Editor built with Next.js and Express.

## Features (Planned)

- 📁 **File System Access** - Browse and edit local files
- 💻 **Integrated Terminal** - Real shell access via node-pty
- 🤖 **AI Assistant** - Chat and autonomous agent modes
- ✨ **Smart Autocomplete** - Context-aware code suggestions
- 🔀 **Git Integration** - Built-in version control
- 🎨 **Monaco Editor** - Full-featured code editing

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- WebSocket (ws) for real-time communication
- node-pty for terminal emulation
- simple-git for git operations
- chokidar for file watching

**Frontend:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Zustand (state management)
- Monaco Editor (code editing)
- xterm.js (terminal UI)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

**macOS:**
```bash
xcode-select --install  # Required for node-pty compilation
```

**Linux:**
```bash
sudo apt-get install -y make python3 g++ build-essential
```

### Installation

```bash
# Install dependencies
npm install

# Start development servers (backend + frontend)
npm run dev
```

The IDE will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Build for Production

```bash
# Build both backend and frontend
npm run build

# Run production build
npm run start:backend  # Terminal 1
npm run start:frontend # Terminal 2
```

## Project Structure

```
custle-ide/
├── backend/          # Express API server
│   ├── src/
│   │   ├── index.ts      # Server entry point
│   │   ├── config.ts     # Configuration
│   │   └── types.ts      # Shared types
│   └── package.json
├── frontend/         # Next.js application
│   ├── src/
│   │   └── app/          # App Router pages
│   └── package.json
├── doc/              # Documentation
└── package.json      # Workspace root
```

## Development Status

**Current Phase:** Task 1.1 - Monorepo Scaffold ✓

See `.claude/systemTasks.md` for detailed progress tracking.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend
PORT=3001
FRONTEND_URL=http://localhost:3000

# AI Model (optional - can configure via UI)
MODEL_URL=http://localhost:18000
MODEL_NAME=Qwen3-Coder-30B-A3B
MODEL_API_KEY=
```

## Troubleshooting

### node-pty Installation Issues

If node-pty fails to install:

```bash
cd backend
npm rebuild node-pty

# Or build from source
npm install --build-from-source node-pty
```

### Port Already in Use

Change ports in `.env`:
```bash
PORT=3002  # Backend port
```

And update `frontend/.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3002
```

## License

MIT

## Contributing

This project is currently in active development. Contributions welcome!
