/**
 * 通过 LangChain 的 createAgent 创建 Agent，仅负责组合 model + tools + systemPrompt。
 * 模型实例由 createModel()（initChatModel）提供，stream 的入参转换与迭代由路由/runAgent 负责。
 */

import { createAgent } from "langchain";
import { createModel } from "./model.js";
import { getSystemPrompt } from "./prompts/index.js";
import { tools } from "./tools/index.js";
import type { CreatedAgent } from "./types.js";

/**
 * 创建服务端 Agent（内部调用 LangChain createAgent，需 await 因模型为异步初始化）
 */
export async function createServerAgent(): Promise<CreatedAgent> {
  const model = await createModel();
  const systemPrompt = getSystemPrompt();
  return createAgent({
    model,
    tools,
    systemPrompt,
  });
}
