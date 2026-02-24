import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validatePath, shouldIgnore, detectLanguage } from '../utils/pathSecurity';
import { FileNode } from '../types';

const MAX_TREE_DEPTH = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Read a file and return its content with metadata
 */
export async function readFile(filePath: string, workspaceRoot: string): Promise<{
  content: string;
  language: string;
  size: number;
  modified: string;
}> {
  const safePath = validatePath(filePath, workspaceRoot);

  const stats = await fs.stat(safePath);

  if (!stats.isFile()) {
    throw new Error('Path is not a file');
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  const content = await fs.readFile(safePath, 'utf-8');
  const language = detectLanguage(safePath);

  return {
    content,
    language,
    size: stats.size,
    modified: stats.mtime.toISOString(),
  };
}

/**
 * Write content to a file atomically
 * Uses tmp file + rename for atomic operation
 */
export async function writeFile(
  filePath: string,
  content: string,
  workspaceRoot: string
): Promise<void> {
  const safePath = validatePath(filePath, workspaceRoot);

  // Ensure parent directory exists
  const dir = path.dirname(safePath);
  await fs.mkdir(dir, { recursive: true });

  // Atomic write: write to tmp file, then rename
  const tmpPath = `${safePath}.tmp.${Date.now()}`;

  try {
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, safePath);
  } catch (error) {
    // Clean up tmp file on error
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Create a new file or folder
 */
export async function createPath(
  filePath: string,
  type: 'file' | 'folder',
  workspaceRoot: string
): Promise<void> {
  const safePath = validatePath(filePath, workspaceRoot);

  // Check if already exists
  try {
    await fs.access(safePath);
    throw new Error('Path already exists');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (type === 'folder') {
    await fs.mkdir(safePath, { recursive: true });
  } else {
    // Create parent directory if needed
    const dir = path.dirname(safePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(safePath, '', 'utf-8');
  }
}

/**
 * Delete a file or folder recursively
 */
export async function deletePath(filePath: string, workspaceRoot: string): Promise<void> {
  const safePath = validatePath(filePath, workspaceRoot);

  const stats = await fs.stat(safePath);

  if (stats.isDirectory()) {
    await fs.rm(safePath, { recursive: true, force: true });
  } else {
    await fs.unlink(safePath);
  }
}

/**
 * Rename or move a file/folder
 */
export async function renamePath(
  oldPath: string,
  newPath: string,
  workspaceRoot: string
): Promise<void> {
  const safeOldPath = validatePath(oldPath, workspaceRoot);
  const safeNewPath = validatePath(newPath, workspaceRoot);

  // Ensure new parent directory exists
  const newDir = path.dirname(safeNewPath);
  await fs.mkdir(newDir, { recursive: true });

  await fs.rename(safeOldPath, safeNewPath);
}

/**
 * Search for text in files
 */
export async function searchFiles(
  query: string,
  rootPath: string,
  workspaceRoot: string
): Promise<Array<{
  path: string;
  relativePath: string;
  matches: Array<{ line: string; lineNumber: number; content: string }>;
}>> {
  const safeRoot = validatePath(rootPath, workspaceRoot);

  const regex = new RegExp(query, 'gi');
  const results: Array<{
    path: string;
    relativePath: string;
    matches: Array<{ line: string; lineNumber: number; content: string }>;
  }> = [];

  async function searchDir(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (shouldIgnore(entry.name, entry.isDirectory())) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await searchDir(fullPath);
      } else {
        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > MAX_FILE_SIZE) {
            continue; // Skip large files
          }

          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          const matches: Array<{ line: string; lineNumber: number; content: string }> = [];

          lines.forEach((line, index) => {
            if (regex.test(line)) {
              matches.push({
                line: line.trim(),
                lineNumber: index + 1,
                content: line,
              });
            }
          });

          if (matches.length > 0) {
            results.push({
              path: fullPath,
              relativePath: path.relative(workspaceRoot, fullPath),
              matches,
            });
          }
        } catch (error) {
          // Skip files that can't be read as text
          continue;
        }
      }
    }
  }

  await searchDir(safeRoot);
  return results;
}

/**
 * Build a file tree recursively
 */
export async function buildTree(
  rootPath: string,
  workspaceRoot: string,
  depth: number = 0
): Promise<FileNode> {
  const safePath = validatePath(rootPath, workspaceRoot);

  // Check if path exists (handle ENOENT gracefully)
  let stats;
  try {
    stats = await fs.stat(safePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory/file was deleted - throw a specific error
      throw new Error(`Path no longer exists: ${safePath}`);
    }
    throw error;
  }

  const name = path.basename(safePath);

  if (!stats.isDirectory()) {
    return {
      id: uuidv4(),
      name,
      path: safePath,
      relativePath: path.relative(workspaceRoot, safePath),
      type: 'file',
      extension: path.extname(safePath),
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  }

  // Build directory node
  const node: FileNode = {
    id: uuidv4(),
    name,
    path: safePath,
    relativePath: path.relative(workspaceRoot, safePath),
    type: 'folder',
    children: [],
  };

  // Stop recursion at max depth
  if (depth >= MAX_TREE_DEPTH) {
    return node;
  }

  // Read directory contents
  const entries = await fs.readdir(safePath, { withFileTypes: true });

  // Separate folders and files
  const folders: typeof entries = [];
  const files: typeof entries = [];

  for (const entry of entries) {
    if (shouldIgnore(entry.name, entry.isDirectory())) {
      continue;
    }

    if (entry.isDirectory()) {
      folders.push(entry);
    } else {
      files.push(entry);
    }
  }

  // Sort both alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  // Process folders first, then files
  for (const folder of folders) {
    const childPath = path.join(safePath, folder.name);
    try {
      const childNode = await buildTree(childPath, workspaceRoot, depth + 1);
      node.children!.push(childNode);
    } catch (error) {
      // Skip folders that can't be read
      continue;
    }
  }

  for (const file of files) {
    const childPath = path.join(safePath, file.name);
    try {
      const childStats = await fs.stat(childPath);
      node.children!.push({
        id: uuidv4(),
        name: file.name,
        path: childPath,
        relativePath: path.relative(workspaceRoot, childPath),
        type: 'file',
        extension: path.extname(file.name),
        size: childStats.size,
        modified: childStats.mtime.toISOString(),
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return node;
}
