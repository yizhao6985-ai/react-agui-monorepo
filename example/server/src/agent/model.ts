/**
 * 使用 LangChain initChatModel 创建 LLM 模型实例（OpenAI）。
 * 参见：https://js.langchain.com/docs/integrations/chat/
 */

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { initChatModel } from "langchain/chat_models/universal";
import { getConfig } from "./config/index.js";

/**
 * 根据环境变量创建 OpenAI 模型（initChatModel 推断 provider 为 openai）。
 */
export async function createModel(): Promise<BaseChatModel> {
  const { model: modelConfig, openaiApiKey } = getConfig();
  return initChatModel(`openai:${modelConfig.modelName}`, {
    temperature: modelConfig.temperature,
    apiKey: openaiApiKey ?? undefined,
  });
}
