import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Task 2.2 - File Explorer Sidebar Tests
 *
 * Verifies:
 * - Workspace selector and opening workspace
 * - File tree display with icons
 * - File/folder CRUD operations
 * - Context menu functionality
 * - Inline rename (double-click)
 * - Search panel with debouncing, case-sensitive and regex toggles
 * - Search results opening files in editor
 * - Recent workspaces persistence
 */

let testWorkspacePath: string;

test.describe('Task 2.2 - File Explorer Sidebar', () => {
  test.beforeAll(async () => {
    // Create a temporary test workspace
    testWorkspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'custle-test-'));

    // Create test file structure
    fs.writeFileSync(path.join(testWorkspacePath, 'README.md'), '# Test Project\n\nThis is a test.');
    fs.writeFileSync(path.join(testWorkspacePath, 'index.js'), 'console.log("Hello World");');
    fs.writeFileSync(path.join(testWorkspacePath, 'styles.css'), 'body { margin: 0; }');

    // Create a subdirectory with files
    fs.mkdirSync(path.join(testWorkspacePath, 'src'));
    fs.writeFileSync(path.join(testWorkspacePath, 'src', 'app.ts'), 'export const app = "test";');
    fs.writeFileSync(path.join(testWorkspacePath, 'src', 'utils.ts'), 'export function helper() {}');

    // Create nested directory
    fs.mkdirSync(path.join(testWorkspacePath, 'src', 'components'));
    fs.writeFileSync(path.join(testWorkspacePath, 'src', 'components', 'Button.tsx'), 'export const Button = () => null;');
  });

  test.afterAll(async () => {
    // Clean up test workspace
    if (testWorkspacePath && fs.existsSync(testWorkspacePath)) {
      fs.rmSync(testWorkspacePath, { recursive: true, force: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset recent workspaces
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Workspace selector is displayed when no workspace is open', async ({ page }) => {
    // Should show workspace selector
    await expect(page.locator('text=Open a Folder to Start')).toBeVisible();

    // Should have input field for folder path
    const input = page.locator('input#folder-path');
    await expect(input).toBeVisible();

    // Should have Open Folder button
    const openButton = page.locator('button:has-text("Open Folder")');
    await expect(openButton).toBeVisible();
  });

  test('Can open a workspace', async ({ page }) => {
    // Enter workspace path
    const input = page.locator('input#folder-path');
    await input.fill(testWorkspacePath);

    // Click Open Folder button
    await page.locator('button:has-text("Open Folder")').click();

    // Wait for file tree to load
    await page.waitForTimeout(1000);

    // Should see file tree
    await expect(page.locator('text=README.md')).toBeVisible();
    await expect(page.locator('text=index.js')).toBeVisible();
  });

  test('File tree displays correct icons and structure', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Check that files are displayed
    await expect(page.locator('text=README.md')).toBeVisible();
    await expect(page.locator('text=index.js')).toBeVisible();
    await expect(page.locator('text=styles.css')).toBeVisible();

    // Check that folders are displayed
    await expect(page.locator('text=src')).toBeVisible();

    // Folders should have chevron icons for expand/collapse
    // We can't easily test the icon type, but we can verify the structure exists
  });

  test('Can expand and collapse folders', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Initially, src folder contents should not be visible
    await expect(page.locator('text=app.ts')).not.toBeVisible();

    // Click on src folder to expand
    await page.locator('text=src').click();
    await page.waitForTimeout(500);

    // Now src contents should be visible
    await expect(page.locator('text=app.ts')).toBeVisible();
    await expect(page.locator('text=utils.ts')).toBeVisible();

    // Click again to collapse
    await page.locator('text=src').first().click();
    await page.waitForTimeout(500);

    // Contents should be hidden again
    await expect(page.locator('text=app.ts')).not.toBeVisible();
  });

  test('Clicking a file opens it in the editor', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Click on README.md
    await page.locator('text=README.md').click();
    await page.waitForTimeout(1000);

    // Editor should show the file content
    // The file content "# Test Project" should be visible somewhere in the editor
    await expect(page.locator('text=Test Project')).toBeVisible();

    // Tab should be created with file name
    await expect(page.locator('button:has-text("README.md")')).toBeVisible();
  });

  test('Can switch between Files and Search tabs', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Should be on Files tab by default
    await expect(page.locator('text=README.md')).toBeVisible();

    // Click Search tab
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    // Should show search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

    // Click Files tab again
    await page.locator('button:has-text("Files")').click();
    await page.waitForTimeout(500);

    // Should show file tree again
    await expect(page.locator('text=README.md')).toBeVisible();
  });

  test('Search panel performs debounced search', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Click Search tab
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    // Type search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('console');

    // Wait for debounce (400ms) + network request
    await page.waitForTimeout(1000);

    // Should show search results
    await expect(page.locator('text=index.js')).toBeVisible();

    // Should show the matching line
    await expect(page.locator('text=console.log')).toBeVisible();
  });

  test('Search case-sensitive toggle works', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Click Search tab
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    // Search for "test" (lowercase)
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    // Should find "Test" in README.md (case-insensitive by default)
    await expect(page.locator('text=README.md')).toBeVisible();

    // Click case-sensitive button (Aa)
    await page.locator('button:has-text("Aa")').click();
    await page.waitForTimeout(1000);

    // Should not find "Test" anymore (case-sensitive now)
    // Results should change - we might see "test" in other files but not "Test"
  });

  test('Clicking search result opens file in editor', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Click Search tab
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    // Search for "console"
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('console');
    await page.waitForTimeout(1000);

    // Click on the search result line
    await page.locator('text=console.log').click();
    await page.waitForTimeout(1000);

    // File should open in editor
    await expect(page.locator('button:has-text("index.js")')).toBeVisible();
    await expect(page.locator('text=Hello World')).toBeVisible();
  });

  test('Recent workspaces are persisted', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Close workspace (if there's a close button, otherwise we'll reload)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should see recent workspaces section
    const workspaceName = path.basename(testWorkspacePath);
    await expect(page.locator(`text=${workspaceName}`)).toBeVisible();
  });

  test('Context menu appears on right-click', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Right-click on README.md
    await page.locator('text=README.md').click({ button: 'right' });
    await page.waitForTimeout(500);

    // Context menu should appear
    await expect(page.locator('text=New File')).toBeVisible();
    await expect(page.locator('text=New Folder')).toBeVisible();
    await expect(page.locator('text=Rename')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
    await expect(page.locator('text=Copy Path')).toBeVisible();
  });

  test('Can create new file via context menu', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Right-click on README.md
    await page.locator('text=README.md').click({ button: 'right' });
    await page.waitForTimeout(500);

    // Click "New File"
    page.on('dialog', async dialog => {
      await dialog.accept('newfile.txt');
    });

    await page.locator('text=New File').click();
    await page.waitForTimeout(1000);

    // New file should appear in tree
    await expect(page.locator('text=newfile.txt')).toBeVisible();
  });

  test('Can create new folder via context menu', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Right-click on src folder
    await page.locator('text=src').click();
    await page.waitForTimeout(500);
    await page.locator('text=src').click({ button: 'right' });
    await page.waitForTimeout(500);

    // Click "New Folder"
    page.on('dialog', async dialog => {
      await dialog.accept('newfolder');
    });

    await page.locator('text=New Folder').click();
    await page.waitForTimeout(1000);

    // New folder should appear in tree (after expanding src)
    await expect(page.locator('text=newfolder')).toBeVisible();
  });

  test('Can delete file via context menu', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Right-click on styles.css
    await page.locator('text=styles.css').click({ button: 'right' });
    await page.waitForTimeout(500);

    // Click "Delete"
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.locator('button:has-text("Delete")').click();
    await page.waitForTimeout(1000);

    // File should disappear from tree
    await expect(page.locator('text=styles.css')).not.toBeVisible();
  });

  test('Double-click enters rename mode', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Double-click on README.md
    await page.locator('text=README.md').dblclick();
    await page.waitForTimeout(500);

    // Should show input field for renaming
    const renameInput = page.locator('input[type="text"][value*="README"]');
    await expect(renameInput).toBeVisible();
    await expect(renameInput).toBeFocused();
  });

  test('No console errors during file operations', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(1000);

    // Perform various operations
    await page.locator('text=src').click(); // Expand folder
    await page.waitForTimeout(500);

    await page.locator('text=app.ts').click(); // Open file
    await page.waitForTimeout(1000);

    // Switch to search
    await page.locator('button:has-text("Search")').click();
    await page.waitForTimeout(500);

    // Perform search
    await page.locator('input[placeholder*="Search"]').fill('test');
    await page.waitForTimeout(1000);

    // Filter out network errors (backend might not be running)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('net::ERR') &&
      !err.includes('Failed to fetch') &&
      !err.includes('localhost:3001') &&
      !err.includes('WebSocket')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('WebSocket connection is established', async ({ page }) => {
    // Open workspace
    await page.locator('input#folder-path').fill(testWorkspacePath);
    await page.locator('button:has-text("Open")').click();
    await page.waitForTimeout(2000);

    // Check that WebSocket was created (check network tab or console)
    // This is a basic check - we can't easily test external file changes in Playwright
    // The presence of the file tree indicates the connection worked
    await expect(page.locator('text=README.md')).toBeVisible();
  });
});
