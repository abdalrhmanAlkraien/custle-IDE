import { test, expect } from '@playwright/test';

test('Debug file tree rendering', async ({ page }) => {
  // Clear localStorage
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  console.log('Step 1: Initial page loaded');

  // Open workspace
  const input = page.locator('input#folder-path');
  await input.fill('/tmp/test-workspace');

  console.log('Step 2: Filled workspace path');

  await page.locator('button:has-text("Open Folder")').click();

  console.log('Step 3: Clicked Open Folder');

  // Wait for workspace name to appear in header
  await page.waitForSelector('text=/test-workspace/', { timeout: 10000 });

  console.log('Step 4: Workspace name appeared in header');

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-after-open.png', fullPage: true });

  console.log('Step 5: Screenshot taken');

  // Wait a bit more
  await page.waitForTimeout(3000);

  // Check if FileTree component is rendered
  const hasLoading = await page.locator('text=Loading').isVisible().catch(() => false);
  const hasError = await page.locator('text=/failed/i').isVisible().catch(() => false);
  const hasReadme = await page.locator('text=README.md').isVisible().catch(() => false);

  console.log('Has loading state:', hasLoading);
  console.log('Has error state:', hasError);
  console.log('Has README.md:', hasReadme);

  // Get all visible text
  const bodyText = await page.locator('body').innerText();
  console.log('Full page text:', bodyText.substring(0, 500));

  // Take final screenshot
  await page.screenshot({ path: 'test-results/debug-final.png', fullPage: true });
});
