import { create } from 'zustand';
import { type FileNode } from '../lib/api/filesApi';

interface FileTreeStore {
  fileTree: FileNode[] | null;
  setFileTree: (tree: FileNode[] | null) => void;
}

export const useFileTreeStore = create<FileTreeStore>((set) => ({
  fileTree: null,
  setFileTree: (tree) => set({ fileTree: tree }),
}));
