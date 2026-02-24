import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT ?? '3001',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  // Model defaults — overrideable at runtime via API
  DEFAULT_MODEL_URL: process.env.MODEL_URL ?? 'http://localhost:18000',
  DEFAULT_MODEL_NAME: process.env.MODEL_NAME ?? 'Qwen3-Coder-30B-A3B',
  DEFAULT_MODEL_KEY: process.env.MODEL_API_KEY ?? '',
};
