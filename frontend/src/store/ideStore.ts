import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Tab interface
export interface Tab {
  id: string;
  path: string;           // absolute path
  relativePath: string;   // relative to workspace root
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorLine: number;
  cursorCol: number;
}

// IDE Store interface
export interface IDEStore {
  // Workspace
  workspacePath: string | null;
  workspaceName: string;
  setWorkspace: (path: string, name: string) => void;
  clearWorkspace: () => void;

  // Layout - Sidebar
  activeSidebarPanel: 'files' | 'search' | 'git' | 'extensions';
  sidebarWidth: number;
  isSidebarOpen: boolean;
  setSidebarPanel: (panel: IDEStore['activeSidebarPanel']) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;

  // Layout - Chat
  chatWidth: number;
  isChatOpen: boolean;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;

  // Layout - Bottom Panel
  bottomHeight: number;
  isBottomOpen: boolean;
  activeBottomTab: 'terminal' | 'problems' | 'output';
  toggleBottom: () => void;
  setBottomTab: (tab: IDEStore['activeBottomTab']) => void;
  setBottomHeight: (height: number) => void;

  // Tabs & Editor
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id' | 'isDirty' | 'cursorLine' | 'cursorCol'>) => void;
  openFile: (path: string) => Promise<void>;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabClean: (id: string) => void;
  markTabDirty: (id: string) => void;
  updateCursor: (id: string, line: number, col: number) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  refreshOpenFile: (filePath: string) => Promise<void>;

  // Chat
  chatMode: 'chat' | 'agent';
  setChatMode: (mode: IDEStore['chatMode']) => void;
}

// Create the store
export const useIDEStore = create<IDEStore>((set) => ({
  // Workspace
  workspacePath: null,
  workspaceName: 'No Workspace',
  setWorkspace: (path: string, name: string) =>
    set({ workspacePath: path, workspaceName: name }),
  clearWorkspace: () =>
    set({ workspacePath: null, workspaceName: 'No Workspace', tabs: [], activeTabId: null }),

  // Layout - Sidebar
  activeSidebarPanel: 'files',
  sidebarWidth: 280,
  isSidebarOpen: true,
  setSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  // Layout - Chat
  chatWidth: 400,
  isChatOpen: true,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatWidth: (width) => set({ chatWidth: width }),

  // Layout - Bottom Panel
  bottomHeight: 300,
  isBottomOpen: true,
  activeBottomTab: 'terminal',
  toggleBottom: () => set((state) => ({ isBottomOpen: !state.isBottomOpen })),
  setBottomTab: (tab) => set({ activeBottomTab: tab }),
  setBottomHeight: (height) => set({ bottomHeight: height }),

  // Tabs & Editor
  tabs: [],
  activeTabId: null,

  openTab: (newTab) =>
    set((state) => {
      // Check if tab already exists
      const existingTab = state.tabs.find((t) => t.path === newTab.path);
      if (existingTab) {
        return { activeTabId: existingTab.id };
      }

      // Create new tab
      const tab: Tab = {
        ...newTab,
        id: uuidv4(),
        isDirty: false,
        cursorLine: 1,
        cursorCol: 1,
      };

      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  openFile: async (path: string) => {
    const state = useIDEStore.getState();

    // Check if file is already open
    const existingTab = state.tabs.find((t) => t.path === path);
    if (existingTab) {
      state.setActiveTab(existingTab.id);
      return;
    }

    // Fetch file content and open
    try {
      const { filesApi } = await import('../lib/api/filesApi');
      const fileData = await filesApi.readFile(path);

      const workspacePath = state.workspacePath || '';
      const relativePath = path.startsWith(workspacePath)
        ? path.substring(workspacePath.length + 1)
        : path;

      state.openTab({
        path: path,
        relativePath: relativePath,
        name: path.split('/').pop() || path,
        content: fileData.content,
        language: fileData.language,
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  },

  closeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveTabId = state.activeTabId;

      // If closing active tab, switch to another tab
      if (state.activeTabId === id) {
        const closedIndex = state.tabs.findIndex((t) => t.id === id);
        if (newTabs.length > 0) {
          // Try to activate the tab to the right, or left if at end
          const newIndex = Math.min(closedIndex, newTabs.length - 1);
          newActiveTabId = newTabs[newIndex]?.id || null;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, content, isDirty: true } : tab
      ),
    })),

  markTabClean: (id) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, isDirty: false } : tab
      ),
    })),

  markTabDirty: (id) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, isDirty: true } : tab
      ),
    })),

  updateCursor: (id, line, col) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, cursorLine: line, cursorCol: col } : tab
      ),
    })),

  closeAllTabs: () => set({ tabs: [], activeTabId: null }),

  closeOtherTabs: (id) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab) return state;

      return {
        tabs: [tab],
        activeTabId: id,
      };
    }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const newTabs = [...state.tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);

      return { tabs: newTabs };
    }),

  refreshOpenFile: async (filePath) => {
    // This will be called when a file changes externally
    // We need to re-fetch the file content if it's currently open
    const state = useIDEStore.getState();
    const tab = state.tabs.find((t) => t.path === filePath);

    if (tab && !tab.isDirty) {
      // Only refresh if the tab is not dirty (no unsaved changes)
      try {
        const { filesApi } = await import('../lib/api/filesApi');
        const fileData = await filesApi.readFile(filePath);

        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.path === filePath ? { ...t, content: fileData.content } : t
          ),
        }));
      } catch (error) {
        console.error('Failed to refresh file:', error);
      }
    }
  },

  // Chat
  chatMode: 'chat',
  setChatMode: (mode) => set({ chatMode: mode }),
}));
