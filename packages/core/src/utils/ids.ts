/**
 * AGUI 协议下各类 ID 的生成（threadId / runId / messageId）
 */

import { v4 as uuidv4 } from "uuid";

/** 生成会话 ID（作为 AGUI threadId） */
export function generateThreadId(): string {
  return `thread_${uuidv4()}`;
}

/** 生成 run ID（前端发起一次 Agent 运行时使用） */
export function generateRunId(): string {
  return `run_${uuidv4()}`;
}

/** 生成消息 ID（作为 AGUI messageId） */
export function generateMessageId(): string {
  return `msg_${uuidv4()}`;
}
