/**
 * AGUI React Context：面向视图层的 API（sendMessage / editMessage / createSession / deleteSession）
 * 支持可选 storage 做会话持久化（如 localStorage）
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AGUIClient } from "../agui";
import { getCurrentRun } from "../utils";
import type { RunAgentParameters } from "@ag-ui/client";
import type { Session } from "../types";
import type { AGUISessionStorage } from "../storage/types";

/** 面向视图层的数据与回调（类似 AntdX 等 AI 组件库） */
export interface AGUIProviderValue {
  // ---------- 数据（单层，无冗余派生） ----------
  /** 会话列表（侧边栏）；当前会话即其中 id 与 currentSession.id 一致的那条 */
  sessions: Session[];
  /** 当前会话（由 Provider 根据 currentSessionId + sessions 算出）；为 null 表示未选会话 */
  currentSession: Session | null;
  /** 当前会话是否正在请求中（由 getCurrentRun(currentSession)?.isRunning 派生） */
  loading: boolean;
  /** 当前会话错误信息（由 getCurrentRun(currentSession)?.error 派生） */
  error: { message: string; code?: string } | null;

  // ---------- 回调 ----------
  /** 发送用户消息并触发 Agent 运行 */
  sendMessage: (
    content: string,
    options?: { sessionId?: string },
  ) => Promise<void>;
  /** 编辑消息并分叉：从该条起截断后续内容，用新内容重新发送 */
  editMessage: (
    messageId: string,
    content: string,
    options?: { sessionId?: string },
  ) => Promise<void>;
  /** 重试当前会话最后一条失败的 run */
  retryMessage: (options?: { sessionId?: string }) => Promise<void>;
  /** 新建会话并切换为当前 */
  createSession: () => Session;
  /** 删除指定会话 */
  deleteSession: (sessionId: string) => void;
  /** 切换当前会话 */
  switchSession: (sessionId: string | null) => void;
  /** 更新会话标题 */
  updateSessionTitle: (sessionId: string, title: string) => void;
}

export const AGUIContext = createContext<AGUIProviderValue | undefined>(
  undefined,
);

export interface AGUIProviderProps {
  /** AG-UI 服务地址 */
  url: string;
  /** 可选请求头 */
  headers?: Record<string, string>;
  /** 是否调试（打印事件） */
  debug?: boolean;
  /** 可选：会话持久化存储（如 createLocalSessionStorage()），传入则自动加载/保存 */
  storage?: AGUISessionStorage;
  /** 子组件 */
  children?: React.ReactNode;
}

const SAVE_DEBOUNCE_MS = 400;

export function AGUIProvider({
  url,
  headers,
  debug,
  storage,
  children,
}: AGUIProviderProps): React.ReactElement {
  const clientRef = useRef<AGUIClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new AGUIClient({ url, headers, debug });
  }
  const client = clientRef.current;
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const [state, setState] = useState(() => client.getState());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(() => {
    const store = storageRef.current;
    if (!store) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      const s = client.getState();
      store
        .save(Array.from(s.sessions.values()), s.currentSessionId)
        .catch((err) => {
          console.warn("[agui] storage.save failed", err);
        });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const unsubscribeRef = useRef<() => void>();
  if (!unsubscribeRef.current) {
    unsubscribeRef.current = client.subscribe((next) => {
      setState(next);
      scheduleSave();
    });
  }

  useEffect(() => {
    if (!storage) return;
    storage.load().then(({ sessions, currentSessionId }) => {
      client.hydrate(sessions, currentSessionId);
    });
  }, [client, storage]);

  const sessions = useMemo(
    () => Array.from(state.sessions.values()),
    [state.sessions],
  );
  const currentSession =
    state.currentSessionId != null
      ? (state.sessions.get(state.currentSessionId) ?? null)
      : null;
  const loading = getCurrentRun(currentSession)?.isRunning ?? false;
  const error = getCurrentRun(currentSession)?.error ?? null;

  const sendMessage = useCallback(
    async (content: string) => {
      const session = currentSession ?? client.createSession();
      const { runId } = client.appendUserMessage(session.id, content);
      const parameters: RunAgentParameters = { runId };
      await client.run(parameters, session.id);
    },
    [client, currentSession],
  );

  const editMessage = useCallback(
    async (
      messageId: string,
      content: string,
      options?: { sessionId?: string },
    ) => {
      const sessionId = options?.sessionId ?? currentSession?.id ?? null;
      if (!sessionId) return;
      if (!client.forkAtMessage(sessionId, messageId)) return;
      const { runId } = client.appendUserMessage(sessionId, content);
      await client.run({ runId }, sessionId);
    },
    [client, currentSession],
  );

  const retryMessage = useCallback(
    async (options?: { sessionId?: string }) => {
      const sessionId = options?.sessionId ?? currentSession?.id ?? null;
      if (!sessionId) return;
      const s = client.getState();
      const session = s.sessions.get(sessionId);
      if (!session || session.runs.length === 0) return;
      const lastRun = session.runs[session.runs.length - 1];
      const parameters: RunAgentParameters = { runId: lastRun.runId };
      await client.run(parameters, sessionId);
    },
    [client, currentSession],
  );

  const createSession = useCallback(() => client.createSession(), [client]);

  const deleteSession = useCallback(
    (sessionId: string) => client.deleteSession(sessionId),
    [client],
  );

  const switchSession = useCallback(
    (sessionId: string | null) => client.setCurrentSession(sessionId),
    [client],
  );

  const updateSessionTitle = useCallback(
    (sessionId: string, title: string) => {
      client.updateSession(sessionId, { title });
    },
    [client],
  );

  const value = useMemo<AGUIProviderValue>(
    () => ({
      sessions,
      currentSession,
      loading,
      error,
      sendMessage,
      editMessage,
      retryMessage,
      createSession,
      deleteSession,
      switchSession,
      updateSessionTitle,
    }),
    [
      sessions,
      currentSession,
      loading,
      error,
      sendMessage,
      editMessage,
      createSession,
      retryMessage,
      deleteSession,
      switchSession,
      updateSessionTitle,
    ],
  );

  return <AGUIContext.Provider value={value}>{children}</AGUIContext.Provider>;
}
