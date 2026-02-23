/**
 * Agent 模块入口
 * - createServerAgent: 使用 LangChain 的 createAgent 创建（在路由外调用，传入 systemPrompt）
 * - createMiddleware: 从 LangChain 导出，便于扩展 agent 行为
 * - runAgent: 将 agent.stream() 映射为 AG-UI 协议事件
 */

export type { RunAgentInput, AgentEvent, CreatedAgent } from "./types.js";
export { createModel } from "./model.js";
export { createServerAgent } from "./createAgent.js";
export { runAgent } from "./runAgent.js";
export { createMiddleware } from "langchain";
