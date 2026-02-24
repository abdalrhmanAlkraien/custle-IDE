import { Router, Request, Response } from 'express';
import {
  getActiveConfig,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  setActiveConfig,
  testConnection,
  sendChatRequest,
  ModelConfig,
} from '../services/modelService';

const router = Router();

/**
 * GET /api/model/config
 * Get current active model configuration (without API key)
 */
router.get('/config', (_req: Request, res: Response) => {
  try {
    const config = getActiveConfig();
    if (!config) {
      res.status(404).json({ error: 'No active model configuration' });
      return;
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error getting model config:', error);
    res.status(500).json({ error: error.message || 'Failed to get model config' });
  }
});

/**
 * GET /api/model/list
 * Get all saved model configurations (without API keys)
 */
router.get('/list', (_req: Request, res: Response) => {
  try {
    const configs = getAllConfigs();
    res.json(configs);
  } catch (error: any) {
    console.error('Error listing model configs:', error);
    res.status(500).json({ error: error.message || 'Failed to list model configs' });
  }
});

/**
 * POST /api/model/config
 * Save and activate a model configuration
 * Body: ModelConfig
 */
router.post('/config', (req: Request, res: Response) => {
  try {
    const configData = req.body as ModelConfig;

    // Validate required fields
    if (!configData.id || !configData.name || !configData.provider) {
      res.status(400).json({ error: 'Missing required fields: id, name, provider' });
      return;
    }

    if (!configData.baseUrl || !configData.apiKey) {
      res.status(400).json({ error: 'Missing required fields: baseUrl, apiKey' });
      return;
    }

    // Save config (strips API key before returning)
    const safeConfig = saveConfig(configData);
    res.json(safeConfig);
  } catch (error: any) {
    console.error('Error saving model config:', error);
    res.status(500).json({ error: error.message || 'Failed to save model config' });
  }
});

/**
 * DELETE /api/model/config/:id
 * Delete a model configuration
 */
router.delete('/config/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = deleteConfig(id);
    if (!deleted) {
      res.status(404).json({ error: 'Model configuration not found' });
      return;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting model config:', error);
    res.status(500).json({ error: error.message || 'Failed to delete model config' });
  }
});

/**
 * POST /api/model/activate/:id
 * Set active model configuration by ID
 */
router.post('/activate/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const config = setActiveConfig(id);
    if (!config) {
      res.status(404).json({ error: 'Model configuration not found' });
      return;
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error activating model config:', error);
    res.status(500).json({ error: error.message || 'Failed to activate model config' });
  }
});

/**
 * POST /api/model/test
 * Test connection to a model provider
 * Body: ModelConfig (temporary, not saved)
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const configData = req.body as ModelConfig;

    // Validate required fields
    if (!configData.provider || !configData.baseUrl || !configData.apiKey) {
      res.status(400).json({
        error: 'Missing required fields: provider, baseUrl, apiKey',
      });
      return;
    }

    // Test connection
    const result = await testConnection(configData);
    res.json(result);
  } catch (error: any) {
    console.error('Error testing model connection:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to test connection',
    });
  }
});

/**
 * POST /api/model/chat
 * Proxy chat request to active model provider
 * Body: { messages: ChatMessage[], stream?: boolean }
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const request = req.body;

    // Validate request
    if (!request.messages || !Array.isArray(request.messages)) {
      res.status(400).json({ error: 'Missing or invalid messages array' });
      return;
    }

    // Send chat request through model service
    const response = await sendChatRequest(request);
    res.json(response);
  } catch (error: any) {
    console.error('Error sending chat request:', error);

    // Return error in a format the frontend can handle
    res.status(500).json({
      error: error.message || 'Failed to send chat request',
    });
  }
});

export default router;
