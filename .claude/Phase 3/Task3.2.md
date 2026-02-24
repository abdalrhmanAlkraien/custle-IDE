📄 Task 3.2 — AI Chat & Agent Panel
=========================================

🎯 Objective
------------
Build the full AI panel with two modes: Chat (conversation with context)
and Agent (autonomous mode with full file system + terminal access).
Agent can read/write files, run terminal commands, and complete multi-step tasks.

📂 File Locations
=================
```shell
backend/src/services/agentService.ts
backend/src/routes/agent.ts
frontend/src/components/chat/ChatPanel.tsx
frontend/src/components/chat/ChatMessage.tsx
frontend/src/components/chat/ChatInput.tsx
frontend/src/components/chat/AgentStepCard.tsx
frontend/src/lib/api/chatApi.ts
```

1️⃣ Agent Tools (backend) — agentService.ts
============================================
The agent has access to these tools via function calling:
```typescript
const AGENT_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    parameters: { path: 'string' }
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates if not exists)',
    parameters: { path: 'string', content: 'string' }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    parameters: { path: 'string' }
  },
  {
    name: 'run_terminal',
    description: 'Run a shell command and return output',
    parameters: { command: 'string', cwd: 'string' }
  },
  {
    name: 'search_files',
    description: 'Search for text across all files in workspace',
    parameters: { query: 'string' }
  },
  {
    name: 'create_file',
    description: 'Create a new file or folder',
    parameters: { path: 'string', type: 'file | folder' }
  },
  {
    name: 'delete_file',
    description: 'Delete a file or folder',
    parameters: { path: 'string' }
  },
];
```

Agent loop (backend /api/agent/run, streaming SSE):
```shell
Send user message + tools to model
Model returns tool_calls OR text
If tool_calls: execute each tool, append results, loop back to step 1
If text (no tool calls): stream final response to client
Max 20 iterations, then force stop
Stream each step as SSE: tool calls, results, thinking, final response
```

2️⃣ System Prompts
==================

**Chat mode system prompt:**
```shell
You are NeuralIDE's AI coding assistant. You are precise, concise, and expert.
Format all code in markdown code blocks with language tags.
Current workspace: {workspacePath}
Active file: {activeFilePath}
Active file content:
{activeFileContent (first 3000 chars)}
```
**Agent mode system prompt:**
```shell
You are NeuralIDE's autonomous coding agent. You have full access to the
file system and terminal. Complete the user's task by using your tools.
Rules:

Always read files before modifying them
Run tests after making changes when possible
Explain what you're doing at each step
Ask for clarification only if truly ambiguous
Workspace root: {workspacePath}

Available tools: read_file, write_file, list_files, run_terminal,
search_files, create_file, delete_file
```

3️⃣ ChatPanel.tsx
=================
Header:
- "AI Assistant" title
- Mode toggle: [Chat] [Agent] pill switcher
- [🗑 Clear] button
- [⚙ Context] button (toggle file context on/off)

Messages list:
- Scrollable, auto-scroll to bottom
- User messages: right-aligned, bg var(--bg-3)
- Assistant messages: left-aligned, bg accent-glow
- Code blocks: syntax highlighted + copy button + "Insert at cursor" button

Agent step cards (AgentStepCard.tsx):
- Collapsible card per tool call
- Shows: tool icon + tool name + args summary
- Expand: full args + result
- Status: pending (spinner) / success (green ✓) / error (red ✗)
- Examples:
```shell
▶ 📖 read_file — src/app.ts                    [✓ 847 chars]
▶ 🖊 write_file — src/app.ts                   [✓ saved]
▶ 💻 run_terminal — npm test                   [✓ 3 passed]
```

4️⃣ ChatInput.tsx
=================
- Textarea, auto-grows to 150px max
- Enter sends, Shift+Enter newline
- In Agent mode: show orange border + "Agent Mode" badge
- Toolbar:
    - 📎 Attach file (adds file content to context)
    - @ mention file (type @filename, autocomplete from file tree)
    - Stop button (appears while streaming, cancels request)
- Keyboard: ↑ arrow = recall last message

🧪 Test Scenarios
=================

### Scenario 1: Chat with context
- Open a TypeScript file, switch to chat, ask "What does this file do?"
- Expected: Accurate explanation referencing actual code

### Scenario 2: Streaming response
- Ask a question
- Expected: Response streams word by word, not all at once

### Scenario 3: Agent creates file
- Switch to Agent mode, ask "Create a React Button component in src/components/"
- Expected: Agent calls read_file (check if exists), write_file (create component),
  file appears in tree, agent reports completion

### Scenario 4: Agent runs command
- Ask "Run the tests and tell me if they pass"
- Expected: Agent calls run_terminal with "npm test", shows output, reports results

### Scenario 5: Agent multi-step task
- Ask "Refactor all console.log statements to use a logger utility"
- Expected: Agent searches files, reads each, edits, reports summary

### Scenario 6: Stop generation
- Start a long response, click Stop
- Expected: Response stops immediately, input re-enabled

### Scenario 7: Code block insert
- Get code in response, click "Insert at cursor"
- Expected: Code inserted at Monaco cursor position

🔒 Non-Functional Requirements
===============================
- Agent max iterations: 20 (prevent infinite loops)
- Agent must never access paths outside workspace root
- Streaming must use SSE (Server-Sent Events)
- Chat history max 100 messages (trim oldest)

✅ Deliverable
==============
```shell
Full Chat + Agent panel with streaming, tool calls, and step visualization
```

📊 Acceptance Criteria
======================
- [ ] Chat mode streams correctly
- [ ] Agent mode executes tool calls and shows step cards
- [ ] File read/write via agent reflects on disk
- [ ] Terminal commands via agent return real output
- [ ] Stop button cancels generation
- [ ] Code insert button works
- [ ] No TypeScript errors

⏱️ Estimated Duration: 90-120 minutes
🔗 Dependencies: Task 3.1, Task 2.1
🔗 Blocks: Nothing (can be enhanced later)