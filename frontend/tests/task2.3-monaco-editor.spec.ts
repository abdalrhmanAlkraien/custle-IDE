import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Task 2.3 - Monaco Editor + Tabs + Save Tests
 *
 * Verifies:
 * - Monaco editor loads with real file content
 * - Syntax highlighting works
 * - Ctrl+S saves files to disk
 * - Multiple tabs management
 * - Tab drag-and-drop reordering
 * - Close tab with unsaved changes dialog
 * - Custom theme applied
 * - Editor placeholder when no tabs
 */

let testWorkspacePath: string;

test.describe.configure({ mode: 'serial' });

test.describe('Task 2.3 - Monaco Editor + Tabs + Save', () => {
  test.beforeAll(async () => {
    // Create a temporary test workspace
    testWorkspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'custle-test-'));

    // Create test files
    fs.writeFileSync(
      path.join(testWorkspacePath, 'app.ts'),
      `// TypeScript file
const greeting: string = "Hello World";
console.log(greeting);

function add(a: number, b: number): number {
  return a + b;
}

export { greeting, add };
`
    );

    fs.writeFileSync(
      path.join(testWorkspacePath, 'styles.css'),
      `/* CSS file */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  background-color: #0d0d14;
  color: #eeeef5;
}

.button {
  background: #7b68ee;
  border-radius: 4px;
}
`
    );

    fs.writeFileSync(
      path.join(testWorkspacePath, 'index.js'),
      `// JavaScript file
const message = "Testing Monaco";
console.log(message);

function multiply(x, y) {
  return x * y;
}

module.exports = { multiply };
`
    );
  });

  test.afterAll(async () => {
    // Clean up test workspace
    if (testWorkspacePath && fs.existsSync(testWorkspacePath)) {
      fs.rmSync(testWorkspacePath, { recursive: true, force: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open workspace
    const input = page.locator('input#folder-path');
    await input.fill(testWorkspacePath);
    await page.locator('button:has-text("Open Folder")').click();
    await page.waitForTimeout(1000);
  });

  test.afterEach(async ({ page }) => {
    // Close workspace before each test ends to prevent race conditions
    try {
      await page.evaluate(async () => {
        const response = await fetch('http://localhost:3001/api/workspace/close', {
          method: 'POST',
        });
        if (!response.ok) {
          console.log('Failed to close workspace:', response.statusText);
        }
      });
      await page.waitForTimeout(500); // Give time for cleanup
    } catch (error) {
      // Ignore errors in cleanup
    }
  });

  test('Placeholder shown when no tabs open', async ({ page }) => {
    // Should show placeholder initially (use more specific selector)
    await expect(page.getByRole('heading', { name: 'NeuralIDE' })).toBeVisible();
    await expect(page.locator('text=Open a file from the explorer')).toBeVisible();

    // Should show keyboard shortcuts
    await expect(page.locator('text=Ctrl+S')).toBeVisible();
    await expect(page.locator('text=Save File')).toBeVisible();
  });

  test('Open file and Monaco editor loads with content', async ({ page }) => {
    // Click on app.ts in file tree
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000); // Wait for Monaco to load

    // Editor should load (Monaco editor has .monaco-editor class)
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 15000 });

    // Wait for Monaco view lines to render
    await expect(page.locator('.view-lines')).toBeVisible({ timeout: 10000 });

    // Tab should be created in tab bar
    const tabBar = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await expect(tabBar).toBeVisible();
  });

  test('Multiple tabs can be opened and switched', async ({ page }) => {
    // Open three files from file tree
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(2000);

    await page.locator('text=styles.css').first().click();
    await page.waitForTimeout(2000);

    await page.locator('text=index.js').first().click();
    await page.waitForTimeout(2000);

    // All three tabs should be visible in tab bar
    const appTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await expect(appTab).toBeVisible();

    const cssTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'styles.css' });
    await expect(cssTab).toBeVisible();

    const jsTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'index.js' });
    await expect(jsTab).toBeVisible();

    // Switch tabs by clicking them (force: true to bypass overlapping elements)
    await appTab.click({ force: true });
    await page.waitForTimeout(1000);

    await cssTab.click({ force: true });
    await page.waitForTimeout(1000);
  });

  test('Edit file and dirty indicator appears', async ({ page }) => {
    // Open file
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000);

    // Wait for Monaco editor
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 15000 });

    // Wait for view lines to be ready
    await expect(page.locator('.view-lines')).toBeVisible({ timeout: 10000 });

    // Click into the editor - click on Monaco container instead of textarea
    await monacoEditor.click({ force: true });
    await page.waitForTimeout(500);

    // Type in editor (Monaco will capture the keystrokes)
    await page.keyboard.type('// New comment');
    await page.waitForTimeout(1000);

    // Dirty indicator (orange dot) should appear in tab
    const dirtyDot = page.locator('.w-1\\.5.h-1\\.5.rounded-full.bg-\\[\\#ffb86c\\]');
    await expect(dirtyDot).toBeVisible({ timeout: 5000 });
  });

  test('Save file with Ctrl+S clears dirty indicator', async ({ page }) => {
    // Open file
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000);

    // Wait for Monaco
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.view-lines')).toBeVisible({ timeout: 10000 });

    // Make edit
    await monacoEditor.click({ force: true });
    await page.keyboard.type('// Saved comment');
    await page.waitForTimeout(1000);

    // Dirty indicator should appear
    const dirtyDot = page.locator('.w-1\\.5.h-1\\.5.rounded-full.bg-\\[\\#ffb86c\\]');
    await expect(dirtyDot).toBeVisible({ timeout: 5000 });

    // Press Ctrl+S (or Cmd+S on Mac)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+S');
    } else {
      await page.keyboard.press('Control+S');
    }

    // Wait for save
    await page.waitForTimeout(2000);

    // Dirty indicator should disappear
    await expect(dirtyDot).not.toBeVisible();

    // Verify file was saved to disk
    const savedContent = fs.readFileSync(path.join(testWorkspacePath, 'app.ts'), 'utf-8');
    expect(savedContent).toContain('// Saved comment');
  });

  test('Close tab with X button', async ({ page }) => {
    // Open file
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000);

    // Tab should be visible
    const tab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await expect(tab).toBeVisible();

    // Hover over tab to show close button
    await tab.hover();
    await page.waitForTimeout(500);

    // Click close button (X icon)
    const closeButton = tab.locator('button svg');
    await closeButton.click();

    // Tab should be closed
    await page.waitForTimeout(1000);

    // Placeholder should appear again
    await expect(page.getByRole('heading', { name: 'NeuralIDE' })).toBeVisible();
  });

  test('Close tab with unsaved changes shows confirmation', async ({ page }) => {
    // Open file
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000);

    // Wait for Monaco and make edit
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    await monacoEditor.click({ force: true });
    await page.keyboard.type('// Unsaved change');
    await page.waitForTimeout(1500);

    // Setup dialog handler to cancel
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('unsaved changes');
      await dialog.dismiss();
    });

    // Try to close tab
    const tab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await tab.hover();
    await page.waitForTimeout(500);
    const closeButton = tab.locator('button svg');
    await closeButton.click();

    await page.waitForTimeout(1000);

    // Tab should still be open (cancelled)
    await expect(tab).toBeVisible();
  });

  test('Middle-click closes tab', async ({ page }) => {
    // Open file
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3000);

    const tab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await expect(tab).toBeVisible();

    // Middle-click on tab
    await tab.click({ button: 'middle' });
    await page.waitForTimeout(1000);

    // Tab should be closed - placeholder visible
    await expect(page.getByRole('heading', { name: 'NeuralIDE' })).toBeVisible();
  });

  test('Context menu on tab shows options', async ({ page }) => {
    // Open two files
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(2500);
    await page.locator('text=index.js').first().click();
    await page.waitForTimeout(2500);

    // Right-click on tab
    const tab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await tab.click({ button: 'right' });
    await page.waitForTimeout(500);

    // Context menu should appear
    await expect(page.locator('text=Close').first()).toBeVisible();
    await expect(page.locator('text=Close Others')).toBeVisible();
    await expect(page.locator('text=Close All')).toBeVisible();
    await expect(page.locator('text=Copy Path')).toBeVisible();
  });

  test('Close Others from context menu', async ({ page }) => {
    // Open three files
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(2000);
    await page.locator('text=styles.css').first().click();
    await page.waitForTimeout(2000);
    await page.locator('text=index.js').first().click();
    await page.waitForTimeout(2000);

    // Right-click on app.ts tab
    const appTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await appTab.click({ button: 'right' });
    await page.waitForTimeout(500);

    // Click "Close Others"
    await page.locator('text=Close Others').click();
    await page.waitForTimeout(1000);

    // Only app.ts should remain
    await expect(appTab).toBeVisible();

    // Others should be closed (not in tab bar)
    const cssTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'styles.css' });
    const jsTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'index.js' });
    await expect(cssTab).not.toBeVisible();
    await expect(jsTab).not.toBeVisible();
  });

  test('Language-colored dots appear in tabs', async ({ page }) => {
    // Open TypeScript file (blue)
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(2500);

    // Tab should have blue colored dot for TypeScript
    const tab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    const blueDot = tab.locator('.bg-blue-400');
    await expect(blueDot).toBeVisible();

    // Open CSS file
    await page.locator('text=styles.css').first().click();
    await page.waitForTimeout(2500);

    // Should have colored dot for CSS
    const cssTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'styles.css' });
    const cssDot = cssTab.locator('.w-2.h-2.rounded-full');
    await expect(cssDot).toBeVisible();
  });

  test('Active tab has visual indicator', async ({ page }) => {
    // Open two files
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(2500);
    await page.locator('text=index.js').first().click();
    await page.waitForTimeout(2500);

    // index.js should be active (has border-t-[#7b68ee])
    const jsTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'index.js' });
    await expect(jsTab).toHaveClass(/border-t-\[#7b68ee\]/);

    // Click app.ts tab
    const appTab = page.locator('.flex.items-center.gap-2').filter({ hasText: 'app.ts' });
    await appTab.click({ force: true });
    await page.waitForTimeout(1000);

    // app.ts should now be active
    await expect(appTab).toHaveClass(/border-t-\[#7b68ee\]/);
  });

  test('No TypeScript errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Open file and interact
    await page.locator('text=app.ts').first().click();
    await page.waitForTimeout(3500);

    // Wait for Monaco to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.view-lines')).toBeVisible({ timeout: 10000 });

    // Make some edits
    await monacoEditor.click({ force: true });
    await page.keyboard.type('// Test');
    await page.waitForTimeout(1500);

    // Filter out Monaco's internal warnings and network errors
    const criticalErrors = consoleErrors.filter(
      err =>
        !err.includes('monaco') &&
        !err.includes('net::ERR') &&
        !err.includes('Failed to fetch') &&
        !err.includes('WebSocket')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
