/**
 * Neural Dark Theme for Monaco Editor
 *
 * Custom theme matching the NeuralIDE design system:
 * - Dark purple-black backgrounds
 * - Purple accents and keywords
 * - Vibrant syntax highlighting
 * - Subtle selection and highlight colors
 */

import type { editor } from 'monaco-editor';

export const neuralDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Comments
    { token: 'comment', foreground: '55556b', fontStyle: 'italic' },
    { token: 'comment.block', foreground: '55556b', fontStyle: 'italic' },
    { token: 'comment.line', foreground: '55556b', fontStyle: 'italic' },

    // Keywords
    { token: 'keyword', foreground: '7b68ee', fontStyle: 'bold' },
    { token: 'keyword.control', foreground: 'ff79c6' },
    { token: 'keyword.operator', foreground: 'ff79c6' },

    // Strings
    { token: 'string', foreground: '50fa7b' },
    { token: 'string.template', foreground: '50fa7b' },
    { token: 'string.escape', foreground: '8be9fd' },
    { token: 'string.regexp', foreground: 'ffb86c' },

    // Numbers
    { token: 'number', foreground: 'ffb86c' },
    { token: 'number.hex', foreground: 'ffb86c' },
    { token: 'number.binary', foreground: 'ffb86c' },
    { token: 'number.octal', foreground: 'ffb86c' },

    // Types and Classes
    { token: 'type', foreground: '8be9fd' },
    { token: 'type.identifier', foreground: '8be9fd' },
    { token: 'class', foreground: '8be9fd' },
    { token: 'class.name', foreground: '8be9fd' },
    { token: 'interface', foreground: '8be9fd' },
    { token: 'enum', foreground: '8be9fd' },

    // Functions
    { token: 'function', foreground: 'bd93f9' },
    { token: 'function.name', foreground: 'bd93f9' },
    { token: 'method', foreground: 'bd93f9' },

    // Variables
    { token: 'variable', foreground: 'eeeef5' },
    { token: 'variable.name', foreground: 'eeeef5' },
    { token: 'variable.parameter', foreground: 'ffb86c' },
    { token: 'variable.predefined', foreground: 'bd93f9' },

    // Operators and Delimiters
    { token: 'operator', foreground: 'ff79c6' },
    { token: 'delimiter', foreground: '9999bb' },
    { token: 'delimiter.bracket', foreground: '9999bb' },
    { token: 'delimiter.paren', foreground: '9999bb' },

    // Constants
    { token: 'constant', foreground: 'ffb86c' },
    { token: 'constant.language', foreground: 'bd93f9' },
    { token: 'constant.numeric', foreground: 'ffb86c' },

    // Tags (HTML/XML)
    { token: 'tag', foreground: 'ff79c6' },
    { token: 'tag.id', foreground: '8be9fd' },
    { token: 'tag.class', foreground: '50fa7b' },

    // Attributes
    { token: 'attribute.name', foreground: '50fa7b' },
    { token: 'attribute.value', foreground: '50fa7b' },

    // Identifiers
    { token: 'identifier', foreground: 'eeeef5' },

    // Meta
    { token: 'meta', foreground: '9999bb' },
    { token: 'meta.tag', foreground: 'ff79c6' },
  ],
  colors: {
    // Editor background and foreground
    'editor.background': '#0d0d14',
    'editor.foreground': '#eeeef5',

    // Line highlighting
    'editor.lineHighlightBackground': '#16161f',
    'editor.lineHighlightBorder': '#00000000',

    // Selection
    'editor.selectionBackground': '#3d358040',
    'editor.selectionForeground': '#eeeef5',
    'editor.inactiveSelectionBackground': '#3d358020',
    'editor.selectionHighlightBackground': '#3d358030',

    // Line numbers
    'editorLineNumber.foreground': '#2a2a3d',
    'editorLineNumber.activeForeground': '#9999bb',

    // Cursor
    'editorCursor.foreground': '#7b68ee',
    'editorCursor.background': '#0d0d14',

    // Find/search
    'editor.findMatchBackground': '#3d358060',
    'editor.findMatchHighlightBackground': '#3d358030',
    'editor.findRangeHighlightBackground': '#3d358020',
    'editor.findMatchBorder': '#7b68ee',

    // Gutter
    'editorGutter.background': '#0d0d14',
    'editorGutter.modifiedBackground': '#50fa7b60',
    'editorGutter.addedBackground': '#50fa7b60',
    'editorGutter.deletedBackground': '#ff555560',

    // Indent guides
    'editorIndentGuide.background': '#2a2a3d',
    'editorIndentGuide.activeBackground': '#3d3d58',

    // Bracket matching
    'editorBracketMatch.background': '#3d358040',
    'editorBracketMatch.border': '#7b68ee',

    // Widgets (autocomplete, hover, etc.)
    'editorWidget.background': '#16161f',
    'editorWidget.border': '#2a2a3d',
    'editorWidget.foreground': '#eeeef5',

    // Suggest widget (autocomplete)
    'editorSuggestWidget.background': '#16161f',
    'editorSuggestWidget.border': '#2a2a3d',
    'editorSuggestWidget.foreground': '#eeeef5',
    'editorSuggestWidget.selectedBackground': '#3d358040',
    'editorSuggestWidget.highlightForeground': '#7b68ee',

    // Hover widget
    'editorHoverWidget.background': '#16161f',
    'editorHoverWidget.border': '#2a2a3d',
    'editorHoverWidget.foreground': '#eeeef5',

    // Scrollbar
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#2a2a3d80',
    'scrollbarSlider.hoverBackground': '#3d3d58',
    'scrollbarSlider.activeBackground': '#7b68ee60',

    // Minimap
    'minimap.background': '#0d0d14',
    'minimap.selectionHighlight': '#3d358040',
    'minimap.findMatchHighlight': '#3d358060',

    // Overview ruler (scrollbar side decorations)
    'editorOverviewRuler.border': '#00000000',
    'editorOverviewRuler.findMatchForeground': '#7b68ee80',
    'editorOverviewRuler.selectionHighlightForeground': '#3d358080',

    // Error/warning squiggles
    'editorError.foreground': '#ff5555',
    'editorWarning.foreground': '#ffb86c',
    'editorInfo.foreground': '#8be9fd',
    'editorHint.foreground': '#9999bb',

    // Code lens
    'editorCodeLens.foreground': '#9999bb',

    // Whitespace
    'editorWhitespace.foreground': '#2a2a3d',

    // Rulers
    'editorRuler.foreground': '#2a2a3d',
  },
};
