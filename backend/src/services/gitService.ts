import simpleGit, { SimpleGit, StatusResult, LogResult, BranchSummary } from 'simple-git';

// Git file status interface
export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

// Git change interface (for workspace git status)
export interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
  staged: boolean;
}

// Workspace git status (comprehensive)
export interface WorkspaceGitStatus {
  isRepo: boolean;
  branch?: string;
  ahead?: number;
  behind?: number;
  remote?: string | null;
  remoteOwner?: string | null;
  repoName?: string | null;
  changes?: GitChange[];
}

// Git status response
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFileStatus[];
}

// Git branches response
export interface GitBranches {
  current: string;
  local: string[];
  remote: string[];
}

// Git commit info
export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

// Git operation result
export interface GitOperationResult {
  success: boolean;
  output?: string;
  error?: string;
  conflicts?: string[];
}

let git: SimpleGit | null = null;
let workspacePath: string | null = null;

/**
 * Initialize git with workspace path
 */
export function initGit(path: string): void {
  workspacePath = path;
  git = simpleGit(path);
}

/**
 * Get current git instance
 */
function getGit(): SimpleGit {
  if (!git) {
    throw new Error('Git not initialized. Call initGit() first.');
  }
  return git;
}

/**
 * Check if workspace is a git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    const gitInstance = getGit();
    await gitInstance.status();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get comprehensive git status for a workspace
 * Used by workspace/open to detect git repos
 * Can be called without initGit
 */
export async function getWorkspaceGitStatus(workspacePath: string): Promise<WorkspaceGitStatus> {
  const gitInstance = simpleGit(workspacePath);

  // Check if git repo
  const isRepo = await gitInstance.checkIsRepo().catch(() => false);
  if (!isRepo) {
    return { isRepo: false };
  }

  try {
    // Get status
    const status: StatusResult = await gitInstance.status();

    // Get remotes
    const remotes = await gitInstance.getRemotes(true);
    const origin = remotes.find(r => r.name === 'origin');
    const remote = origin?.refs?.fetch || null;

    // Parse owner/repo from remote URL (GitHub only)
    // https://github.com/owner/repo.git or git@github.com:owner/repo.git
    let remoteOwner: string | null = null;
    let repoName: string | null = null;
    if (remote) {
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        remoteOwner = match[1];
        repoName = match[2];
      }
    }

    // Map simple-git status to GitChange[]
    const changes: GitChange[] = [
      ...status.modified.map(f => ({ path: f, status: 'modified' as const, staged: false })),
      ...status.staged.map(f => ({ path: f, status: 'staged' as const, staged: true })),
      ...status.not_added.map(f => ({ path: f, status: 'untracked' as const, staged: false })),
      ...status.deleted.map(f => ({ path: f, status: 'deleted' as const, staged: false })),
      ...status.created.map(f => ({ path: f, status: 'added' as const, staged: false })),
      ...status.renamed.map(r => ({ path: r.to, status: 'renamed' as const, staged: false })),
    ];

    return {
      isRepo: true,
      branch: status.current || 'HEAD',
      ahead: status.ahead,
      behind: status.behind,
      remote,
      remoteOwner,
      repoName,
      changes
    };
  } catch (error) {
    // Error getting status - return basic repo info
    console.error('Error getting workspace git status:', error);
    return { isRepo: true };
  }
}

/**
 * Get git status
 */
export async function getStatus(): Promise<GitStatus> {
  const gitInstance = getGit();
  const status: StatusResult = await gitInstance.status();

  const files: GitFileStatus[] = [
    ...status.modified.map(p => ({ path: p, status: 'modified' as const, staged: false })),
    ...status.staged.map(p => ({ path: p, status: 'modified' as const, staged: true })),
    ...status.created.map(p => ({ path: p, status: 'added' as const, staged: false })),
    ...status.deleted.map(p => ({ path: p, status: 'deleted' as const, staged: false })),
    ...status.not_added.map(p => ({ path: p, status: 'untracked' as const, staged: false })),
    ...status.renamed.map(r => ({ path: r.to, status: 'renamed' as const, staged: true })),
  ];

  return {
    branch: status.current || 'HEAD',
    ahead: status.ahead,
    behind: status.behind,
    files,
  };
}

/**
 * Get diff for a file
 */
export async function getDiff(filePath?: string): Promise<string> {
  const gitInstance = getGit();
  if (filePath) {
    return await gitInstance.diff(['--', filePath]);
  }
  return await gitInstance.diff();
}

