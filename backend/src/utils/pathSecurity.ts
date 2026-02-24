import path from 'path';

/**
 * Custom error for path traversal attempts
 */
export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathTraversalError';
  }
}

/**
 * Validates that a given path is within the allowed root directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 *
 * @param requestedPath - The path to validate (absolute or relative)
 * @param workspaceRoot - The allowed root directory (absolute)
 * @returns The normalized absolute path if valid
 * @throws PathTraversalError if path is outside workspace root
 */
export function validatePath(requestedPath: string, workspaceRoot: string): string {
  // Resolve both paths to absolute, normalized paths
  const resolvedPath = path.resolve(requestedPath);
  const resolvedRoot = path.resolve(workspaceRoot);

  // Check if the resolved path starts with the workspace root
  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new PathTraversalError(
      `Path traversal detected: ${requestedPath} is outside workspace root`
    );
  }

  return resolvedPath;
}

/**
 * Determines if a file/folder should be ignored based on common patterns
 *
 * @param name - File or folder name
 * @param isDirectory - Whether it's a directory
 * @returns true if should be ignored
 */
export function shouldIgnore(name: string, isDirectory: boolean): boolean {
  // Ignored directories
  const ignoredDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '__pycache__',
    '.next',
    'coverage',
    '.nuxt',
    '.output',
    'out',
    'target',
    'vendor',
  ];

  // Ignored files/patterns
  const ignoredFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.env.local',
    '.env.*.local',
  ];

  // Ignored extensions
  const ignoredExtensions = ['.pyc', '.pyo', '.class', '.o', '.so'];

  if (isDirectory) {
    return ignoredDirs.includes(name);
  }

  // Check exact file names
  if (ignoredFiles.includes(name)) {
    return true;
  }

  // Check extensions
  const ext = path.extname(name);
  return ignoredExtensions.includes(ext);
}

/**
 * Detects the language/file type from a file path
 *
 * @param filePath - Path to the file
 * @returns Language identifier for Monaco editor
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.json': 'json',
    '.md': 'markdown',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.rs': 'rust',
    '.go': 'go',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.xml': 'xml',
    '.sql': 'sql',
    '.graphql': 'graphql',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.r': 'r',
    '.lua': 'lua',
    '.dart': 'dart',
    '.dockerfile': 'dockerfile',
    '.gitignore': 'plaintext',
    '.env': 'plaintext',
  };

  // Check filename patterns
  const fileName = path.basename(filePath).toLowerCase();
  if (fileName === 'dockerfile') return 'dockerfile';
  if (fileName === 'makefile') return 'makefile';
  if (fileName.startsWith('.env')) return 'plaintext';

  return languageMap[ext] || 'plaintext';
}
