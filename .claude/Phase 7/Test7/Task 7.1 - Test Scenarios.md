# Task 7.1 - Test Scenarios
# GitHub Integration — Token Auth, Credential Storage & Repository Browser

## Test Environment Setup

**Prerequisites:**
- Backend server running on port 3001
- Frontend server running on port 3000
- GitHub Personal Access Token (PAT) for testing

**Test Data:**
- Valid PAT: (use real token during testing)
- Invalid PAT: `ghp_invalid_token_for_testing_12345678901234567890`

---

## Backend API Tests (curl)

### Test 1: POST /api/github/connect - Valid Token
**Objective:** Validate successful GitHub authentication and repo caching

```bash
VALID_TOKEN="your_github_pat_here"

# Connect with valid token
RESPONSE=$(curl -s -X POST http://localhost:3001/api/github/connect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$VALID_TOKEN\"}")

echo "$RESPONSE" | jq .

# Verify response contains username, avatar_url, name, repo_count
# Verify token is NOT in response
echo "$RESPONSE" | jq 'has("token")' # Should be false
echo "$RESPONSE" | jq 'has("username")' # Should be true
echo "$RESPONSE" | jq 'has("avatar_url")' # Should be true
echo "$RESPONSE" | jq 'has("repo_count")' # Should be true
```

**Expected:**
- HTTP 200
- JSON with `username`, `avatar_url`, `name`, `repo_count`
- `token` field MUST NOT be present (security check)

---

### Test 2: POST /api/github/connect - Invalid Token
**Objective:** Verify 401 error on invalid GitHub token

```bash
INVALID_TOKEN="ghp_invalid_token_for_testing_12345678901234567890"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3001/api/github/connect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$INVALID_TOKEN\"}")

echo "Status: $STATUS"
[ "$STATUS" = "401" ] && echo "✅ PASS" || echo "❌ FAIL"
```

**Expected:**
- HTTP 401
- JSON error: `{ "error": "Invalid GitHub token" }`

---

### Test 3: POST /api/github/connect - Missing Token
**Objective:** Verify 400 error when token is missing

```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:3001/api/github/connect \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Status: $STATUS"
[ "$STATUS" = "400" ] && echo "✅ PASS" || echo "❌ FAIL"
```

**Expected:**
- HTTP 400
- JSON error: `{ "error": "Token is required" }`

---

### Test 4: GET /api/github/status - Connected
**Objective:** Verify status endpoint returns connection info (after Test 1)

```bash
RESPONSE=$(curl -s http://localhost:3001/api/github/status)

echo "$RESPONSE" | jq .

# Verify response structure
echo "$RESPONSE" | jq 'has("connected")' # Should be true
echo "$RESPONSE" | jq '.connected' # Should be true
echo "$RESPONSE" | jq 'has("username")' # Should be true
echo "$RESPONSE" | jq 'has("token")' # Should be false (SECURITY)
```

**Expected:**
- HTTP 200
- JSON: `{ "connected": true, "username": "...", "avatar_url": "...", "name": "..." }`
- `token` field MUST NOT be present (security check)

---

### Test 5: GET /api/github/repos - Connected
**Objective:** Verify cached repos endpoint returns repository list

```bash
RESPONSE=$(curl -s http://localhost:3001/api/github/repos)

echo "$RESPONSE" | jq .

# Verify response structure
echo "$RESPONSE" | jq 'has("repos")' # Should be true
echo "$RESPONSE" | jq 'has("count")' # Should be true
echo "$RESPONSE" | jq '.repos | length' # Should match .count

# Verify repo structure (check first repo)
echo "$RESPONSE" | jq '.repos[0] | has("id")' # Should be true
echo "$RESPONSE" | jq '.repos[0] | has("name")' # Should be true
echo "$RESPONSE" | jq '.repos[0] | has("full_name")' # Should be true
echo "$RESPONSE" | jq '.repos[0] | has("clone_url")' # Should be true
```

**Expected:**
- HTTP 200
- JSON: `{ "repos": [...], "count": N }`
- Each repo has: id, name, full_name, description, private, clone_url, ssh_url, html_url, language, updated_at, stargazers_count, fork

---

### Test 6: POST /api/github/repos/refresh - Connected
**Objective:** Verify repos can be refreshed from GitHub API

```bash
RESPONSE=$(curl -s -X POST http://localhost:3001/api/github/repos/refresh)

echo "$RESPONSE" | jq .

# Verify response structure
echo "$RESPONSE" | jq 'has("repo_count")' # Should be true
echo "$RESPONSE" | jq 'has("refreshed_at")' # Should be true
```

**Expected:**
- HTTP 200
- JSON: `{ "repo_count": N, "refreshed_at": "2026-..." }`

---

### Test 7: DELETE /api/github/disconnect
**Objective:** Verify successful disconnection and credential removal

```bash
RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/github/disconnect)

echo "$RESPONSE" | jq .

# Verify response
echo "$RESPONSE" | jq '.success' # Should be true

# Verify status after disconnect
STATUS_RESPONSE=$(curl -s http://localhost:3001/api/github/status)
echo "$STATUS_RESPONSE" | jq '.connected' # Should be false
```

**Expected:**
- HTTP 200
- JSON: `{ "success": true }`
- Subsequent GET /status returns `{ "connected": false }`

---

### Test 8: GET /api/github/repos - Not Connected (401)
**Objective:** Verify repos endpoint returns 401 when not connected

```bash
# Ensure disconnected first
curl -s -X DELETE http://localhost:3001/api/github/disconnect > /dev/null

# Try to get repos
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3001/api/github/repos)

echo "Status: $STATUS"
[ "$STATUS" = "401" ] && echo "✅ PASS" || echo "❌ FAIL"
```

