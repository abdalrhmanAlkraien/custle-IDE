/**
 * Language Map - File Extension to Monaco Language ID
 *
 * Maps file extensions to Monaco Editor language identifiers
 * for proper syntax highlighting.
 */

/**
 * Get Monaco language ID from file path
 * @param filePath - Full file path or filename
 * @returns Monaco language identifier (e.g., 'typescript', 'python', etc.)
 */
export function getLanguageFromPath(filePath: string): string {
  // Extract extension (lowercase, without dot)
  const match = filePath.match(/\.([^.]+)$/);
  if (!match) return 'plaintext';

  const ext = match[1].toLowerCase();

  // Language mapping
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    mts: 'typescript',
    cts: 'typescript',

    // Python
    py: 'python',
    pyw: 'python',
    pyi: 'python',

    // Web
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Markup
    json: 'json',
    jsonc: 'json',
    json5: 'json',
    xml: 'xml',
    svg: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    markdown: 'markdown',
    mdx: 'markdown',

    // Shell
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',

    // C/C++
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    hxx: 'cpp',

    // Java/Kotlin/Scala
    java: 'java',
    kt: 'kotlin',
    kts: 'kotlin',
    scala: 'scala',
    sc: 'scala',

    // C#/F#
    cs: 'csharp',
    csx: 'csharp',
    fs: 'fsharp',
    fsx: 'fsharp',
    fsi: 'fsharp',

    // Go/Rust
    go: 'go',
    rs: 'rust',

    // Ruby/PHP
    rb: 'ruby',
    php: 'php',
    php3: 'php',
    php4: 'php',
    php5: 'php',
    phtml: 'php',

    // SQL
    sql: 'sql',
    mysql: 'mysql',
    pgsql: 'pgsql',

    // R/Julia
    r: 'r',
    jl: 'julia',

    // Lua/Perl
    lua: 'lua',
    pl: 'perl',
    pm: 'perl',

    // Swift/Objective-C
    swift: 'swift',
    m: 'objective-c',
    mm: 'objective-c',

    // Dart
    dart: 'dart',

    // Docker/Config
    dockerfile: 'dockerfile',
    dockerignore: 'ignore',
    gitignore: 'ignore',
    env: 'dotenv',

    // Text/Log
    txt: 'plaintext',
    text: 'plaintext',
    log: 'log',

    // Other
    graphql: 'graphql',
    gql: 'graphql',
    proto: 'protobuf',
    vue: 'html', // Vue components as HTML
    svelte: 'html', // Svelte components as HTML
  };

  return languageMap[ext] || 'plaintext';
}

/**
 * Get color for language indicator dot in tabs
 * @param language - Monaco language identifier
 * @returns Tailwind color class
 */
export function getLanguageColor(language: string): string {
  const colorMap: Record<string, string> = {
    javascript: 'bg-yellow-400',
    typescript: 'bg-blue-400',
    python: 'bg-blue-500',
    html: 'bg-orange-500',
    css: 'bg-blue-600',
    scss: 'bg-pink-500',
    sass: 'bg-pink-500',
    less: 'bg-blue-700',
    json: 'bg-yellow-500',
    xml: 'bg-orange-600',
    yaml: 'bg-purple-400',
    markdown: 'bg-gray-400',
    shell: 'bg-green-500',
    c: 'bg-blue-700',
    cpp: 'bg-blue-600',
    java: 'bg-red-500',
    kotlin: 'bg-purple-500',
    csharp: 'bg-green-600',
    go: 'bg-cyan-500',
    rust: 'bg-orange-600',
    ruby: 'bg-red-600',
    php: 'bg-indigo-500',
    sql: 'bg-orange-500',
    swift: 'bg-orange-400',
    dart: 'bg-cyan-600',
    plaintext: 'bg-gray-500',
    log: 'bg-gray-600',
  };

  return colorMap[language] || 'bg-gray-500';
}

/**
 * Check if a file is a text file (editable in Monaco)
 * @param filePath - Full file path or filename
 * @returns True if file is likely text-based
 */
export function isTextFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;

  // Binary file extensions (not editable)
  const binaryExtensions = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'ico',
    'svg',
    'webp',
    'mp3',
    'mp4',
    'wav',
    'avi',
    'mov',
    'mkv',
    'pdf',
    'zip',
    'tar',
    'gz',
    'rar',
    '7z',
    'exe',
    'dll',
    'so',
    'dylib',
    'bin',
    'dat',
    'db',
    'sqlite',
    'woff',
    'woff2',
    'ttf',
    'eot',
    'otf',
  ]);

  return !binaryExtensions.has(ext);
}
