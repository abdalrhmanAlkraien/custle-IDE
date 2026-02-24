import axios, { AxiosError } from 'axios';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'openai-compatible';
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface SafeModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'openai-compatible';
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface TestConnectionResult {
  ok: boolean;
  latency?: number;
  modelList?: string[];
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
}

// In-memory storage for model configs
let savedConfigs: Map<string, ModelConfig> = new Map();
let activeConfigId: string | null = null;

/**
 * Get current active model config (without API key)
 */
export function getActiveConfig(): SafeModelConfig | null {
  if (!activeConfigId || !savedConfigs.has(activeConfigId)) {
    return null;
  }

  const config = savedConfigs.get(activeConfigId)!;
  return stripApiKey(config);
}

/**
 * Get all saved configs (without API keys)
 */
export function getAllConfigs(): SafeModelConfig[] {
  return Array.from(savedConfigs.values()).map(stripApiKey);
}

/**
 * Save and activate a model config
 */
export function saveConfig(config: ModelConfig): SafeModelConfig {
  savedConfigs.set(config.id, config);
  activeConfigId = config.id;
  console.log(`Model config saved and activated: ${config.name} (${config.id})`);
  return stripApiKey(config);
}

/**
 * Delete a model config
 */
export function deleteConfig(id: string): boolean {
  if (!savedConfigs.has(id)) {
    return false;
  }

  savedConfigs.delete(id);

  // If deleted config was active, clear active config
  if (activeConfigId === id) {
    activeConfigId = null;
  }

  console.log(`Model config deleted: ${id}`);
  return true;
}

/**
 * Set active config by ID
 */
export function setActiveConfig(id: string): SafeModelConfig | null {
  if (!savedConfigs.has(id)) {
    return null;
  }

  activeConfigId = id;
  const config = savedConfigs.get(id)!;
  console.log(`Active model switched to: ${config.name}`);
  return stripApiKey(config);
}

/**
 * Get active config with API key (backend use only - never send to frontend!)
 */
export function getActiveConfigFull(): ModelConfig | null {
  if (!activeConfigId || !savedConfigs.has(activeConfigId)) {
    return null;
  }

  return savedConfigs.get(activeConfigId)!;
}

/**
 * Test connection to a model provider
 */
export async function testConnection(
  config: ModelConfig
): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    // Different test endpoints based on provider
    let testUrl: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.provider === 'openai' || config.provider === 'openai-compatible') {
      // OpenAI and compatible APIs use /v1/models endpoint
      testUrl = `${config.baseUrl}/v1/models`;
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.provider === 'anthropic') {
      // Anthropic uses /v1/messages endpoint (need to send a minimal request)
      testUrl = `${config.baseUrl}/v1/messages`;
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      return {
        ok: false,
        error: `Unsupported provider: ${config.provider}`,
      };
    }

    // Make test request with 10-second timeout
    if (config.provider === 'anthropic') {
      // For Anthropic, send a minimal request to test connection
      await axios.post(
        testUrl,
        {
          model: config.model || 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers,
          timeout: 10000,
        }
      );
    } else {
      // For OpenAI and compatible, just list models
      const response = await axios.get(testUrl, {
        headers,
        timeout: 10000,
      });

      // Extract model list
      const modelList: string[] = [];
      if (response.data && response.data.data) {
        modelList.push(
          ...response.data.data.map((m: any) => m.id || m.name || 'unknown')
        );
      }

      const latency = Date.now() - startTime;
      return {
        ok: true,
        latency,
        modelList: modelList.length > 0 ? modelList : ['Model list not available'],
      };
    }

    const latency = Date.now() - startTime;
    return {
      ok: true,
      latency,
      modelList: [config.model || 'Model name not specified'],
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    let errorMessage = 'Unknown error';

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - check URL';
      } else if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout (10s)';
      } else if (axiosError.response) {
        errorMessage = `HTTP ${axiosError.response.status}: ${
          axiosError.response.statusText
        }`;
        if (axiosError.response.status === 401) {
          errorMessage = 'Invalid API key';
        } else if (axiosError.response.status === 404) {
          errorMessage = 'Endpoint not found - check URL';
        }
      } else {
        errorMessage = axiosError.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      ok: false,
      latency,
      error: errorMessage,
    };
  }
}

/**
 * Send chat request to model provider
 */
export async function sendChatRequest(
  request: ChatRequest
): Promise<any> {
  if (!activeConfigId || !savedConfigs.has(activeConfigId)) {
    throw new Error('No active model configuration');
  }

  const config = savedConfigs.get(activeConfigId)!;

  try {
    if (config.provider === 'openai' || config.provider === 'openai-compatible') {
      // OpenAI format
      const response = await axios.post(
        `${config.baseUrl}/v1/chat/completions`,
        {
          model: config.model,
          messages: request.messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          stream: request.stream || false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          timeout: 60000, // 60 second timeout for chat
        }
      );

      return response.data;
    } else if (config.provider === 'anthropic') {
      // Anthropic format (convert messages)
      const systemMessage = request.messages.find((m) => m.role === 'system');
      const userMessages = request.messages.filter((m) => m.role !== 'system');

      const response = await axios.post(
        `${config.baseUrl}/v1/messages`,
        {
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: systemMessage?.content,
          messages: userMessages,
          stream: request.stream || false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          timeout: 60000,
        }
      );

      return response.data;
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `Model API error: ${axiosError.response.status} - ${
            axiosError.response.statusText
          }`
        );
      }
      throw new Error(`Network error: ${axiosError.message}`);
    }
    throw error;
  }
}

/**
 * Strip API key from config (for sending to frontend)
 */
function stripApiKey(config: ModelConfig): SafeModelConfig {
  const { apiKey, ...safeConfig } = config;
  return safeConfig;
}
