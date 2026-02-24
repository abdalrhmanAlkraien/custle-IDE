📄 Task 6.1 — AI Inline Autocomplete
=========================================

🎯 Objective
------------
Register a Monaco inline completion provider that calls the model via
backend proxy with smart debouncing, prefix/suffix context, and
language-aware prompting.

📂 File Locations
=================
```shell
backend/src/routes/completion.ts
frontend/src/lib/completionProvider.ts
frontend/src/components/editor/MonacoEditor.tsx  ← update
```

1️⃣ Backend Completion Route — /api/completion
===============================================
```shell
POST /api/completion
Body: { prefix: string, suffix: string, language: string, filePath: string }
Returns: { completion: string }

Max 150 output tokens
Temperature 0.1
Stop sequences: ["\n\n", "```", "//", "/*"]
System prompt:
"You are a code completion engine. Complete the code at the cursor.
Output ONLY the completion text. No explanation. No markdown.
Language: {language}. Match the surrounding code style exactly."
```

2️⃣ completionProvider.ts
=========================
```typescript
// Debounce: 700ms
// Context: 50 lines before cursor, 10 lines after
// Register as InlineCompletionsProvider for all languages
// On accept: log to store (for stats)
// On dismiss: log to store
// Cancel pending request if user types before response arrives (AbortController)
```

3️⃣ StatusBar indicator
========================
Add "AI ✦" in status bar that:
- Pulses when fetching completion
- Shows green when last completion was accepted
- Shows dim when idle

🧪 Test Scenarios
=================

### Scenario 1: Completion triggers
- Type "function calculateT" and pause 700ms
- Expected: Ghost text suggests "otal(items: Item[]): number {"

### Scenario 2: Accept with Tab
- Ghost text visible, press Tab
- Expected: Completion inserted

### Scenario 3: Debounce
- Type rapidly for 2 seconds
- Expected: Only 1 API call in vLLM logs after typing stops

### Scenario 4: AbortController
- Start completion, type more before response
- Expected: Previous request cancelled, new one starts

🔒 Non-Functional Requirements
===============================
- Debounce minimum 700ms
- Must use AbortController to cancel in-flight requests
- Max 150 tokens per completion to keep latency under 2s

✅ Deliverable
==============
```shell
AI inline completions working in Monaco via backend proxy
```

📊 Acceptance Criteria
======================
- [ ] Ghost text appears after pause
- [ ] Tab accepts completion
- [ ] Debounce works (verified in logs)
- [ ] Status bar indicator works
- [ ] No TypeScript errors

⏱️ Estimated Duration: 45-60 minutes
🔗 Dependencies: Task 2.3, Task 3.1
🔗 Blocks: Task 6.2