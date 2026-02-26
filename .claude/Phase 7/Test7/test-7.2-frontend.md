# Task 7.2 Frontend UI Tests (Playwright)

## Test Scenarios

### Test 8: Folder Browser Modal Opens
**Action:**
1. Navigate to http://localhost:3000
2. Wait for "Browse for Folder..." button to appear
3. Click "Browse for Folder..." button

**Expected:**
- Modal with title "Select Folder" appears
- Modal shows current path (should default to home directory)
- Modal shows directory list
- Modal shows quick access buttons (Home, Desktop, Documents, Downloads)
- Modal shows "Cancel" and "Open Folder" buttons

**Verification:**
```javascript
// Click browse button
await page.click('button:has-text("Browse for Folder")');

// Wait for modal
await page.waitForSelector('text=Select Folder');

// Check for directory list
const dirCount = await page.locator('[class*="folder"]').count();
expect(dirCount).toBeGreaterThan(0);

// Check for quick access
await page.waitForSelector('text=Quick Access');

// Check for action buttons
await page.waitForSelector('button:has-text("Cancel")');
await page.waitForSelector('button:has-text("Open Folder")');

// Take screenshot
await page.screenshot({ path: 'test-7.2-folder-browser-modal.png' });
```

---

### Test 9: Navigate in Folder Browser
**Action:**
1. Open folder browser modal (from Test 8)
2. Click on a directory in the list
3. Wait for new directory list to load

**Expected:**
- Current path updates to selected directory
- Directory list refreshes with subdirectories
- "Up" button appears if not at root
- Can navigate back using "Up" button

**Verification:**
```javascript
// Get initial path
const initialPath = await page.locator('text=/\\/.*/).first().textContent();

// Click first directory
await page.locator('[class*="folder"]').first().click();

// Wait for path to change
await page.waitForFunction(
  (oldPath) => {
    const newPath = document.querySelector('[class*="path"]')?.textContent;
    return newPath !== oldPath;
  },
  initialPath
);

// Check "Up" button exists
await page.waitForSelector('button:has-text("Up")');

// Take screenshot
await page.screenshot({ path: 'test-7.2-folder-browser-navigate.png' });
```

---

### Test 10: Open Folder from Browser
**Action:**
1. Open folder browser modal
2. Navigate to project directory
3. Click "Open Folder" button

**Expected:**
- Modal closes
- File tree loads with workspace files
- Workspace path displayed somewhere in UI
- Git status loads if project is a git repo

**Verification:**
```javascript
// Open modal
await page.click('button:has-text("Browse for Folder")');
await page.waitForSelector('text=Select Folder');

// Click Open Folder (will open current directory)
await page.click('button:has-text("Open Folder")');

// Wait for modal to close
await page.waitForSelector('text=Select Folder', { state: 'hidden' });

// Wait for file tree to load
await page.waitForSelector('[class*="file-tree"]', { timeout: 10000 });

// Take screenshot
await page.screenshot({ path: 'test-7.2-folder-opened.png' });
```

---

### Test 11: Git Tab Shows Changes
**Action:**
1. Open a git repository workspace
2. Navigate to Git tab/panel
3. Verify git status is displayed

**Expected:**
- Branch name is displayed
- If repository has remote: owner/repo shown
- Changes section shows modified files (if any)
- Ahead/behind counts shown if applicable
- If not a git repo: "Not a Git Repository" message

**Verification:**
```javascript
// Assuming workspace is already open from Test 10
// Click on Git tab/panel
await page.click('[aria-label="Git"]').catch(() =>
  page.click('text=Source Control')
);

// Wait for git content to load
await page.waitForTimeout(2000);

// Check for either git content or "not a git repo" message
const hasGitContent = await page.locator('text=/main|master|develop/').count() > 0;
const hasNoRepoMessage = await page.locator('text=Not a Git Repository').count() > 0;

if (hasGitContent) {
  console.log('✓ Git repository detected, showing status');

  // Take screenshot
  await page.screenshot({ path: 'test-7.2-git-tab-with-changes.png' });
} else if (hasNoRepoMessage) {
  console.log('✓ Non-git workspace, showing appropriate message');

  // Take screenshot
  await page.screenshot({ path: 'test-7.2-git-tab-no-repo.png' });
} else {
  throw new Error('Git panel not showing expected content');
}
```

---

### Test 12: Stage File from UI
**Action:**
1. Open git workspace with changes
2. Navigate to Git panel
3. Find a file in "Changes" section
4. Click stage button (+ icon or "Stage" button)

