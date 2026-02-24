import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/model';

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

/**
 * Get current active model configuration
 */
export async function getActiveConfig(): Promise<SafeModelConfig | null> {
  try {
    const response = await axios.get(`${API_BASE}/config`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // No active config
    }
    throw error;
  }
}

/**
 * Get all saved model configurations
 */
export async function getAllConfigs(): Promise<SafeModelConfig[]> {
  const response = await axios.get(`${API_BASE}/list`);
  return response.data;
}

/**
 * Save and activate a model configuration
 */
export async function saveConfig(config: ModelConfig): Promise<SafeModelConfig> {
  const response = await axios.post(`${API_BASE}/config`, config);
  return response.data;
}

/**
 * Delete a model configuration
 */
export async function deleteConfig(id: string): Promise<void> {
  await axios.delete(`${API_BASE}/config/${id}`);
}

/**
 * Activate a model configuration by ID
 */
export async function activateConfig(id: string): Promise<SafeModelConfig> {
  const response = await axios.post(`${API_BASE}/activate/${id}`);
  return response.data;
}

/**
 * Test connection to a model provider
 */
export async function testConnection(
  config: ModelConfig
): Promise<TestConnectionResult> {
  try {
    const response = await axios.post(`${API_BASE}/test`, config, {
      timeout: 12000, // 12 second timeout (backend has 10s)
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          ok: false,
          error: 'Connection timeout',
        };
      }
      if (error.response?.data) {
        return error.response.data;
      }
    }
    return {
      ok: false,
      error: 'Unknown error',
    };
  }
}

/**
 * Send chat request to active model
 */
export async function sendChatRequest(request: ChatRequest): Promise<any> {
  const response = await axios.post(`${API_BASE}/chat`, request, {
    timeout: 65000, // 65 second timeout
  });
  return response.data;
}

/**
 * Preset model configurations
 */
export const MODEL_PRESETS = {
  'openai-gpt4': {
    name: 'OpenAI GPT-4o',
    provider: 'openai' as const,
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.7,
  },
  'anthropic-claude': {
    name: 'Anthropic Claude Sonnet',
    provider: 'anthropic' as const,
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.7,
  },
  'ollama-local': {
    name: 'Local Ollama',
    provider: 'openai-compatible' as const,
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    maxTokens: 2048,
    temperature: 0.7,
  },
  'vllm-custom': {
    name: 'Custom vLLM',
    provider: 'openai-compatible' as const,
    baseUrl: 'http://localhost:8000',
    model: 'meta-llama/Llama-2-7b-chat-hf',
    maxTokens: 2048,
    temperature: 0.7,
  },
};
