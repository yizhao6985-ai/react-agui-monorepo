/**
 * Application configuration.
 * Model config from env with defaults; API key from .env only.
 */

export interface ModelConfig {
  modelName: string;
  temperature: number;
  /** OpenAI 兼容 API 的 base URL，如 OpenRouter、自建代理等 */
  baseURL?: string;
}

export interface AppConfig {
  port: number;
  openaiApiKey: string | undefined;
  model: ModelConfig;
}

function getModelConfig(): ModelConfig {
  return {
    modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: Number(process.env.TEMPERATURE) || 1,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  };
}

export function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3001,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: getModelConfig(),
  };
}
