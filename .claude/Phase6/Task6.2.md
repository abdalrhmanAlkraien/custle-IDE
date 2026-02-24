📄 Task 6.2 — Polish, Keyboard Shortcuts & Settings
=========================================

🎯 Objective
------------
Wire all keyboard shortcuts, build the settings panel, add command
palette, toasts/notifications, and fix all remaining UI rough edges.

📂 File Locations
=================
```shell
frontend/src/components/modals/CommandPalette.tsx
frontend/src/components/modals/SettingsModal.tsx
frontend/src/components/ui/Toast.tsx
frontend/src/components/ui/ConfirmDialog.tsx
frontend/src/hooks/useKeyboard.ts
frontend/src/hooks/useToast.ts
```
1️⃣ Keyboard Shortcuts — useKeyboard.ts
========================================
Register globally in IDEShell:
```shell
Ctrl+P          → Open CommandPalette
Ctrl+Shift+P    → Open CommandPalette (command mode)
Ctrl+B          → Toggle sidebar
Ctrl+J          → Toggle bottom panel
Ctrl+\          → Toggle chat panel
Ctrl+`          → Focus terminal
Ctrl+S          → Save active file
Ctrl+Shift+S    → Save all files
Ctrl+W          → Close active tab
Ctrl+Shift+W    → Close all tabs
Ctrl+Tab        → Next tab
Ctrl+Shift+Tab  → Previous tab
Ctrl+,          → Open settings
Escape          → Close any open modal
```
2️⃣ CommandPalette.tsx
======================
VS Code-style command palette:
- Fuzzy search across: open files (Ctrl+P mode) + commands (> mode)
- Commands list: all keyboard shortcut actions
- File search: shows matching files from file tree
- Arrow keys navigate, Enter selects, Escape closes
- Recent files shown when empty

3️⃣ Toast.tsx
=============
Lightweight toast system (no library):
- Position: bottom-right
- Types: success (green), error (red), info (blue), warning (yellow)
- Auto-dismiss: 3 seconds
- Max 3 visible at once
- Slide-in animation from right
- Click to dismiss early

4️⃣ SettingsModal.tsx
=====================
Sections:
- **Editor**: Font size, font family, tab size, word wrap, minimap, line numbers
- **Theme**: Color theme selector (neural-dark only for now, extensible)
- **AI**: Default temperature, max tokens, autocomplete on/off, debounce delay
- **Terminal**: Font size, shell path
- **Keybindings**: Display all shortcuts (read-only for MVP)
  All settings persist to localStorage via zustand/persist.

🧪 Test Scenarios
=================

### Scenario 1: Command palette
- Press Ctrl+P
- Expected: Palette opens, typing filters files instantly

### Scenario 2: All keyboard shortcuts work
- Test each shortcut from the list above
- Expected: All shortcuts trigger correct action

### Scenario 3: Toast on save
- Press Ctrl+S on a dirty file
- Expected: Green "Saved" toast appears bottom-right, auto-dismisses

### Scenario 4: Settings persist
- Change font size to 16 in settings, reload page
- Expected: Font size is still 16

🔒 Non-Functional Requirements
===============================
- Keyboard shortcuts must not conflict with browser defaults
- Command palette must open in < 50ms
- Settings changes must apply immediately (no page reload)

✅ Deliverable
==============
```shell
Fully polished IDE with all shortcuts, command palette, toasts, settings
```

📊 Acceptance Criteria
======================
- [ ] All keyboard shortcuts work
- [ ] Command palette opens and searches correctly
- [ ] Toasts appear for save, errors, copy
- [ ] Settings persist across reloads
- [ ] No TypeScript errors
- [ ] No console errors in any scenario

⏱️ Estimated Duration: 60-75 minutes
🔗 Dependencies: All previous tasks
🔗 Blocks: Nothing — completes the IDE

