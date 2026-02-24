// File System Types
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;          // absolute path on disk
  relativePath: string;  // relative to workspace root
  extension?: string;
  size?: number;
  modified?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface WorkspaceConfig {
  rootPath: string;
  name: string;
}

// AI Model Types
export interface ModelConfig {
  url: string;
  name: string;
  apiKey: string;
  provider: 'openai-compatible' | 'anthropic' | 'openai';
  maxTokens?: number;
  temperature?: number;
}

// Git Types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

// Terminal Types
export interface TerminalSession {
  id: string;
  cwd: string;
}