**Expected:**
- HTTP 401
- JSON error: `{ "error": "Not connected to GitHub" }`

---

### Test 9: SECURITY - Token Never in Responses
**Objective:** Verify token is NEVER returned in any endpoint response

```bash
VALID_TOKEN="your_github_pat_here"

# Connect
curl -s -X POST http://localhost:3001/api/github/connect \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$VALID_TOKEN\"}" > /tmp/connect_response.json

# Check /connect response
grep -q "$VALID_TOKEN" /tmp/connect_response.json && echo "❌ FAIL: Token in /connect response" || echo "✅ PASS: Token not in /connect"

# Check /status response
curl -s http://localhost:3001/api/github/status > /tmp/status_response.json
grep -q "$VALID_TOKEN" /tmp/status_response.json && echo "❌ FAIL: Token in /status response" || echo "✅ PASS: Token not in /status"

# Check /repos response
curl -s http://localhost:3001/api/github/repos > /tmp/repos_response.json
grep -q "$VALID_TOKEN" /tmp/repos_response.json && echo "❌ FAIL: Token in /repos response" || echo "❌ PASS: Token not in /repos"

# Cleanup
rm -f /tmp/connect_response.json /tmp/status_response.json /tmp/repos_response.json
```

**Expected:**
- Token string NEVER appears in any response
- All checks should PASS

---

## Frontend Tests (Playwright)

### Test 10: GitPanel - GitHub Tab Renders
**Objective:** Verify GitPanel shows GitHub tab with GitHubConnect component

```javascript
// Navigate to IDE
await page.goto('http://localhost:3000');

// Wait for GitPanel to load
await page.waitForSelector('[data-testid="git-panel"]', { timeout: 5000 });

// Click GitHub tab
await page.click('text=GitHub');

// Verify GitHubConnect component is visible
const connectForm = await page.locator('text=Connect to GitHub');
await expect(connectForm).toBeVisible();

// Verify token input field exists
const tokenInput = await page.locator('input[placeholder*="GitHub Personal Access Token"]');
await expect(tokenInput).toBeVisible();

// Screenshot
await page.screenshot({ path: 'test-github-tab.png' });
```

**Expected:**
- GitHub tab is clickable
- GitHubConnect component renders
- Token input field visible
- "Connect" button visible

---

### Test 11: GitHubConnect - Token Input and Connect Flow
**Objective:** Verify user can input token and connect (mock backend)

```javascript
// Navigate and click GitHub tab
await page.goto('http://localhost:3000');
await page.click('text=GitHub');

// Type token (use test token or mock)
const tokenInput = await page.locator('input[placeholder*="GitHub Personal Access Token"]');
await tokenInput.fill('ghp_test_token_12345678901234567890');

// Toggle "Show token" checkbox
const showTokenCheckbox = await page.locator('text=Show token');
await showTokenCheckbox.click();

// Verify token is visible
const inputType = await tokenInput.getAttribute('type');
expect(inputType).toBe('text');

// Click Connect button
await page.click('button:has-text("Connect")');

// Wait for loading state
await page.waitForSelector('button:has-text("Connecting...")', { timeout: 2000 });

// Screenshot
await page.screenshot({ path: 'test-github-connect-loading.png' });
```

**Expected:**
- Token input accepts text
- Show/hide token toggle works
- Connect button triggers loading state

---

### Test 12: RepoList - Repository Browser Displays Repos
**Objective:** Verify repository list displays after connection (requires connected state)

```javascript
// Assuming connected state (setup with valid token)
await page.goto('http://localhost:3000');
await page.click('text=GitHub');

// Wait for repo list to load
await page.waitForSelector('[data-testid="repo-list"]', { timeout: 5000 });

// Verify search input exists
const searchInput = await page.locator('input[placeholder*="Search repositories"]');
await expect(searchInput).toBeVisible();

// Verify filter buttons exist
await expect(page.locator('button:has-text("All")')).toBeVisible();
await expect(page.locator('button:has-text("Public")')).toBeVisible();
await expect(page.locator('button:has-text("Private")')).toBeVisible();

// Verify refresh button exists
const refreshButton = await page.locator('button[title="Refresh repositories"]');
await expect(refreshButton).toBeVisible();

// Test search functionality
await searchInput.fill('test');
await page.waitForTimeout(500); // debounce

// Test filter buttons
await page.click('button:has-text("Private")');
await page.waitForTimeout(500);

// Screenshot
await page.screenshot({ path: 'test-repo-list.png' });
```

**Expected:**
- Repository list renders
- Search input filters repos
- Filter buttons work (All/Public/Private)
- Refresh button visible

---

## Test Summary

**Total Tests:** 12
- **Backend (curl):** 9 tests
- **Frontend (Playwright):** 3 tests

**Critical Security Checks:**
- ✅ Test 9: Token NEVER in any API response
- ✅ Tests 1, 4, 5: Verify token field absent from /connect, /status, /repos

**Coverage:**
- ✅ POST /api/github/connect (valid, invalid, missing token)
- ✅ GET /api/github/status (connected, not connected)
- ✅ GET /api/github/repos (connected, not connected)
- ✅ POST /api/github/repos/refresh
- ✅ DELETE /api/github/disconnect
- ✅ Frontend: GitPanel GitHub tab
- ✅ Frontend: GitHubConnect component
- ✅ Frontend: RepoList component

---

## Execution Notes

1. **Backend tests** should be run sequentially to maintain state
2. **Frontend tests** may require mocking GitHub API or using a test token
3. **Clean up** after tests: `DELETE /api/github/disconnect`
4. **Replace** `your_github_pat_here` with an actual GitHub PAT for live testing
5. **Security**: Never commit real GitHub tokens to version control
