/**
 * useKeyboard Hook
 * Global keyboard shortcuts for IDE
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboard(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Standard IDE keyboard shortcuts
 */
export const IDE_SHORTCUTS = {
  COMMAND_PALETTE: { key: 'p', ctrl: true, description: 'Open command palette' },
  COMMAND_PALETTE_ALT: { key: 'P', ctrl: true, shift: true, description: 'Open command palette' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  TOGGLE_BOTTOM_PANEL: { key: 'j', ctrl: true, description: 'Toggle bottom panel' },
  TOGGLE_CHAT: { key: '\\', ctrl: true, description: 'Toggle chat panel' },
  FOCUS_TERMINAL: { key: '`', ctrl: true, description: 'Focus terminal' },
  SAVE_FILE: { key: 's', ctrl: true, description: 'Save active file' },
  SAVE_ALL: { key: 'S', ctrl: true, shift: true, description: 'Save all files' },
  CLOSE_TAB: { key: 'w', ctrl: true, description: 'Close active tab' },
  CLOSE_ALL_TABS: { key: 'W', ctrl: true, shift: true, description: 'Close all tabs' },
  NEXT_TAB: { key: 'Tab', ctrl: true, description: 'Next tab' },
  PREV_TAB: { key: 'Tab', ctrl: true, shift: true, description: 'Previous tab' },
  OPEN_SETTINGS: { key: ',', ctrl: true, description: 'Open settings' },
  CLOSE_MODAL: { key: 'Escape', description: 'Close modal/dialog' },
} as const;
