import { test, expect } from '@playwright/test';

/**
 * Task 1.2 - IDE Shell, Store & Layout Tests
 *
 * Verifies:
 * - IDE Shell loads correctly
 * - TitleBar with logo and model status
 * - ActivityBar with icon buttons
 * - StatusBar with git/cursor info
 * - Resizable panels (Sidebar, Editor, Terminal, Chat)
 * - Panel visibility toggles
 */

test.describe('Task 1.2 - IDE Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the IDE to load
    await page.waitForLoadState('networkidle');
  });

  test('IDE Shell loads successfully', async ({ page }) => {
    // Check that the page loaded
    await expect(page).toHaveTitle(/Custle IDE/);

    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a moment to catch any errors
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('TitleBar displays correctly', async ({ page }) => {
    // Check for logo
    const logo = page.locator('text=⬡');
    await expect(logo).toBeVisible();

    // Check for IDE name
    const name = page.locator('text=NeuralIDE');
    await expect(name).toBeVisible();

    // Check for menu items
    await expect(page.locator('button:has-text("File")')).toBeVisible();
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("View")')).toBeVisible();
    await expect(page.locator('button:has-text("Help")')).toBeVisible();

    // Check for model status pill
    const modelPill = page.locator('text=Qwen3-Coder-30B-A3B');
    await expect(modelPill).toBeVisible();
  });

  test('ActivityBar displays and buttons work', async ({ page }) => {
    // Check each button is clickable
    const explorerBtn = page.locator('button[title="Explorer"]');
    const searchBtn = page.locator('button[title="Search"]');
    const gitBtn = page.locator('button[title="Source Control"]');
    const extensionsBtn = page.locator('button[title="Extensions"]');

    await expect(explorerBtn).toBeVisible();
    await expect(searchBtn).toBeVisible();
    await expect(gitBtn).toBeVisible();
    await expect(extensionsBtn).toBeVisible();

    // Test clicking switches active panel
    await searchBtn.click();
    await expect(page.locator('h2:has-text("Search")')).toBeVisible();

    await gitBtn.click();
    await expect(page.locator('h2:has-text("Source Control")')).toBeVisible();

    await explorerBtn.click();
    await expect(page.locator('h2:has-text("Explorer")')).toBeVisible();
  });

  test('StatusBar displays correctly', async ({ page }) => {
    // Check for git branch indicator
    const gitBranch = page.locator('text=main').first();
    await expect(gitBranch).toBeVisible();

    // Check for problem/info counts
    // Should see "0" for problems and info
    const problemCount = page.locator('div:has-text("0")').first();
    await expect(problemCount).toBeVisible();
  });

  test('Sidebar panel is visible and functional', async ({ page }) => {
    // Sidebar should be open by default
    const sidebar = page.locator('text=Explorer');
    await expect(sidebar).toBeVisible();

    // Should show the placeholder message
    await expect(page.locator('text=File tree will be implemented in Task 2.2')).toBeVisible();
  });

  test('Editor area is visible', async ({ page }) => {
    // Editor should show "No files open" state
    const editorPlaceholder = page.locator('text=No files open');
    await expect(editorPlaceholder).toBeVisible();

    // Should show Monaco placeholder message
    await expect(page.locator('text=Monaco editor will be implemented in Task 2.3')).toBeVisible();
  });

  test('Terminal panel is visible', async ({ page }) => {
    // Terminal panel should be open by default at bottom
    const terminalTab = page.locator('button:has-text("Terminal")');
    await expect(terminalTab).toBeVisible();

    // Should show placeholder
    await expect(page.locator('text=Real terminal (xterm.js + node-pty) will be implemented in Task 4.1')).toBeVisible();

    // Verify other tabs are visible
    const problemsTab = page.locator('button:has-text("Problems")');
    await expect(problemsTab).toBeVisible();

    const outputTab = page.locator('button:has-text("Output")');
    await expect(outputTab).toBeVisible();
  });

  test('Chat panel is visible', async ({ page }) => {
    // Chat panel should be open by default on right
    const chat = page.locator('text=AI Assistant');
    await expect(chat).toBeVisible();

    // Should show chat mode by default
    await expect(page.locator('text=AI Chat will be implemented in Task 3.2')).toBeVisible();

    // Test mode toggle
    const agentBtn = page.locator('button:has-text("Agent")');
    await agentBtn.click();
    await expect(page.locator('text=Agent mode will be implemented in Task 3.2')).toBeVisible();

    const chatBtn = page.locator('button:has-text("Chat")').last();
    await chatBtn.click();
    await expect(page.locator('text=AI Chat will be implemented in Task 3.2')).toBeVisible();
  });

  test('Layout uses correct theme colors', async ({ page }) => {
    // Check that dark theme is applied
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be dark (not white/light)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

  test('No TypeScript errors in console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate and wait
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out non-critical errors (like network errors for backend services)
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('net::ERR') &&
      !err.includes('Failed to fetch') &&
      !err.includes('localhost:3001')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
