/**
 * Agent 配置：端口、模型（由环境变量决定，使用 OpenAI）
 */

const DEFAULT_MODEL = "gpt-4o-mini" as const;

export interface ModelConfig {
  modelName: string;
  temperature: number;
}

export interface AppConfig {
  port: number;
  openaiApiKey: string | undefined;
  model: ModelConfig;
}

function getModelConfig(): ModelConfig {
  const temperature = Number(process.env.TEMPERATURE) || 1;
  return {
    modelName: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    temperature,
  };
}

export function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3001,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: getModelConfig(),
  };
}
