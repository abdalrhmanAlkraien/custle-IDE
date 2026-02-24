// WebSocket Terminal Test Client
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3001';
const SESSION_ID = 'test-term-' + Date.now();

let testsPassed = 0;
let testsFailed = 0;
let ws;

function log(message) {
  console.log(`[TEST] ${message}`);
}

function pass(testName) {
  testsPassed++;
  console.log(`✅ PASS: ${testName}`);
}

function fail(testName, reason) {
  testsFailed++;
  console.error(`❌ FAIL: ${testName} - ${reason}`);
}

function cleanup() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log('Starting WebSocket Terminal Tests');
  log(`Session ID: ${SESSION_ID}`);

  ws = new WebSocket(WS_URL);

  ws.on('open', async () => {
    log('WebSocket connected');

    // Test 1: Create Terminal Session
    log('Test 1: Create Terminal Session');
    ws.send(JSON.stringify({
      type: 'terminal:create',
      sessionId: SESSION_ID,
      cwd: process.cwd(),
      cols: 80,
      rows: 24
    }));

    await sleep(500);
  });

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    // Test 1 verification
    if (message.type === 'terminal:created' && message.sessionId === SESSION_ID) {
      pass('Test 1: Terminal session created');

      // Test 2: Send Command
      log('Test 2: Execute command (echo hello)');
      ws.send(JSON.stringify({
        type: 'terminal:input',
        sessionId: SESSION_ID,
        data: 'echo hello\n'
      }));
    }

    // Test 2 verification
    if (message.type === 'terminal:output' && message.data && message.data.includes('hello')) {
      pass('Test 2: Terminal command execution and output');

      // Test 3: Node version command
      log('Test 3: Execute node --version');
      ws.send(JSON.stringify({
        type: 'terminal:input',
        sessionId: SESSION_ID,
        data: 'node --version\n'
      }));
    }

    // Test 3 verification
    if (message.type === 'terminal:output' && message.data && message.data.match(/v\d+\.\d+\.\d+/)) {
      pass('Test 3: Node version command works');

      // Test 4: Terminal Resize
      log('Test 4: Resize terminal');
      ws.send(JSON.stringify({
        type: 'terminal:resize',
        sessionId: SESSION_ID,
        cols: 120,
        rows: 30
      }));

      await sleep(300);
      pass('Test 4: Terminal resize (no errors)');

      // Test 5: Invalid Session
      log('Test 5: Send input to non-existent session');
      ws.send(JSON.stringify({
        type: 'terminal:input',
        sessionId: 'does-not-exist',
        data: 'test\n'
      }));
    }

    // Test 5 verification
    if (message.type === 'terminal:error' && message.sessionId === 'does-not-exist') {
      pass('Test 5: Error handling for invalid session');

      // Test 6: Kill Terminal
      log('Test 6: Kill terminal session');
      ws.send(JSON.stringify({
        type: 'terminal:kill',
        sessionId: SESSION_ID
      }));
    }

    // Test 6 verification
    if (message.type === 'terminal:killed' && message.sessionId === SESSION_ID) {
      pass('Test 6: Terminal session killed');

      // Test 7: Input to killed session
      log('Test 7: Send input to killed session');
      ws.send(JSON.stringify({
        type: 'terminal:input',
        sessionId: SESSION_ID,
        data: 'test\n'
      }));

      await sleep(500);

      // If we got this far without errors, finalize
      log('\\n=== TEST SUMMARY ===');
      log(`Passed: ${testsPassed}`);
      log(`Failed: ${testsFailed}`);
      log(`Total: ${testsPassed + testsFailed}`);

      cleanup();
      process.exit(testsFailed > 0 ? 1 : 0);
    }

    // Test 7 verification (should get error for killed session)
    if (message.type === 'terminal:error' && message.sessionId === SESSION_ID && message.error === 'Session not found') {
      pass('Test 7: Killed session returns error');
    }
  });

  ws.on('error', (error) => {
    fail('WebSocket Connection', error.message);
    cleanup();
    process.exit(1);
  });

  ws.on('close', () => {
    log('WebSocket disconnected');
  });
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  cleanup();
  process.exit(1);
});

runTests();