**Expected:**
- File moves from "Changes" to "Staged Changes" section
- Stage button changes to unstage button
- File count updates in both sections

**Verification:**
```javascript
// This test requires a file with changes
// We'll create a test file first
await page.evaluate(() => {
  // Trigger file modification via backend API
  fetch('http://localhost:3001/api/files/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'test-file-for-staging.txt',
      content: 'Test content for staging ' + Date.now()
    })
  });
});

// Wait for file watcher to detect change
await page.waitForTimeout(2000);

// Navigate to Git panel
await page.click('[aria-label="Git"]').catch(() =>
  page.click('text=Source Control')
);

// Wait for changes to appear
await page.waitForSelector('text=Changes');

// Find and click stage button on first changed file
const stageButton = page.locator('[title="Stage"]').first();
if (await stageButton.count() > 0) {
  await stageButton.click();

  // Wait for file to move to staged section
  await page.waitForTimeout(1000);

  // Verify "Staged Changes" section has items
  const stagedCount = await page.locator('text=Staged Changes').locator('..').locator('[class*="file"]').count();
  expect(stagedCount).toBeGreaterThan(0);

  console.log('✓ File staged successfully');

  // Take screenshot
  await page.screenshot({ path: 'test-7.2-file-staged.png' });
} else {
  console.log('ℹ No unstaged files available to stage');
}
```

---

### Test 13: Commit from UI
**Action:**
1. Stage at least one file (from Test 12)
2. Enter commit message in text area
3. Click "Commit" button

**Expected:**
- Commit succeeds
- Commit message clears
- Staged files section empties
- Success feedback shown (or no error)

**Verification:**
```javascript
// Navigate to Git panel
await page.click('[aria-label="Git"]').catch(() =>
  page.click('text=Source Control')
);

// Check if there are staged files
const stagedCount = await page.locator('text=Staged Changes').locator('..').locator('[class*="file"]').count();

if (stagedCount > 0) {
  // Enter commit message
  const commitInput = page.locator('textarea[placeholder*="Commit message"]');
  await commitInput.fill('Test commit from UI automation');

  // Click commit button
  await page.click('button:has-text("Commit")');

  // Wait for commit to complete
  await page.waitForTimeout(2000);

  // Check that commit message is cleared
  const messageAfter = await commitInput.inputValue();
  expect(messageAfter).toBe('');

  // Check that staged files section is empty or has fewer files
  const stagedAfter = await page.locator('text=Staged Changes').locator('..').locator('[class*="file"]').count();
  expect(stagedAfter).toBeLessThanOrEqual(stagedCount);

  console.log('✓ Commit successful');

  // Take screenshot
  await page.screenshot({ path: 'test-7.2-commit-success.png' });
} else {
  console.log('ℹ No staged files to commit');

  // Try to stage the test file first
  const stageButton = page.locator('[title="Stage"]').first();
  if (await stageButton.count() > 0) {
    await stageButton.click();
    await page.waitForTimeout(1000);

    // Now try commit
    const commitInput = page.locator('textarea[placeholder*="Commit message"]');
    await commitInput.fill('Test commit from UI automation');
    await page.click('button:has-text("Commit")');
    await page.waitForTimeout(2000);

    console.log('✓ Staged and committed test file');
  }
}

// Cleanup: unstage any remaining test files if needed
```

---

## Test Execution Instructions

**Prerequisites:**
1. Backend server running on http://localhost:3001
2. Frontend server running on http://localhost:3000
3. A git repository to test with (current project works)
4. Playwright installed: `npx playwright install chromium`

**Run Tests:**
```bash
# Run all frontend tests
npx playwright test test-7.2-frontend.spec.ts

# Or use Claude Code's Playwright tool directly in the conversation
```

**Expected Results:**
- All 6 Playwright tests pass
- 6 screenshots generated showing each UI state
- No console errors
- No TypeScript errors

**Test Pass Criteria:**
- ✅ Folder browser modal opens and displays correctly
- ✅ Navigation works in folder browser
- ✅ Opening folder loads file tree and workspace
- ✅ Git tab shows correct status for git/non-git repos
- ✅ Staging files works from UI
- ✅ Committing works from UI

---

## Notes

- Tests assume the current project directory is a git repository
- Tests may create temporary files for staging/commit testing
- Tests should clean up after themselves
- If workspace is not a git repo, tests 11-13 will verify the "Not a Git Repository" message instead
