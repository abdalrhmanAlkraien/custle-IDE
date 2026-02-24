/**
 * Completion Route
 * AI inline code completion endpoint
 */

import { Router, Request, Response } from 'express';
import { getActiveConfigFull, sendChatRequest } from '../services/modelService';

const router = Router();

interface CompletionRequest {
  prefix: string;
  suffix: string;
  language: string;
}

interface CompletionResponse {
  completion: string;
}

// POST /api/completion - Get code completion
router.post('/', async (req: Request, res: Response) => {
  try {
    const { prefix, suffix, language }: CompletionRequest = req.body;

    // Validate required fields
    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'prefix is required' });
    }

    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'language is required' });
    }

    // Get model configuration
    const modelConfig = getActiveConfigFull();
    if (!modelConfig || !modelConfig.baseUrl || !modelConfig.apiKey) {
      return res.status(500).json({ error: 'Model not configured' });
    }

    // Build completion prompt
    const systemPrompt = `You are a code completion engine. Complete the code at the cursor.
Output ONLY the completion text. No explanation. No markdown.
Language: ${language}. Match the surrounding code style exactly.`;

    const userPrompt = `Complete the following code at the cursor position (marked with <CURSOR>):

${prefix}<CURSOR>${suffix || ''}

Output only the completion text that should replace <CURSOR>.`;

    // Call model for completion (uses config maxTokens and temperature)
    const response = await sendChatRequest({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    // Extract completion text based on provider
    let completion = '';
    if (modelConfig.provider === 'anthropic') {
      // Anthropic format: response.content[0].text
      completion = response.content?.[0]?.text || '';
    } else {
      // OpenAI format: response.choices[0].message.content
      completion = response.choices?.[0]?.message?.content || '';
    }
    completion = completion.trim();

    const result: CompletionResponse = {
      completion,
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Completion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get completion' });
  }
});

export default router;
