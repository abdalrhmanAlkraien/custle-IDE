📄 Task 2.3 — Monaco Editor + Tabs + Save
=========================================

🎯 Objective
------------
Full Monaco editor with custom theme, tab management, keyboard shortcuts,
and Ctrl+S save that writes to the real file system via the backend API.

📂 File Locations
=================
```shell
frontend/src/components/editor/EditorArea.tsx
frontend/src/components/editor/EditorTabs.tsx
frontend/src/components/editor/MonacoEditor.tsx
frontend/src/components/editor/EditorPlaceholder.tsx
frontend/src/lib/languageMap.ts
frontend/src/lib/monacoTheme.ts
```
1️⃣ monacoTheme.ts — "neural-dark"
====================================
```typescript
export const neuralDarkTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '55556b', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '55556b', fontStyle: 'italic' },
    { token: 'keyword', foreground: '7b68ee', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'ff79c6' },
    { token: 'string', foreground: '50fa7b' },
    { token: 'string.template', foreground: '50fa7b' },
    { token: 'number', foreground: 'ffb86c' },
    { token: 'type', foreground: '8be9fd' },
    { token: 'class', foreground: '8be9fd' },
    { token: 'function', foreground: 'bd93f9' },
    { token: 'variable', foreground: 'eeeef5' },
    { token: 'variable.parameter', foreground: 'ffb86c' },
    { token: 'operator', foreground: 'ff79c6' },
    { token: 'delimiter', foreground: '9999bb' },
  ],
  colors: {
    'editor.background': '#0d0d14',
    'editor.foreground': '#eeeef5',
    'editor.lineHighlightBackground': '#16161f',
    'editor.lineHighlightBorder': '#00000000',
    'editor.selectionBackground': '#3d358040',
    'editor.inactiveSelectionBackground': '#3d358020',
    'editorLineNumber.foreground': '#2a2a3d',
    'editorLineNumber.activeForeground': '#9999bb',
    'editorCursor.foreground': '#7b68ee',
    'editorCursor.background': '#0d0d14',
    'editor.findMatchBackground': '#3d358060',
    'editor.findMatchHighlightBackground': '#3d358030',
    'editorGutter.background': '#0d0d14',
    'editorIndentGuide.background': '#2a2a3d',
    'editorIndentGuide.activeBackground': '#3d3d58',
    'editorBracketMatch.background': '#3d358040',
    'editorBracketMatch.border': '#7b68ee',
    'editorWidget.background': '#16161f',
    'editorWidget.border': '#2a2a3d',
    'editorSuggestWidget.background': '#16161f',
    'editorSuggestWidget.border': '#2a2a3d',
    'editorSuggestWidget.selectedBackground': '#3d358040',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#2a2a3d80',
    'scrollbarSlider.hoverBackground': '#3d3d58',
    'scrollbarSlider.activeBackground': '#7b68ee60',
  }
};
```

2️⃣ MonacoEditor.tsx
====================
Dynamic import (ssr: false). Editor options:
```typescript
{
  theme: 'neural-dark',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  fontLigatures: true,
  lineHeight: 1.65,
  letterSpacing: 0.5,
  minimap: { enabled: true, scale: 1, renderCharacters: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'off',
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  padding: { top: 16, bottom: 16 },
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
  inlineSuggest: { enabled: true },
  quickSuggestions: { other: true, comments: false, strings: false },
}
```

On mount (handleEditorMount):
1. Define and set neural-dark theme
2. Register Ctrl+S keybinding → call saveFile()
3. Register Ctrl+W keybinding → close active tab
4. On cursor change → update store cursorLine/cursorCol
5. Register completion provider (Task 5.1)

saveFile function:
```typescript
const saveFile = async () => {
  if (!activeTab) return;
  await filesApi.writeFile(activeTab.path, activeTab.content);
  markTabClean(activeTab.id);
  // show brief "Saved" toast
};
```

3️⃣ EditorTabs.tsx
==================
- Each tab: [language-colored dot] [filename] [● if dirty] [× close]
- Active tab: top 2px border in accent color, lighter background
- Overflow: horizontal scroll on overflow, no wrap
- Middle-click: close tab
- Drag to reorder (HTML5 drag events, update tabs array in store)
- Right-click tab: [Close] [Close Others] [Close All] [Copy Path] [Reveal in Explorer]
- Unsaved indicator: orange dot before filename

4️⃣ EditorPlaceholder.tsx
=========================
Shown when no tabs open. Design:
- Large `⬡` logo centered
- "NeuralIDE" in Syne/Inter 700
- Subtitle: "Open a file from the explorer"
- Keyboard shortcuts grid:
```shell
Ctrl+P     Quick Open File
Ctrl+`     Toggle Terminal
Ctrl+B     Toggle Sidebar
Ctrl+J     Toggle Chat
Ctrl+S     Save File
```

🧪 Test Scenarios
=================

### Scenario 1: Open and edit file
- Click file in tree
- Expected: Real file content loads in Monaco with correct syntax highlighting

### Scenario 2: Save with Ctrl+S
- Edit file, press Ctrl+S
- Expected: File saved to disk, dirty indicator disappears, "Saved" toast appears

### Scenario 3: Multiple tabs
- Open 3 files
- Expected: All tabs visible, switching between them works, each preserves scroll position

### Scenario 4: Close tab with unsaved changes
- Edit file without saving, close tab
- Expected: Confirmation dialog "Unsaved changes — save before closing?"

### Scenario 5: Tab drag reorder
- Drag a tab to a different position
- Expected: Tab order changes

### Scenario 6: Monaco theme
- Open TypeScript file
- Expected: Keywords purple, strings green, types cyan, comments italic grey

🔒 Non-Functional Requirements
===============================
- Monaco must be dynamic imported (ssr: false)
- Editor must not lose content when panels resize
- Save must be atomic (no partial writes)

✅ Deliverable
==============
```shell
Full Monaco editor with real file read/write, tabs, Ctrl+S save
```
📊 Acceptance Criteria
======================
- [ ] Real file content loads correctly
- [ ] Ctrl+S saves to disk
- [ ] Dirty indicator works
- [ ] Tabs reorder via drag
- [ ] Custom theme applied
- [ ] Cursor position in status bar updates
- [ ] No TypeScript errors

⏱️ Estimated Duration: 75-90 minutes
🔗 Dependencies: Task 2.2, Task 1.2
🔗 Blocks: Task 5.1