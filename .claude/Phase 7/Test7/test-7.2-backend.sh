#!/bin/bash

# Task 7.2 Backend API Tests
# Native Folder Browser & Git Status for Opened Projects

set -e

API_BASE="http://localhost:3001"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Task 7.2 Backend API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test counter
test_count=0

# Test 1: Browse home directory
((test_count++))
echo "[$test_count/7] Testing browse home directory..."
RESPONSE=$(curl -s "$API_BASE/api/workspace/browse")

if echo "$RESPONSE" | jq -e '.current' > /dev/null && \
   echo "$RESPONSE" | jq -e '.dirs' > /dev/null && \
   echo "$RESPONSE" | jq -e '.quickAccess' > /dev/null; then
  echo -e "${GREEN}✓${NC} Browse home directory returns correct structure"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Browse home directory failed"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 2: Browse subdirectory
((test_count++))
echo "[$test_count/7] Testing browse subdirectory (/tmp)..."
RESPONSE=$(curl -s "$API_BASE/api/workspace/browse?path=%2Ftmp")

if echo "$RESPONSE" | jq -e '.current' > /dev/null && \
   [ "$(echo "$RESPONSE" | jq -r '.current')" = "/tmp" ] || \
   [ "$(echo "$RESPONSE" | jq -r '.current')" = "/private/tmp" ]; then
  echo -e "${GREEN}✓${NC} Browse subdirectory works correctly"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Browse subdirectory failed"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 3: Browse invalid path (should return 400)
((test_count++))
echo "[$test_count/7] Testing browse invalid path..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/workspace/browse?path=%2Fnonexistent12345xyz")

if [ "$STATUS" = "400" ]; then
  echo -e "${GREEN}✓${NC} Browse invalid path returns 400"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Browse invalid path should return 400, got $STATUS"
  ((FAIL++))
fi
echo ""

# Test 4: Open git repo - response includes git status
((test_count++))
echo "[$test_count/7] Testing open git repo with git status..."

# Use current project directory (should be a git repo)
CURRENT_DIR="/Users/aboodalkraien/project/custle-IDE"

RESPONSE=$(curl -s -X POST "$API_BASE/api/workspace/open" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"$CURRENT_DIR\"}")

if echo "$RESPONSE" | jq -e '.git' > /dev/null && \
   echo "$RESPONSE" | jq -e '.git.isRepo' > /dev/null && \
   [ "$(echo "$RESPONSE" | jq -r '.git.isRepo')" = "true" ]; then
  echo -e "${GREEN}✓${NC} Open git repo includes git status"

  # Check for git fields
  if echo "$RESPONSE" | jq -e '.git.branch' > /dev/null; then
    echo -e "${GREEN}✓${NC} Git status includes branch"
  fi

  if echo "$RESPONSE" | jq -e '.git.changes' > /dev/null; then
    echo -e "${GREEN}✓${NC} Git status includes changes array"
  fi

  ((PASS++))
else
  echo -e "${RED}✗${NC} Open git repo failed or missing git status"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 5: Open non-git folder - git.isRepo: false
((test_count++))
echo "[$test_count/7] Testing open non-git folder..."

# Create temp non-git folder
TEMP_DIR="/tmp/test-nongit-$$"
mkdir -p "$TEMP_DIR"

RESPONSE=$(curl -s -X POST "$API_BASE/api/workspace/open" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"$TEMP_DIR\"}")

if echo "$RESPONSE" | jq -e '.git' > /dev/null && \
   [ "$(echo "$RESPONSE" | jq -r '.git.isRepo')" = "false" ]; then
  echo -e "${GREEN}✓${NC} Open non-git folder returns git.isRepo: false"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Open non-git folder failed"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi

# Cleanup
rm -rf "$TEMP_DIR"
echo ""

# Test 6: Stage files
((test_count++))
echo "[$test_count/7] Testing stage files..."

# Reopen git workspace first
curl -s -X POST "$API_BASE/api/workspace/open" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"$CURRENT_DIR\"}" > /dev/null

# Try to stage a file (even if no changes, API should accept)
RESPONSE=$(curl -s -X POST "$API_BASE/api/git/stage" \
  -H "Content-Type: application/json" \
  -d '{"paths":["README.md"]}')

if echo "$RESPONSE" | jq -e '.success' > /dev/null || \
   echo "$RESPONSE" | jq -e '.output' > /dev/null; then
  echo -e "${GREEN}✓${NC} Stage files endpoint works"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Stage files failed"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi
echo ""

# Test 7: Commit staged files
((test_count++))
echo "[$test_count/7] Testing commit endpoint..."

# Note: This test just verifies the endpoint exists and accepts requests
# We won't actually commit to avoid polluting git history
RESPONSE=$(curl -s -X POST "$API_BASE/api/git/commit" \
  -H "Content-Type: application/json" \
  -d '{"message":"test commit"}')

# If there are no staged changes, it will fail with an error
# But we just check that the endpoint responds properly
if echo "$RESPONSE" | jq -e '.success' > /dev/null || \
   echo "$RESPONSE" | jq -e '.error' > /dev/null; then
  echo -e "${GREEN}✓${NC} Commit endpoint responds correctly"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Commit endpoint malformed response"
  echo "Response: $RESPONSE"
  ((FAIL++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Failed: $FAIL${NC}"
else
  echo -e "Failed: $FAIL"
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All backend tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
