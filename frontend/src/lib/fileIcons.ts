import {
  FileText,
  FileCode,
  FileJson,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  Folder,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

/**
 * Get icon for a file based on its extension
 */
export function getFileIcon(fileName: string): LucideIcon {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, LucideIcon> = {
    // Code files
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    py: FileCode,
    java: FileCode,
    c: FileCode,
    cpp: FileCode,
    h: FileCode,
    hpp: FileCode,
    rs: FileCode,
    go: FileCode,
    rb: FileCode,
    php: FileCode,
    swift: FileCode,
    kt: FileCode,
    cs: FileCode,
    vue: FileCode,
    svelte: FileCode,

    // Config files
    json: FileJson,
    jsonc: FileJson,
    yaml: FileCode,
    yml: FileCode,
    toml: FileCode,
    xml: FileCode,

    // Markup
    html: FileCode,
    htm: FileCode,
    css: FileCode,
    scss: FileCode,
    sass: FileCode,
    less: FileCode,
    md: FileText,
    markdown: FileText,
    txt: FileText,

    // Images
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    svg: FileImage,
    ico: FileImage,
    webp: FileImage,

    // Video
    mp4: FileVideo,
    mov: FileVideo,
    avi: FileVideo,
    webm: FileVideo,

    // Archives
    zip: FileArchive,
    tar: FileArchive,
    gz: FileArchive,
    rar: FileArchive,
    '7z': FileArchive,
  };

  return iconMap[ext || ''] || File;
}

/**
 * Get folder icon based on open state
 */
export function getFolderIcon(isOpen: boolean): LucideIcon {
  return isOpen ? FolderOpen : Folder;
}

/**
 * Get file icon color based on extension
 */
export function getFileIconColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const colorMap: Record<string, string> = {
    // JavaScript/TypeScript - Yellow
    js: 'text-yellow-500',
    jsx: 'text-yellow-500',
    ts: 'text-blue-500',
    tsx: 'text-blue-500',

    // Python - Blue
    py: 'text-blue-400',

    // Markup - Orange
    html: 'text-orange-500',
    css: 'text-blue-400',
    scss: 'text-pink-500',
    sass: 'text-pink-500',

    // Config - Gray
    json: 'text-gray-500',
    yaml: 'text-gray-500',
    yml: 'text-gray-500',

    // Markdown - White
    md: 'text-gray-300',
    txt: 'text-gray-400',

    // Images - Purple
    png: 'text-purple-500',
    jpg: 'text-purple-500',
    jpeg: 'text-purple-500',
    gif: 'text-purple-500',
    svg: 'text-purple-400',
  };

  return colorMap[ext || ''] || 'text-gray-400';
}
