/**
 * AI Inline Completion Provider
 * Provides Monaco inline completions with debouncing and context
 */

import * as monaco from 'monaco-editor';
import { useCompletionStore } from '@/store/completionStore';

const API_BASE = 'http://localhost:3001';
const DEBOUNCE_MS = 700;
const CONTEXT_LINES_BEFORE = 50;
const CONTEXT_LINES_AFTER = 10;

let abortController: AbortController | null = null;
let debounceTimeout: NodeJS.Timeout | null = null;
let completionStats = {
  accepted: 0,
  dismissed: 0,
  total: 0,
};

/**
 * Get completion from backend
 */
async function getCompletion(
  prefix: string,
  suffix: string,
  language: string,
  filePath: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/completion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, suffix, language, filePath }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Completion failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.completion || '';
}

/**
 * Extract context around cursor
 */
function extractContext(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): { prefix: string; suffix: string } {
  const lineCount = model.getLineCount();
  const currentLine = position.lineNumber;
  const currentColumn = position.column;

  // Get lines before cursor (up to CONTEXT_LINES_BEFORE)
  const startLine = Math.max(1, currentLine - CONTEXT_LINES_BEFORE);
  const beforeLines: string[] = [];

  for (let i = startLine; i < currentLine; i++) {
    beforeLines.push(model.getLineContent(i));
  }

  // Add current line up to cursor
  const currentLineContent = model.getLineContent(currentLine);
  const beforeCursor = currentLineContent.substring(0, currentColumn - 1);
  beforeLines.push(beforeCursor);

  const prefix = beforeLines.join('\n');

  // Get lines after cursor (up to CONTEXT_LINES_AFTER)
  const afterCursor = currentLineContent.substring(currentColumn - 1);
  const endLine = Math.min(lineCount, currentLine + CONTEXT_LINES_AFTER);
  const afterLines: string[] = [afterCursor];

  for (let i = currentLine + 1; i <= endLine; i++) {
    afterLines.push(model.getLineContent(i));
  }

  const suffix = afterLines.join('\n');

  return { prefix, suffix };
}

/**
 * Create inline completion provider
 */
export function createInlineCompletionProvider(): monaco.languages.InlineCompletionsProvider<monaco.languages.InlineCompletions> {
  return {
    provideInlineCompletions: async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _context: monaco.languages.InlineCompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.InlineCompletions | undefined> => {
      // Cancel any pending request
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller
      abortController = new AbortController();
      const signal = abortController.signal;

      // Clear existing debounce timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      return new Promise((resolve) => {
        // Debounce: wait 700ms before making request
        debounceTimeout = setTimeout(async () => {
          try {
            // Check if cancelled
            if (token.isCancellationRequested || signal.aborted) {
              resolve(undefined);
              return;
            }

            // Set fetching status
            useCompletionStore.getState().setFetching();

            // Extract context
            const { prefix, suffix } = extractContext(model, position);
            const language = model.getLanguageId();
            const filePath = model.uri.path;

            // Get completion from backend
            const completion = await getCompletion(prefix, suffix, language, filePath, signal);

            // Check if cancelled after request
            if (token.isCancellationRequested || signal.aborted) {
              useCompletionStore.getState().setIdle();
              resolve(undefined);
              return;
            }

            // Return completion if not empty
            if (completion && completion.trim().length > 0) {
              completionStats.total++;

              // Set accepted status when completion is shown
              // Note: This will be shown as "available", actual acceptance tracked separately
              useCompletionStore.getState().setAccepted(completion);

              resolve({
                items: [
                  {
                    insertText: completion,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  },
                ],
              });
            } else {
              useCompletionStore.getState().setIdle();
              resolve(undefined);
            }
          } catch (error: any) {
            if (error.name === 'AbortError') {
              // Request was cancelled, that's ok
              useCompletionStore.getState().setIdle();
              resolve(undefined);
            } else {
              console.error('Completion error:', error);
              useCompletionStore.getState().setIdle();
              resolve(undefined);
            }
          }
        }, DEBOUNCE_MS);
      });
    },

    disposeInlineCompletions: () => {
      // Cleanup function
    },
  };
}

/**
 * Register inline completion provider for all languages
 */
export function registerInlineCompletionProvider(): monaco.IDisposable {
  const provider = createInlineCompletionProvider();

  // Register for all languages
  return monaco.languages.registerInlineCompletionsProvider({ pattern: '**' }, provider);
}

/**
 * Get completion statistics
 */
export function getCompletionStats() {
  return { ...completionStats };
}

/**
 * Log completion acceptance
 */
export function logCompletionAccepted() {
  completionStats.accepted++;
}

/**
 * Log completion dismissal
 */
export function logCompletionDismissed() {
  completionStats.dismissed++;
}

/**
 * Reset statistics
 */
export function resetCompletionStats() {
  completionStats = {
    accepted: 0,
    dismissed: 0,
    total: 0,
  };
}
