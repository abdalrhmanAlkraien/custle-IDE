'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  label: string;
  key: string;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [mod, setMod] = useState<string>('Ctrl');

  useEffect(() => {
    // Detect macOS for Cmd vs Ctrl
    const isMac = navigator.platform.toLowerCase().includes('mac');
    setMod(isMac ? 'Cmd' : 'Ctrl');
  }, []);

  if (!isOpen) return null;

  const shortcuts: Record<string, Shortcut[]> = {
    General: [
      { label: 'Open Folder', key: `${mod}+Shift+O` },
      { label: 'New File', key: `${mod}+N` },
      { label: 'Save', key: `${mod}+S` },
      { label: 'Save As', key: `${mod}+Shift+S` },
      { label: 'Close File', key: `${mod}+W` },
    ],
    Panels: [
      { label: 'Toggle Sidebar', key: `${mod}+B` },
      { label: 'Toggle Terminal', key: `${mod}+\`` },
      { label: 'Toggle Chat', key: `${mod}+Shift+C` },
      { label: 'Explorer', key: `${mod}+Shift+E` },
      { label: 'Git', key: `${mod}+Shift+G` },
      { label: 'Search', key: `${mod}+Shift+F` },
    ],
    Editor: [
      { label: 'Find', key: `${mod}+F` },
      { label: 'Find & Replace', key: `${mod}+H` },
      { label: 'Select All', key: `${mod}+A` },
      { label: 'Toggle Comment', key: `${mod}+/` },
      { label: 'Format Document', key: `Shift+Alt+F` },
      { label: 'Undo', key: `${mod}+Z` },
      { label: 'Redo', key: `${mod}+Shift+Z` },
    ],
    Terminal: [
      { label: 'New Terminal', key: `${mod}+Shift+\`` },
    ],
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl p-6 w-[550px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-6">
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-[#858585] text-sm font-semibold mb-2 border-b border-[#3c3c3c] pb-1">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex justify-between items-center py-1 px-2 hover:bg-[#2a2d2e] rounded"
                  >
                    <span className="text-[#cccccc] text-sm">{shortcut.label}</span>
                    <kbd className="text-[#858585] text-xs font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3c3c3c]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-[#3c3c3c]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
