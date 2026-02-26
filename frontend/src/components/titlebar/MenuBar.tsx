'use client';

import { useState, useEffect } from 'react';
import MenuDropdown, { MenuAction } from './MenuDropdown';
import AboutModal from './AboutModal';
import ShortcutsModal from './ShortcutsModal';
import { useIDEStore } from '@/store/ideStore';

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mod, setMod] = useState<string>('Ctrl');

  const store = useIDEStore();

  // Detect platform for Cmd vs Ctrl
  useEffect(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    setMod(isMac ? 'Cmd' : 'Ctrl');
  }, []);

  // Apply zoom level to document
  useEffect(() => {
    const scale = 1 + (store.zoomLevel * 0.1);
    document.documentElement.style.fontSize = `${scale * 100}%`;
  }, [store.zoomLevel]);

  // Global keyboard shortcuts (only for panel toggles, not editor actions)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModKey = e.metaKey || e.ctrlKey;

      // Ctrl+` → toggle terminal
      if (e.key === '`' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.toggleBottom();
      }

      // Ctrl+B → toggle sidebar
      if (e.key === 'b' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.toggleSidebar();
      }

      // Ctrl+Shift+E → explorer
      if (e.key === 'E' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.setSidebarPanel('files');
        if (!store.isSidebarOpen) store.toggleSidebar();
      }

      // Ctrl+Shift+G → git
      if (e.key === 'G' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.setSidebarPanel('git');
        if (!store.isSidebarOpen) store.toggleSidebar();
      }

      // Ctrl+Shift+F → search
      if (e.key === 'F' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.setSidebarPanel('search');
        if (!store.isSidebarOpen) store.toggleSidebar();
      }

      // Ctrl+N → new file
      if (e.key === 'n' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.openNewUntitledTab();
      }

      // Ctrl+W → close tab (only if not in Monaco - Monaco handles its own)
      if (e.key === 'w' && isModKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (!target.closest('.monaco-editor')) {
          e.preventDefault();
          store.closeActiveTab();
        }
      }

      // Ctrl+Shift+C → toggle chat
      if (e.key === 'C' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.toggleChat();
      }

      // Ctrl+Shift+` → new terminal
      if (e.key === '`' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.addTerminalTab();
      }

      // Ctrl+Shift+O → open folder
      if (e.key === 'O' && isModKey && e.shiftKey) {
        e.preventDefault();
        store.openFolderBrowser();
      }

      // Ctrl+= → zoom in
      if (e.key === '=' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.setZoomLevel(store.zoomLevel + 1);
      }

      // Ctrl+- → zoom out
      if (e.key === '-' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.setZoomLevel(store.zoomLevel - 1);
      }

      // Ctrl+0 → reset zoom
      if (e.key === '0' && isModKey && !e.shiftKey) {
        e.preventDefault();
        store.setZoomLevel(0);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [store]);

  const buildFileMenu = (): MenuAction[] => {
    return [
      {
        label: 'Open Folder...',
        shortcut: `${mod}+Shift+O`,
        onClick: () => { store.openFolderBrowser(); setOpenMenu(null); },
      },
      {
        label: 'Open Recent',
        submenu: store.recentWorkspaces.length > 0
          ? store.recentWorkspaces.map(path => ({
              label: path.split('/').slice(-2).join('/'),
              onClick: async () => {
                // Call workspace API to open this path
                try {
                  const res = await fetch('http://localhost:3001/api/workspace/open', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path }),
                  });
                  if (res.ok) {
                    const ws = await res.json();
                    store.setWorkspace(ws.path, ws.name);
                  }
                } catch (error) {
                  console.error('Failed to open workspace:', error);
                }
                setOpenMenu(null);
              },
            }))
          : [{ label: '(No recent workspaces)', disabled: true }],
        dividerAfter: true,
      },
      {
        label: 'New File',
        shortcut: `${mod}+N`,
        onClick: () => { store.openNewUntitledTab(); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Save',
        shortcut: `${mod}+S`,
        disabled: !store.activeTabId,
        onClick: () => {
          // Monaco handles Ctrl+S internally
          store.monacoEditor?.trigger('menu', 'editor.action.save', null);
          setOpenMenu(null);
        },
      },
      {
        label: 'Save All',
        shortcut: `${mod}+Alt+S`,
        disabled: store.tabs.length === 0,
        onClick: () => {
          // Save all dirty tabs
          setOpenMenu(null);
        },
        dividerAfter: true,
      },
      {
        label: 'Close File',
        shortcut: `${mod}+W`,
        disabled: !store.activeTabId,
        onClick: () => { store.closeActiveTab(); setOpenMenu(null); },
      },
      {
        label: 'Close All Files',
        disabled: store.tabs.length === 0,
        onClick: () => { store.closeAllTabs(); setOpenMenu(null); },
      },
    ];
  };

  const buildEditMenu = (): MenuAction[] => {
    const hasEditor = !!store.monacoEditor;

    return [
      {
        label: 'Undo',
        shortcut: `${mod}+Z`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'undo', null); setOpenMenu(null); },
      },
      {
        label: 'Redo',
        shortcut: `${mod}+Shift+Z`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'redo', null); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Cut',
        shortcut: `${mod}+X`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.clipboardCutAction', null); setOpenMenu(null); },
      },
      {
        label: 'Copy',
        shortcut: `${mod}+C`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.clipboardCopyAction', null); setOpenMenu(null); },
      },
      {
        label: 'Paste',
        shortcut: `${mod}+V`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.clipboardPasteAction', null); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Find',
        shortcut: `${mod}+F`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'actions.find', null); setOpenMenu(null); },
      },
      {
        label: 'Replace',
        shortcut: `${mod}+H`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.startFindReplaceAction', null); setOpenMenu(null); },
      },
      {
        label: 'Find in Files',
        shortcut: `${mod}+Shift+F`,
        onClick: () => { store.setSidebarPanel('search'); if (!store.isSidebarOpen) store.toggleSidebar(); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Select All',
        shortcut: `${mod}+A`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.selectAll', null); setOpenMenu(null); },
      },
      {
        label: 'Toggle Comment',
        shortcut: `${mod}+/`,
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.commentLine', null); setOpenMenu(null); },
      },
      {
        label: 'Format Document',
        shortcut: 'Shift+Alt+F',
        disabled: !hasEditor,
        onClick: () => { store.monacoEditor?.trigger('menu', 'editor.action.formatDocument', null); setOpenMenu(null); },
      },
    ];
  };

  const buildViewMenu = (): MenuAction[] => {
    return [
      {
        label: 'Explorer',
        shortcut: `${mod}+Shift+E`,
        onClick: () => { store.setSidebarPanel('files'); if (!store.isSidebarOpen) store.toggleSidebar(); setOpenMenu(null); },
      },
      {
        label: 'Search',
        shortcut: `${mod}+Shift+F`,
        onClick: () => { store.setSidebarPanel('search'); if (!store.isSidebarOpen) store.toggleSidebar(); setOpenMenu(null); },
      },
      {
        label: 'Git',
        shortcut: `${mod}+Shift+G`,
        onClick: () => { store.setSidebarPanel('git'); if (!store.isSidebarOpen) store.toggleSidebar(); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Toggle Sidebar',
        shortcut: `${mod}+B`,
        onClick: () => { store.toggleSidebar(); setOpenMenu(null); },
      },
      {
        label: 'Toggle Chat',
        shortcut: `${mod}+Shift+C`,
        onClick: () => { store.toggleChat(); setOpenMenu(null); },
      },
      {
        label: 'Toggle Terminal',
        shortcut: '`',
        onClick: () => { store.toggleBottom(); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'New Terminal',
        shortcut: `${mod}+Shift+\``,
        onClick: () => { store.addTerminalTab(); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'Zoom In',
        shortcut: `${mod}+=`,
        onClick: () => { store.setZoomLevel(store.zoomLevel + 1); setOpenMenu(null); },
      },
      {
        label: 'Zoom Out',
        shortcut: `${mod}+-`,
        onClick: () => { store.setZoomLevel(store.zoomLevel - 1); setOpenMenu(null); },
      },
      {
        label: 'Reset Zoom',
        shortcut: `${mod}+0`,
        onClick: () => { store.setZoomLevel(0); setOpenMenu(null); },
      },
    ];
  };

  const buildHelpMenu = (): MenuAction[] => {
    return [
      {
        label: 'About Custle IDE',
        onClick: () => { setShowAbout(true); setOpenMenu(null); },
      },
      {
        label: 'Keyboard Shortcuts',
        shortcut: `${mod}+Shift+?`,
        onClick: () => { setShowShortcuts(true); setOpenMenu(null); },
        dividerAfter: true,
      },
      {
        label: 'GitHub Repository',
        onClick: () => {
          window.open('https://github.com/custle/custle-IDE', '_blank');
          setOpenMenu(null);
        },
      },
      {
        label: 'Report an Issue',
        onClick: () => {
          window.open('https://github.com/custle/custle-IDE/issues', '_blank');
          setOpenMenu(null);
        },
        dividerAfter: true,
      },
      {
        label: 'Check Backend Status',
        onClick: async () => {
          try {
            const res = await fetch('http://localhost:3001/api/health');
            if (res.ok) {
              alert('Backend online ✅');
            } else {
              alert('Backend offline ❌');
            }
          } catch (error) {
            alert('Backend offline ❌');
          }
          setOpenMenu(null);
        },
      },
    ];
  };

  const fileItems = buildFileMenu();
  const editItems = buildEditMenu();
  const viewItems = buildViewMenu();
  const helpItems = buildHelpMenu();

  return (
    <>
      <div className="flex items-center" style={{ position: 'relative', zIndex: 1000 }}>
        {[
          { label: 'File', items: fileItems },
          { label: 'Edit', items: editItems },
          { label: 'View', items: viewItems },
          { label: 'Help', items: helpItems },
        ].map(menu => (
          <MenuDropdown
            key={menu.label}
            label={menu.label}
            items={menu.items}
            isOpen={openMenu === menu.label}
            onToggle={() => setOpenMenu(open => open === menu.label ? null : menu.label)}
            onClose={() => setOpenMenu(null)}
          />
        ))}
      </div>

      {/* Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
