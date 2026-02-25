/**
 * AGUI React Context：面向视图层的 API（sendMessage / editMessage / createThread / deleteThread）
 * 支持可选 storage 做线程持久化（如 localStorage）
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
import type { Thread } from "../types";
import type { AGUIThreadStorage } from "../storage/types";

/** 面向视图层的数据与回调（类似 AntdX 等 AI 组件库） */
export interface AGUIProviderValue {
  // ---------- 数据（单层，无冗余派生） ----------
  /** 线程列表（侧边栏）；当前线程即其中 id 与 currentThread.id 一致的那条 */
  threads: Thread[];
  /** 当前线程（由 Provider 根据 currentThreadId + threads 算出）；为 null 表示未选线程 */
  currentThread: Thread | null;
  /** 当前线程是否正在请求中（由 getCurrentRun(currentThread)?.isRunning 派生） */
  loading: boolean;
  /** 当前线程错误信息（由 getCurrentRun(currentThread)?.error 派生） */
  error: { message: string; code?: string } | null;

  // ---------- 回调 ----------
  /** 发送用户消息并触发 Agent 运行 */
  sendMessage: (
    content: string,
    options?: { threadId?: string },
  ) => Promise<void>;
  /** 编辑消息并分叉：从该条起截断后续内容，用新内容重新发送 */
  editMessage: (
    messageId: string,
    content: string,
    options?: { threadId?: string },
  ) => Promise<void>;
  /** 重试当前线程最后一条失败的 run */
  retryMessage: (options?: { threadId?: string }) => Promise<void>;
  /** 新建线程并切换为当前 */
  createThread: () => Thread;
  /** 删除指定线程 */
  deleteThread: (threadId: string) => void;
  /** 切换当前线程 */
  switchThread: (threadId: string | null) => void;
  /** 更新线程标题 */
  updateThreadTitle: (threadId: string, title: string) => void;
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
  /** 可选：线程持久化存储（如 createLocalThreadStorage()），传入则自动加载/保存 */
  storage?: AGUIThreadStorage;
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
        .save(Array.from(s.threads.values()), s.currentThreadId)
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
    storage.load().then(({ threads, currentThreadId }) => {
      client.hydrate(threads, currentThreadId);
    });
  }, [client, storage]);

  const threads = useMemo(
    () => Array.from(state.threads.values()),
    [state.threads],
  );
  const currentThread =
    state.currentThreadId != null
      ? (state.threads.get(state.currentThreadId) ?? null)
      : null;
  const loading = getCurrentRun(currentThread)?.isRunning ?? false;
  const error = getCurrentRun(currentThread)?.error ?? null;

  const sendMessage = useCallback(
    async (content: string) => {
      const thread = currentThread ?? client.createThread();
      const { runId } = client.appendUserMessage(thread.id, content);
      const parameters: RunAgentParameters = { runId };
      await client.run(parameters, thread.id);
    },
    [client, currentThread],
  );

  const editMessage = useCallback(
    async (
      messageId: string,
      content: string,
      options?: { threadId?: string },
    ) => {
      const threadId = options?.threadId ?? currentThread?.id ?? null;
      if (!threadId) return;
      if (!client.forkAtMessage(threadId, messageId)) return;
      const { runId } = client.appendUserMessage(threadId, content);
      await client.run({ runId }, threadId);
    },
    [client, currentThread],
  );

  const retryMessage = useCallback(
    async (options?: { threadId?: string }) => {
      const threadId = options?.threadId ?? currentThread?.id ?? null;
      if (!threadId) return;
      const s = client.getState();
      const thread = s.threads.get(threadId);
      if (!thread || thread.runs.length === 0) return;
      const lastRun = thread.runs[thread.runs.length - 1];
      const parameters: RunAgentParameters = { runId: lastRun.runId };
      await client.run(parameters, threadId);
    },
    [client, currentThread],
  );

  const createThread = useCallback(() => client.createThread(), [client]);

  const deleteThread = useCallback(
    (threadId: string) => client.deleteThread(threadId),
    [client],
  );

  const switchThread = useCallback(
    (threadId: string | null) => client.setCurrentThread(threadId),
    [client],
  );

  const updateThreadTitle = useCallback(
    (threadId: string, title: string) => {
      client.updateThread(threadId, { title });
    },
    [client],
  );

  const value = useMemo<AGUIProviderValue>(
    () => ({
      threads,
      currentThread,
      loading,
      error,
      sendMessage,
      editMessage,
      retryMessage,
      createThread,
      deleteThread,
      switchThread,
      updateThreadTitle,
    }),
    [
      threads,
      currentThread,
      loading,
      error,
      sendMessage,
      editMessage,
      createThread,
      retryMessage,
      deleteThread,
      switchThread,
      updateThreadTitle,
    ],
  );

  return <AGUIContext.Provider value={value}>{children}</AGUIContext.Provider>;
}
