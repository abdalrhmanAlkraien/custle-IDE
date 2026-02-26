/**
 * Git API Client
 * REST API client for all git operations
 */

const API_BASE = 'http://localhost:3001';

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  remote: string | null;
  remoteOwner: string | null;
  repoName: string | null;
  files?: GitFileStatus[];
  changes?: GitFileStatus[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitBranches {
  current: string;
  local: string[];
  remote: string[];
}

export interface GitOperationResult {
  success: boolean;
  output?: string;
  error?: string;
  conflicts?: string[];
}

export interface GitLog {
  commits: GitCommit[];
}

export interface GitDiff {
  diff: string;
}

// Get git status
export async function getGitStatus(): Promise<GitStatus> {
  const response = await fetch(`${API_BASE}/api/git/status`);
  if (!response.ok) {
    throw new Error(`Failed to get git status: ${response.statusText}`);
  }
  return response.json();
}

// Get git diff for a file or all files
export async function getGitDiff(filePath?: string): Promise<GitDiff> {
  const url = filePath
    ? `${API_BASE}/api/git/diff?path=${encodeURIComponent(filePath)}`
    : `${API_BASE}/api/git/diff`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get git diff: ${response.statusText}`);
  }
  return response.json();
}

// Get commit history
export async function getGitLog(limit = 50): Promise<GitLog> {
  const response = await fetch(`${API_BASE}/api/git/log?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to get git log: ${response.statusText}`);
  }
  return response.json();
}

// Get branches
export async function getGitBranches(): Promise<GitBranches> {
  const response = await fetch(`${API_BASE}/api/git/branches`);
  if (!response.ok) {
    throw new Error(`Failed to get git branches: ${response.statusText}`);
  }
  return response.json();
}

// Stage files
export async function stageFiles(paths: string[]): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!response.ok) {
    throw new Error(`Failed to stage files: ${response.statusText}`);
  }
  return response.json();
}

// Unstage files
export async function unstageFiles(paths: string[]): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/unstage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  if (!response.ok) {
    throw new Error(`Failed to unstage files: ${response.statusText}`);
  }
  return response.json();
}

// Commit staged changes
export async function commit(message: string): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error(`Failed to commit: ${response.statusText}`);
  }
  return response.json();
}

// Push to remote
export async function push(): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/push`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to push: ${response.statusText}`);
  }
  return response.json();
}

// Pull from remote
export async function pull(): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/pull`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to pull: ${response.statusText}`);
  }
  return response.json();
}

// Checkout branch
export async function checkout(branch: string): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch }),
  });
  if (!response.ok) {
    throw new Error(`Failed to checkout branch: ${response.statusText}`);
  }
  return response.json();
}

// Create and checkout new branch
export async function createBranch(name: string): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/branch/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create branch: ${response.statusText}`);
  }
  return response.json();
}

// Stash changes
export async function stash(): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/stash`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to stash: ${response.statusText}`);
  }
  return response.json();
}

// Pop stashed changes
export async function stashPop(): Promise<GitOperationResult> {
  const response = await fetch(`${API_BASE}/api/git/stash/pop`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to pop stash: ${response.statusText}`);
  }
  return response.json();
}