/**
 * Get commit history
 */
export async function getLog(limit: number = 50): Promise<GitCommit[]> {
  const gitInstance = getGit();
  const log: LogResult = await gitInstance.log({ maxCount: limit });

  return log.all.map(commit => ({
    hash: commit.hash,
    message: commit.message,
    author: `${commit.author_name} <${commit.author_email}>`,
    date: commit.date,
  }));
}

/**
 * Get branches
 */
export async function getBranches(): Promise<GitBranches> {
  const gitInstance = getGit();
  const branchSummary: BranchSummary = await gitInstance.branch();

  return {
    current: branchSummary.current,
    local: Object.keys(branchSummary.branches).filter(b => !b.startsWith('remotes/')),
    remote: Object.keys(branchSummary.branches).filter(b => b.startsWith('remotes/')),
  };
}

/**
 * Stage files
 */
export async function stageFiles(paths: string[]): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.add(paths);
    return { success: true, output: `Staged ${paths.length} file(s)` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Unstage files
 */
export async function unstageFiles(paths: string[]): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.reset(['--', ...paths]);
    return { success: true, output: `Unstaged ${paths.length} file(s)` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Commit staged changes
 */
export async function commit(message: string): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    const result = await gitInstance.commit(message);
    return {
      success: true,
      output: `Committed: ${result.commit} - ${message.split('\n')[0]}`
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Push to remote
 */
export async function push(remote?: string, branch?: string): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    if (remote && branch) {
      await gitInstance.push(remote, branch);
    } else {
      await gitInstance.push();
    }
    return { success: true, output: 'Pushed successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Push to remote with GitHub PAT authentication
 * Injects token into HTTPS URL temporarily for push only
 * @param token GitHub Personal Access Token
 * @param remote Remote name (default: 'origin')
 * @param branch Branch name (default: current branch)
 */
export async function pushWithToken(token: string, remote: string = 'origin', branch?: string): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();

    // Get current remote URL
    const remotes = await gitInstance.getRemotes(true);
    const remoteObj = remotes.find(r => r.name === remote);
    if (!remoteObj || !remoteObj.refs.push) {
      return { success: false, error: `Remote '${remote}' not found` };
    }

    const originalUrl = remoteObj.refs.push;

    // Check if it's an HTTPS GitHub URL
    if (!originalUrl.startsWith('https://github.com/')) {
      // Fall back to SSH push
      return await push(remote, branch);
    }

    // Inject PAT into URL (https://github.com/... -> https://TOKEN@github.com/...)
    const authedUrl = originalUrl.replace('https://', `https://${token}@`);

    // Get current branch if not specified
    const currentBranch = branch || (await gitInstance.status()).current || 'main';

    // Temporarily set remote URL with token
    await gitInstance.remote(['set-url', remote, authedUrl]);

    try {
      // Push with authenticated URL
      await gitInstance.push(remote, currentBranch);

      // Restore original URL
      await gitInstance.remote(['set-url', remote, originalUrl]);

      return { success: true, output: 'Pushed successfully' };
    } catch (pushError: any) {
      // Restore original URL even on error
      await gitInstance.remote(['set-url', remote, originalUrl]);
      throw pushError;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pull from remote
 */
export async function pull(): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    const result = await gitInstance.pull();

    const conflicts = result.files
      .filter(f => f.includes('CONFLICT'))
      .map(f => f.split(' ').pop() || f);

    return {
      success: conflicts.length === 0,
      output: 'Pulled successfully',
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Checkout branch
 */
export async function checkout(branch: string): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.checkout(branch);
    return { success: true, output: `Switched to branch '${branch}'` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create and checkout new branch
 */
export async function createBranch(name: string): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.checkoutLocalBranch(name);
    return { success: true, output: `Created and switched to branch '${name}'` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Stash changes
 */
export async function stash(): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.stash();
    return { success: true, output: 'Stashed changes' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pop stash
 */
export async function stashPop(): Promise<GitOperationResult> {
  try {
    const gitInstance = getGit();
    await gitInstance.stash(['pop']);
    return { success: true, output: 'Applied stashed changes' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Clone repository
 */
export async function clone(url: string, targetPath: string): Promise<GitOperationResult> {
  try {
    const gitInstance = simpleGit();
    await gitInstance.clone(url, targetPath);
    return { success: true, output: `Cloned repository to ${targetPath}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get workspace path
 */
export function getWorkspacePath(): string | null {
  return workspacePath;
}
