/**
 * AGUI 协议下用于 AI 渲染的数据类型
 * 类型关系：Run 包含 AGUIMessage[]，AGUIMessage 包含 renderType、segment、events（原始 AGUI 事件）
 */

import type { EventType } from "@ag-ui/core";

/** 消息角色 */
export type MessageRole =
  | "developer"
  | "system"
  | "assistant"
  | "user"
  | "tool"
  | "activity";

/**
 * 单条消息内的事件内容项（对应 AGUI 事件解析结果）
 * 覆盖协议中的主要事件类型
 */
export type MessageEventType =
  | { kind: "TEXT_MESSAGE_START"; messageId: string; role: MessageRole }
  | { kind: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string }
  | { kind: "TEXT_MESSAGE_END"; messageId: string }
  | {
      kind: "TOOL_CALL_START";
      toolCallId: string;
      toolCallName: string;
      parentMessageId?: string;
    }
  | { kind: "TOOL_CALL_ARGS"; toolCallId: string; delta: string }
  | { kind: "TOOL_CALL_END"; toolCallId: string }
  | {
      kind: "TOOL_CALL_RESULT";
      messageId: string;
      toolCallId: string;
      content: string;
      role?: "tool";
    }
  | { kind: "STATE_SNAPSHOT"; snapshot: unknown }
  | { kind: "STATE_DELTA"; delta: unknown[] }
  | { kind: "MESSAGES_SNAPSHOT"; messages: AGUIMessage[] }
  | {
      kind: "ACTIVITY_SNAPSHOT";
      messageId: string;
      activityType: string;
      content: Record<string, unknown>;
      replace?: boolean;
    }
  | {
      kind: "ACTIVITY_DELTA";
      messageId: string;
      activityType: string;
      patch: unknown[];
    }
  | {
      kind: "RUN_STARTED";
      threadId: string;
      runId: string;
      parentRunId?: string;
      input?: unknown;
    }
  | { kind: "RUN_FINISHED"; threadId: string; runId: string; result?: unknown }
  | { kind: "RUN_ERROR"; message: string; code?: string }
  | { kind: "STEP_STARTED"; stepName: string }
  | { kind: "STEP_FINISHED"; stepName: string }
  | { kind: "RAW"; event: unknown; source?: string }
  | { kind: "CUSTOM"; name: string; value: unknown };

/** 原始 AGUI 事件类型（与 @ag-ui/core EventType 对齐） */
export type AGUIEventType = EventType;

/** 渲染类型：当前仅支持文本与工具两种 */
export type RenderType = "text" | "tool";

/** 文本片段（用于文本渲染） */
export interface TextSegment {
  type: "text";
  /** 文本内容 */
  content: string;
}

/** 工具片段（用于工具渲染） */
export interface ToolSegment {
  type: "tool";
  /** 工具调用 ID */
  toolCallId: string;
  /** 工具名称 */
  toolCallName: string;
  /** 调用参数（如 JSON 字符串） */
  args?: string;
  /** 执行结果 */
  result?: string;
}

/** 消息片段：文本或工具，由 AGUIMessage.segment 存放 */
export type MessageSegment = TextSegment | ToolSegment;

/**
 * 单条会话消息：包含原始 AGUI 事件与渲染用 segment
 * 用于展示与 MESSAGES_SNAPSHOT（命名与 @ag-ui/core 的 Message 区分，便于直接导入 core 类型）
 */
export interface AGUIMessage {
  /** 消息 ID，同时作为 AGUI 协议的 messageId */
  id: string;
  /** 消息角色 */
  role?: MessageRole;
  /** 渲染类型（文本 / 工具），与 segment 对应 */
  renderType: RenderType;
  /** 存放文本片段与工具片段的列表，按顺序渲染 */
  segment: MessageSegment[];
  /** 原始 AGUI 事件列表（本条消息对应的事件） */
  events: MessageEventType[];
  /** 时间戳 */
  timestamp?: number;
}

/** 消息列表 */
export type AGUIMessages = AGUIMessage[];

/**
 * 一次 Agent 运行：从 RUN_STARTED 到 RUN_FINISHED 的 AGUIMessage 集合
 * runId 由前端在用户发送消息时创建，属于 run 维度而非 thread
 */
export interface Run {
  /** 本次运行的 ID（前端创建，如 run_${Date.now()}） */
  runId: string;
  /** 本 run 内的消息列表（每条 AGUIMessage 包含原始 AGUI 事件） */
  messages: AGUIMessages;
  /** 本 run 的共享状态（来自 STATE_SNAPSHOT / STATE_DELTA） */
  state?: unknown;
  /** 是否正在运行 */
  isRunning?: boolean;
  /** 错误信息（来自 RUN_ERROR） */
  error?: { message: string; code?: string };
  /** 时间戳 */
  timestamp?: number;
}

/** Run 列表 */
export type Runs = Run[];

/**
 * 线程（对话线）
 * 不包含 messages、state、isRunning、error；均由 Run 维度表示，可通过 getThreadMessages / getCurrentRun 等派生
 */
export interface Thread {
  /** 线程 ID，同时作为 AGUI 协议的 threadId */
  id: string;
  /** 每次调用的 run 记录（RUN_STARTED 到 RUN_FINISHED），每条 Run 包含 messages、state、isRunning、error */
  runs: Runs;
  /** 线程标题 */
  title?: string;
}

/**
 * SDK 内部/对外状态（currentThread 由 consumer 根据 currentThreadId + threads 派生）
 */
export interface AGUIState {
  /** 当前线程 ID */
  currentThreadId: string | null;
  /** 线程映射 threadId -> Thread */
  threads: Map<string, Thread>;
}
