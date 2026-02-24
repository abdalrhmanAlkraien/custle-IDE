/**
 * Editor Placeholder
 *
 * Displayed when no tabs are open.
 * Shows branding, welcome message, and keyboard shortcuts reference.
 */

'use client';

export function EditorPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0d0d14] text-[#eeeef5] select-none">
      {/* Logo */}
      <div className="mb-6 text-[120px] leading-none text-[#7b68ee] opacity-20">
        ⬡
      </div>

      {/* Branding */}
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#7b68ee] to-[#bd93f9] bg-clip-text text-transparent">
        NeuralIDE
      </h1>
      <p className="text-[#9999bb] text-sm mb-12">
        Open a file from the explorer to start editing
      </p>

      {/* Keyboard Shortcuts */}
      <div className="w-96 border border-[#2a2a3d] rounded-lg p-6 bg-[#16161f]">
        <h2 className="text-xs font-semibold text-[#9999bb] uppercase tracking-wider mb-4">
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3">
          <ShortcutRow shortcut="Ctrl+P" description="Quick Open File" />
          <ShortcutRow shortcut="Ctrl+`" description="Toggle Terminal" />
          <ShortcutRow shortcut="Ctrl+B" description="Toggle Sidebar" />
          <ShortcutRow shortcut="Ctrl+J" description="Toggle Chat" />
          <ShortcutRow shortcut="Ctrl+S" description="Save File" />
          <ShortcutRow shortcut="Ctrl+W" description="Close Tab" />
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-[#55556b]">
        AI-powered code editor • Built with Monaco
      </p>
    </div>
  );
}

interface ShortcutRowProps {
  shortcut: string;
  description: string;
}

function ShortcutRow({ shortcut, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#9999bb]">{description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-[#0d0d14] border border-[#2a2a3d] rounded text-[#7b68ee]">
        {shortcut}
      </kbd>
    </div>
  );
}
