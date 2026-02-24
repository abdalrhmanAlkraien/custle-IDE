/**
 * Monaco Editor Component
 *
 * Full-featured code editor with:
 * - Custom neural-dark theme
 * - Keybindings (Ctrl+S save, Ctrl+W close)
 * - Cursor position tracking
 * - Syntax highlighting
 * - Autocomplete (ready for Task 6.1)
 *
 * IMPORTANT: Must be dynamically imported with ssr: false
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useIDEStore } from '@/store/ideStore';
import { neuralDarkTheme } from '@/lib/monacoTheme';
import { filesApi } from '@/lib/api/filesApi';

export function MonacoEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof editor | null>(null);

  const tabs = useIDEStore((state) => state.tabs);
  const activeTabId = useIDEStore((state) => state.activeTabId);
  const updateTabContent = useIDEStore((state) => state.updateTabContent);
  const updateCursor = useIDEStore((state) => state.updateCursor);
  const markTabClean = useIDEStore((state) => state.markTabClean);
  const closeTab = useIDEStore((state) => state.closeTab);

  const [isSaving, setIsSaving] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Save file function
  const saveFile = async () => {
    if (!activeTab || isSaving) return;

    try {
      setIsSaving(true);
      await filesApi.writeFile(activeTab.path, activeTab.content);
      markTabClean(activeTab.id);

      // Brief "Saved" indication (you could add a toast here)
      console.log('File saved:', activeTab.name);
    } catch (error) {
      console.error('Failed to save file:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco.editor;

    // Define and set neural-dark theme
    monaco.editor.defineTheme('neural-dark', neuralDarkTheme);
    monaco.editor.setTheme('neural-dark');

    // Register Ctrl+S keybinding (save file)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });

    // Register Ctrl+W keybinding (close tab)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW, () => {
      if (activeTab) {
        // Check for unsaved changes
        if (activeTab.isDirty) {
          const confirmed = window.confirm(
            `"${activeTab.name}" has unsaved changes. Close anyway?`
          );
          if (!confirmed) return;
        }
        closeTab(activeTab.id);
      }
    });

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      if (activeTab) {
        updateCursor(activeTab.id, e.position.lineNumber, e.position.column);
      }
    });

    // Track content changes
    editor.onDidChangeModelContent(() => {
      if (activeTab) {
        const newContent = editor.getValue();
        updateTabContent(activeTab.id, newContent);
      }
    });
  };

  // Update editor content when active tab changes
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    const currentContent = editorRef.current.getValue();
    if (currentContent !== activeTab.content) {
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(activeTab.content);

      // Restore cursor position if available
      if (position) {
        editorRef.current.setPosition(position);
      } else {
        // Set cursor to last known position
        editorRef.current.setPosition({
          lineNumber: activeTab.cursorLine,
          column: activeTab.cursorCol,
        });
      }
    }
  }, [activeTab?.id, activeTab?.content]);

  if (!activeTab) {
    return null;
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onMount={handleEditorMount}
        options={{
          theme: 'neural-dark',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          lineHeight: 1.65,
          letterSpacing: 0.5,
          minimap: {
            enabled: true,
            scale: 1,
            renderCharacters: false,
          },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'off',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          padding: {
            top: 16,
            bottom: 16,
          },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          inlineSuggest: {
            enabled: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          suggest: {
            preview: true,
            showInlineDetails: true,
          },
          // Additional quality-of-life features
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          matchBrackets: 'always',
          dragAndDrop: true,
          links: true,
          mouseWheelZoom: true,
          selectionHighlight: true,
          occurrencesHighlight: 'multiFile',
          contextmenu: true,
          copyWithSyntaxHighlighting: true,
        }}
      />

      {/* Saving indicator */}
      {isSaving && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#16161f] border border-[#2a2a3d] rounded text-xs text-[#50fa7b]">
          Saving...
        </div>
      )}
    </div>
  );
}
