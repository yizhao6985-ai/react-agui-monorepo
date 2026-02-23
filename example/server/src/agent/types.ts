/**
 * Agent 相关类型定义
 */

import type { createAgent } from "langchain";

export interface RunAgentInput {
  threadId: string;
  runId: string;
  messages?: Array<{ role: string; content?: string; id?: string }>;
  state?: Record<string, unknown>;
  tools?: unknown[];
}

export interface AgentEvent {
  type: string;
  [key: string]: unknown;
}

/** 直接使用 LangChain createAgent 的返回类型 */
export type CreatedAgent = ReturnType<typeof createAgent>;
