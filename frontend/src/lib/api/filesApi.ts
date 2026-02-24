import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  extension?: string;
  size?: number;
  modified?: string;
}

export interface FileContent {
  content: string;
  language: string;
  size: number;
  modified: string;
}

export interface SearchMatch {
  line: number;
  content: string;
  lineNumber: number;
}

export interface SearchResult {
  path: string;
  relativePath: string;
  matches: SearchMatch[];
}

export interface WorkspaceResponse {
  path: string;
  name: string;
  tree: FileNode;
}

export const filesApi = {
  /**
   * Open a workspace folder
   */
  openWorkspace: async (path: string): Promise<WorkspaceResponse> => {
    const response = await axios.post(`${BASE_URL}/api/workspace/open`, { path });
    return response.data;
  },

  /**
   * Get current workspace tree
   */
  getTree: async (): Promise<FileNode> => {
    const response = await axios.get(`${BASE_URL}/api/workspace/tree`);
    return response.data;
  },

  /**
   * Get current workspace info
   */
  getWorkspace: async (): Promise<{ path: string; name: string } | null> => {
    const response = await axios.get(`${BASE_URL}/api/workspace`);
    return response.data;
  },

  /**
   * Close current workspace
   */
  closeWorkspace: async (): Promise<{ success: boolean }> => {
    const response = await axios.post(`${BASE_URL}/api/workspace/close`);
    return response.data;
  },

  /**
   * Read file content
   */
  readFile: async (path: string): Promise<FileContent> => {
    const response = await axios.get(`${BASE_URL}/api/files/read`, {
      params: { path },
    });
    return response.data;
  },

  /**
   * Write file content
   */
  writeFile: async (path: string, content: string): Promise<{ success: boolean }> => {
    const response = await axios.post(`${BASE_URL}/api/files/write`, { path, content });
    return response.data;
  },

  /**
   * Create a new file
   */
  createFile: async (path: string): Promise<{ success: boolean }> => {
    const response = await axios.post(`${BASE_URL}/api/files/create`, {
      path,
      type: 'file',
    });
    return response.data;
  },

  /**
   * Create a new folder
   */
  createFolder: async (path: string): Promise<{ success: boolean }> => {
    const response = await axios.post(`${BASE_URL}/api/files/create`, {
      path,
      type: 'folder',
    });
    return response.data;
  },

  /**
   * Delete a file or folder
   */
  deleteFile: async (path: string): Promise<{ success: boolean }> => {
    const response = await axios.delete(`${BASE_URL}/api/files/delete`, {
      data: { path },
    });
    return response.data;
  },

  /**
   * Rename or move a file/folder
   */
  renameFile: async (oldPath: string, newPath: string): Promise<{ success: boolean }> => {
    const response = await axios.post(`${BASE_URL}/api/files/rename`, {
      oldPath,
      newPath,
    });
    return response.data;
  },

  /**
   * Search files by content
   */
  searchFiles: async (q: string, root?: string): Promise<SearchResult[]> => {
    const response = await axios.get(`${BASE_URL}/api/files/search`, {
      params: { q, root },
    });
    return response.data;
  },
};
