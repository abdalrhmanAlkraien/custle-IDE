import { Router, Request, Response } from 'express';
import { runAgentLoop, getAgentSystemPrompt, getChatSystemPrompt, AgentMessage } from '../services/agentService';
import { sendChatRequest } from '../services/modelService';
import type { ChatMessage } from '../services/modelService';

const router = Router();

// Global workspace root (should be set by workspace routes)
let workspaceRoot: string | null = null;

export function setWorkspaceRoot(root: string) {
  workspaceRoot = root;
}

export function getWorkspaceRoot(): string | null {
  return workspaceRoot;
}

/**
 * POST /api/agent/chat
 * Simple chat mode (no tools, just conversation)
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, activeFilePath, activeFileContent } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    if (!workspaceRoot) {
      return res.status(400).json({ error: 'No workspace open' });
    }

    // Add system prompt
    const systemPrompt = getChatSystemPrompt(workspaceRoot, activeFilePath, activeFileContent);
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Call model (non-streaming for now, can add streaming later)
    const response = await sendChatRequest({ messages: fullMessages, stream: false });

    return res.json({ response: response.content || response.message?.content || '' });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Chat request failed' });
  }
});

/**
 * POST /api/agent/run
 * Agent mode with tools (SSE streaming)
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string required' });
    }

    if (!workspaceRoot) {
      return res.status(400).json({ error: 'No workspace open' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build initial messages with system prompt
    const systemPrompt = getAgentSystemPrompt(workspaceRoot);
    const messages: AgentMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    // Run agent loop and stream steps
    try {
      for await (const step of runAgentLoop(messages, workspaceRoot)) {
        // Send step as SSE event
        res.write(`data: ${JSON.stringify(step)}\n\n`);
      }

      // Send completion event
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    } catch (loopError: any) {
      console.error('Agent loop error:', loopError);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        content: loopError.message || 'Agent execution failed',
        timestamp: new Date().toISOString(),
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
  } catch (error: any) {
    console.error('Agent run error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Agent request failed' });
    }
    return;
  }
});

/**
 * POST /api/agent/stop
 * Stop current agent execution (placeholder - actual implementation would need tracking)
 */
router.post('/stop', (_req: Request, res: Response) => {
  // In a production system, you'd track active agent sessions and cancel them
  // For now, just acknowledge
  res.json({ success: true, message: 'Stop signal sent' });
});

export default router;
