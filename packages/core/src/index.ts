/**
 * react-agui-core
 * 基于 AGUI 协议的 React SDK，提供面向 AI 渲染的 Provider 与 Hook
 */

// 类型
export type {
  AGUIEventType,
  AGUIMessage,
  MessageEventType,
  MessageRole,
  MessageSegment,
  AGUIMessages,
  RenderType,
  Run,
  Runs,
  Session,
  TextSegment,
  ToolSegment,
} from "./types";

// AGUI 封装层
export { AGUIClient } from "./agui";

// 持久化存储
export type { AGUISessionStorage, PersistedSession } from "./storage";
export { createLocalSessionStorage } from "./storage";
export type { LocalSessionStorageOptions } from "./storage";

// React（面向视图层的 API）
export { AGUIProvider, AGUIContext } from "./context/AGUIContext";
export type { AGUIProviderValue } from "./context/AGUIContext";
export { useAGUI } from "./hooks/useAGUI";
// 工具（供 UI 包等使用）
export { getMessageText, getSessionMessages } from "./utils";
