import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let testWorkspacePath: string;

test.describe('Debug File Opening', () => {
  test.beforeAll(async () => {
    testWorkspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-test-'));
    fs.writeFileSync(
      path.join(testWorkspacePath, 'test.js'),
      '// Test file\nconsole.log("hello");'
    );
  });

  test.afterAll(async () => {
    if (testWorkspacePath && fs.existsSync(testWorkspacePath)) {
      fs.rmSync(testWorkspacePath, { recursive: true, force: true });
    }
  });

  test('debug file opening', async ({ page }) => {
    //Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open workspace
    const input = page.locator('input#folder-path');
    await input.fill(testWorkspacePath);
    await page.locator('button:has-text("Open Folder")').click();
    await page.waitForTimeout(2000);

    console.log('Workspace opened');

    // Check if file tree is visible
    const fileTreeItem = page.locator('text=test.js').first();
    console.log('File tree item visible:', await fileTreeItem.isVisible());

    // Take screenshot before clicking
    await page.screenshot({ path: 'test-results/before-click.png' });

    // Try to click the file
    console.log('Attempting to click file...');
    await fileTreeItem.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'test-results/after-click.png' });

    // Check if tabs exist in the store
    const tabsCount = await page.evaluate(() => {
      const store = (window as any).__zustand_store__;
      return store?.getState?.()?.tabs?.length || 'store not found';
    });
    console.log('Tabs count in store:', tabsCount);

    // Check if editor area is showing
    const hasMonacoEditor = await page.locator('.monaco-editor').isVisible();
    console.log('Monaco editor visible:', hasMonacoEditor);

    const hasPlaceholder = await page.locator('text=Open a file from the explorer').isVisible();
    console.log('Placeholder visible:', hasPlaceholder);
  });
});
