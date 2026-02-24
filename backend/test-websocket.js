const WebSocket = require('ws');
const fs = require('fs');

console.log('🔌 Connecting to WebSocket at ws://localhost:3001...');

const ws = new WebSocket('ws://localhost:3001');
const receivedMessages = [];
let testsPassed = 0;
let testsFailed = 0;

ws.on('open', () => {
  console.log('✅ WebSocket connected');

  // Send ping to verify connection
  ws.send(JSON.stringify({ type: 'ping' }));

  // Wait a bit, then start file operations
  setTimeout(() => runTests(), 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  receivedMessages.push(message);
  console.log(`📨 Received: ${JSON.stringify(message)}`);

  // Check for pong response
  if (message.type === 'pong') {
    console.log('✅ Test 1: Ping/Pong - PASSED');
    testsPassed++;
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket closed');
  console.log(`\n📊 RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  process.exit(testsFailed > 0 ? 1 : 0);
});

async function runTests() {
  console.log('\n🧪 Starting file watcher tests...\n');

  const testFile = '/tmp/custle-test-workspace/README.md';
  const testFile2 = '/tmp/custle-test-workspace/watcher-test.txt';
  const testDir = '/tmp/custle-test-workspace/test-folder';

  try {
    // Test 2: File change event
    console.log('🧪 Test 2: File change detection');
    receivedMessages.length = 0; // Clear previous messages
    fs.appendFileSync(testFile, '\n# WebSocket test update\n');

    await waitForMessage('file:change', 2000);
    if (checkFileChangeEvent(testFile, 'change')) {
      console.log('✅ Test 2: File change event - PASSED');
      testsPassed++;
    } else {
      console.log('❌ Test 2: File change event - FAILED');
      testsFailed++;
    }

    await sleep(500);

    // Test 3: File creation event
    console.log('\n🧪 Test 3: File creation detection');
    receivedMessages.length = 0;
    fs.writeFileSync(testFile2, 'New file created by watcher test');

    await waitForMessage('file:change', 2000);
    if (checkFileChangeEvent(testFile2, 'add')) {
      console.log('✅ Test 3: File creation event - PASSED');
      testsPassed++;
    } else {
      console.log('❌ Test 3: File creation event - FAILED');
      testsFailed++;
    }

    await sleep(500);

    // Test 4: Folder creation (should trigger tree:refresh)
    console.log('\n🧪 Test 4: Folder creation detection');
    receivedMessages.length = 0;
    fs.mkdirSync(testDir, { recursive: true });

    await waitForMessage('tree:refresh', 2000);
    if (checkTreeRefreshEvent()) {
      console.log('✅ Test 4: Folder creation event - PASSED');
      testsPassed++;
    } else {
      console.log('❌ Test 4: Folder creation event - FAILED');
      testsFailed++;
    }

    await sleep(500);

    // Test 5: File deletion event
    console.log('\n🧪 Test 5: File deletion detection');
    receivedMessages.length = 0;
    fs.unlinkSync(testFile2);

    await waitForMessage('file:change', 2000);
    if (checkFileChangeEvent(testFile2, 'unlink')) {
      console.log('✅ Test 5: File deletion event - PASSED');
      testsPassed++;
    } else {
      console.log('❌ Test 5: File deletion event - FAILED');
      testsFailed++;
    }

    await sleep(500);

    // Test 6: Folder deletion (should trigger tree:refresh)
    console.log('\n🧪 Test 6: Folder deletion detection');
    receivedMessages.length = 0;
    fs.rmdirSync(testDir);

    await waitForMessage('tree:refresh', 2000);
    if (checkTreeRefreshEvent()) {
      console.log('✅ Test 6: Folder deletion event - PASSED');
      testsPassed++;
    } else {
      console.log('❌ Test 6: Folder deletion event - FAILED');
      testsFailed++;
    }

    // Close connection after tests
    setTimeout(() => ws.close(), 1000);

  } catch (error) {
    console.error('❌ Test error:', error);
    testsFailed++;
    ws.close();
  }
}

function waitForMessage(type, timeout) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const found = receivedMessages.find(m => m.type === type);
      if (found || Date.now() - start > timeout) {
        clearInterval(interval);
        resolve(found);
      }
    }, 50);
  });
}

function checkFileChangeEvent(expectedPath, expectedEvent) {
  const event = receivedMessages.find(m =>
    m.type === 'file:change' &&
    m.path === expectedPath &&
    m.event === expectedEvent
  );

  if (event) {
    console.log(`   ↳ Received: type=${event.type}, event=${event.event}, path=${event.path}`);
    return true;
  }
  console.log(`   ↳ Expected event not found. Received: ${JSON.stringify(receivedMessages)}`);
  return false;
}

function checkTreeRefreshEvent() {
  const event = receivedMessages.find(m => m.type === 'tree:refresh');

  if (event) {
    console.log(`   ↳ Received: type=${event.type}`);
    return true;
  }
  console.log(`   ↳ Expected tree:refresh not found. Received: ${JSON.stringify(receivedMessages)}`);
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
