/**
 * AGUI 协议封装层：使用 @ag-ui/client 发请求与消费事件流，聚合为 Thread/Run/Message
 */

import { State, type Message, type RunAgentInput } from "@ag-ui/core";
import { HttpAgent, type RunAgentParameters } from "@ag-ui/client";
import {
  AGUIDebug,
  eventToContent,
  generateMessageId,
  generateRunId,
  generateThreadId,
  getCurrentRun,
  getPreviousRunState,
  normalizeMessage,
  toRunAgentMessages,
} from "../utils";
import type {
  AGUIMessage,
  MessageEventType,
  MessageSegment,
  Run,
  Thread,
  ToolSegment,
} from "../types";

export interface AGUIClientOptions {
  /** AG-UI 服务端点，例如 https://api.example.com/agui */
  url: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 是否在控制台打印事件（调试） */
  debug?: boolean;
}

type Listener = (state: AGUIClientState) => void;

export interface AGUIClientState {
  currentThreadId: string | null;
  threads: Map<string, Thread>;
}

export class AGUIClient {
  private options: AGUIClientOptions;
  private httpAgent: HttpAgent;
  private state: AGUIClientState = {
    currentThreadId: null,
    threads: new Map(),
  };
  private listeners = new Set<Listener>();

  /** 当前流式消息的 messageId -> AGUIMessage 映射（用于聚合 content） */
  private streamingMessages = new Map<string, AGUIMessage>();

  /** 工具调用 ID -> 父消息 ID（TOOL_CALL_* 事件嵌套在 parentMessageId 对应的 message 下） */
  private streamingToolCalls = new Map<string, string>();

  private debug: AGUIDebug;

  constructor(options: AGUIClientOptions) {
    this.options = options;
    this.debug = new AGUIDebug(options.debug ?? false);
    const baseUrl = options.url.replace(/\/$/, "");
    this.httpAgent = new HttpAgent({
      url: baseUrl,
      headers: options.headers ?? {},
    });
  }

  getState(): AGUIClientState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state: AGUIClientState = {
      currentThreadId: this.state.currentThreadId,
      threads: new Map(this.state.threads),
    };
    this.listeners.forEach((fn) => fn(state));
  }

  private createEmptyThread(id: string): Thread {
    return { id, runs: [] };
  }

  private ensureThread(threadId: string): Thread {
    let thread = this.state.threads.get(threadId);
    if (!thread) {
      thread = this.createEmptyThread(threadId);
      this.state.threads.set(threadId, thread);
    }
    return thread;
  }

  /** 按 messageId 解析父消息：先查流式表，再查当前 run 的 messages（支持工具调用先于 TEXT_MESSAGE_END 到达的嵌套） */
  private resolveMessage(
    thread: Thread,
    messageId: string,
  ): AGUIMessage | undefined {
    const fromStreaming = this.streamingMessages.get(messageId);
    if (fromStreaming) return fromStreaming;
    const currentRun = getCurrentRun(thread);
    return currentRun?.messages.find((m) => m.id === messageId);
  }

  /** 将事件追加到当前 run 的 messages（Run 包含 AGUIMessage，AGUIMessage 包含原始事件） */
  private appendContent(thread: Thread, content: MessageEventType): void {
    const currentRun = getCurrentRun(thread);

    // --- Run 生命周期 ---
    if (content.kind === "RUN_STARTED") return;
    if (content.kind === "RUN_FINISHED") {
      if (currentRun) currentRun.isRunning = false;
      return;
    }
    if (content.kind === "RUN_ERROR") {
      if (currentRun) {
        currentRun.isRunning = false;
        currentRun.error = { message: content.message, code: content.code };
      }
      return;
    }

    // --- 文本消息流 ---
    if (content.kind === "TEXT_MESSAGE_START") {
      const existing = currentRun?.messages.find(
        (m) => m.id === content.messageId,
      );
      const msg: AGUIMessage = existing
        ? {
            ...existing,
            role: content.role,
            events: [...existing.events, content],
          }
        : {
            id: content.messageId,
            role: content.role,
            renderType: "text",
            segment: [],
            events: [content],
            timestamp: Date.now(),
          };
      this.streamingMessages.set(content.messageId, msg);
      if (currentRun && !existing) currentRun.messages.push(msg);
      return;
    }
    if (content.kind === "TEXT_MESSAGE_CONTENT") {
      const msg = this.streamingMessages.get(content.messageId);
      if (msg) {
        msg.events.push(content);
        const segments = msg.segment as MessageSegment[];
        const last = segments[segments.length - 1];
        if (last && last.type === "text") {
          last.content += content.delta;
        } else {
          segments.push({ type: "text", content: content.delta });
        }
      }
      return;
    }
    if (content.kind === "TEXT_MESSAGE_END") {
      this.streamingMessages.delete(content.messageId);
      return;
    }

    // --- 工具调用（TOOL_CALL_* 形成 segment，通过 parentMessageId 挂在对应 message 下，可嵌套在文本消息流中） ---
    if (content.kind === "TOOL_CALL_START") {
      const runMessages = currentRun?.messages ?? [];
      const last = runMessages[runMessages.length - 1];
      const parentMessageId = content.parentMessageId ?? last?.id;
      if (!parentMessageId) return;
      let parent = this.resolveMessage(thread, parentMessageId);
      if (!parent && currentRun) {
        const placeholder: AGUIMessage = {
          id: parentMessageId,
          role: "assistant",
          renderType: "text",
          segment: [],
          events: [],
          timestamp: Date.now(),
        };
        currentRun.messages.push(placeholder);
        this.streamingMessages.set(parentMessageId, placeholder);
        parent = placeholder;
      }
      if (parent) {
        parent.events.push(content);
        const existing = parent.segment.find(
          (s): s is ToolSegment =>
            s.type === "tool" && s.toolCallId === content.toolCallId,
        );
        if (!existing) {
          parent.segment.push({
            type: "tool",
            toolCallId: content.toolCallId,
            toolCallName: content.toolCallName,
          });
        }
        this.streamingToolCalls.set(content.toolCallId, parentMessageId);
      }
      return;
    }
    if (content.kind === "TOOL_CALL_ARGS") {
      const parentMessageId = this.streamingToolCalls.get(content.toolCallId);
      if (!parentMessageId) return;
      const parent = this.resolveMessage(thread, parentMessageId);
      if (parent) {
        parent.events.push(content);
        const seg = parent.segment.find(
          (s): s is ToolSegment =>
            s.type === "tool" && s.toolCallId === content.toolCallId,
        );
        if (seg) seg.args = (seg.args ?? "") + content.delta;
      }
      return;
    }
    if (content.kind === "TOOL_CALL_RESULT") {
      const parentMessageId = this.streamingToolCalls.get(content.toolCallId);
      if (!parentMessageId) return;
      const parent = this.resolveMessage(thread, parentMessageId);
      if (parent) {
        parent.events.push(content);
        const seg = parent.segment.find(
          (s): s is ToolSegment =>
            s.type === "tool" && s.toolCallId === content.toolCallId,
        );
        if (seg) seg.result = content.content;
      }
      // 协议顺序为 Start → Args → End → Result；收到 Result 后才不再需要 toolCallId 映射
      this.streamingToolCalls.delete(content.toolCallId);
      return;
    }
    if (content.kind === "TOOL_CALL_END") {
      const parentMessageId = this.streamingToolCalls.get(content.toolCallId);
      if (!parentMessageId) return;
      const parent = this.resolveMessage(thread, parentMessageId);
      if (parent) parent.events.push(content);
      // 不在此处 delete：End 仅表示参数传完，Result 稍后才到，需保留映射供 TOOL_CALL_RESULT 查找
      return;
    }

    // 未考虑到的事件不处理
  }

  /**
   * 运行 Agent：通过 HttpAgent.run(input) 一次传入完整 RunAgentInput（threadId / messages / state）
   */
  async run(parameters: RunAgentParameters, threadId?: string): Promise<void> {
    const tid = threadId ?? this.state.currentThreadId;
    if (tid == null)
      throw new Error("run() requires threadId or currentThreadId");
    this.state.currentThreadId = tid;
    const thread = this.ensureThread(tid);
    const runId = parameters.runId ?? generateRunId();
    let run = thread.runs.find((r) => r.runId === runId);
    if (!run) {
      run = {
        runId,
        messages: [],
        isRunning: true,
        timestamp: Date.now(),
      };
      thread.runs.push(run);
    } else {
      run.isRunning = true;
      run.error = undefined;
    }
    this.notify();

    const input = {
      threadId: thread.id,
      runId,
      state: (getPreviousRunState(thread) ?? {}) as State,
      messages: toRunAgentMessages(run.messages) as Message[],
      ...(parameters.tools && { tools: parameters.tools }),
      ...(parameters.context && { context: parameters.context }),
      ...(parameters.forwardedProps !== undefined && {
        forwardedProps: parameters.forwardedProps,
      }),
    } as RunAgentInput;

    const stateKeys =
      input.state && typeof input.state === "object"
        ? Object.keys(input.state as object)
        : [];
    this.debug.runStart({
      threadId: input.threadId,
      runId: input.runId,
      messagesCount: input.messages?.length ?? 0,
      stateKeys: stateKeys.length ? stateKeys : "(empty)",
      toolsCount: parameters.tools?.length ?? 0,
      contextCount: parameters.context?.length ?? 0,
    });

    const runStartTime = this.options.debug ? Date.now() : 0;

    return new Promise<void>((resolve, reject) => {
      this.httpAgent.run(input).subscribe({
        next: (event) => {
          const ev = event as Record<string, unknown>;
          this.debug.event(ev);
          const content = eventToContent(event as Record<string, unknown>);
          if (content) {
            this.appendContent(thread, content);
            this.notify();
          }
        },
        error: (err) => {
          this.debug.runFailed({
            threadId: thread.id,
            runId,
            errorMessage: err?.message ?? String(err),
            errorName: err?.name,
            stack: err?.stack,
          });
          const currentRun =
            getCurrentRun(thread) ?? thread.runs[thread.runs.length - 1];
          if (currentRun) {
            currentRun.isRunning = false;
            currentRun.error = { message: err?.message ?? String(err) };
          }
          this.notify();
          reject(err);
        },
        complete: () => {
          const duration = runStartTime ? Date.now() - runStartTime : 0;
          this.debug.runComplete({
            threadId: thread.id,
            runId,
            durationMs: duration,
          });
          const lastRun = thread.runs[thread.runs.length - 1];
          if (lastRun) lastRun.isRunning = false;
          this.notify();
          resolve();
        },
      });
    });
  }

  /** 设置当前线程（不发起请求） */
  setCurrentThread(threadId: string | null): void {
    this.state.currentThreadId = threadId;
    this.notify();
  }

  /** 创建新线程并设为当前（id 即 threadId） */
  createThread(): Thread {
    const id = generateThreadId();
    const thread = this.createEmptyThread(id);
    this.state.threads.set(id, thread);
    this.state.currentThreadId = id;
    this.notify();
    return thread;
  }

  /**
   * 向指定线程追加一条用户消息并创建新 Run（用于视图层 sendMessage）
   * 返回 runId 与 run，供 run() 复用该 run 并填充 toRunAgentMessages(run.messages)
   */
  appendUserMessage(
    threadId: string,
    content: string,
  ): { runId: string; run: Run; message: AGUIMessage } {
    const thread = this.state.threads.get(threadId);
    if (!thread) throw new Error(`Thread not found: ${threadId}`);
    // 首次用户消息时，用内容前 20 字作为线程标题
    if (thread.title == null && thread.runs.length === 0) {
      const trimmed = content.trim();
      thread.title = trimmed ? trimmed.slice(0, 20) : undefined;
    }
    const runId = generateRunId();
    const id = generateMessageId();
    const msg: AGUIMessage = {
      id,
      role: "user",
      renderType: "text",
      segment: [{ type: "text", content }],
      events: [
        { kind: "TEXT_MESSAGE_START", messageId: id, role: "user" },
        { kind: "TEXT_MESSAGE_CONTENT", messageId: id, delta: content },
        { kind: "TEXT_MESSAGE_END", messageId: id },
      ],
      timestamp: Date.now(),
    };
    const run: Run = {
      runId,
      messages: [msg],
      timestamp: Date.now(),
    };
    thread.runs.push(run);
    this.notify();
    return { runId, run, message: msg };
  }

  /**
   * 更新指定线程元信息（如 title）
   */
  updateThread(threadId: string, payload: { title?: string }): void {
    const thread = this.state.threads.get(threadId);
    if (!thread) return;
    if (payload.title !== undefined) thread.title = payload.title;
    this.notify();
  }

  /**
   * 分叉：删除包含该消息的 run 及其之后的所有 runs（用于 editMessage 前）
   * 返回是否找到并执行了分叉
   */
  forkAtMessage(threadId: string, messageId: string): boolean {
    const thread = this.state.threads.get(threadId);
    if (!thread) return false;
    let runIndex = -1;
    for (let i = 0; i < thread.runs.length; i++) {
      if (thread.runs[i].messages.some((m) => m.id === messageId)) {
        runIndex = i;
        break;
      }
    }
    if (runIndex < 0) return false;
    thread.runs.length = runIndex;
    this.notify();
    return true;
  }

  /**
   * 删除线程（用于视图层 deleteThread）
   */
  deleteThread(threadId: string): void {
    this.state.threads.delete(threadId);
    if (this.state.currentThreadId === threadId) {
      this.state.currentThreadId = null;
    }
    this.notify();
  }

  /**
   * 从持久化数据恢复线程（用于 storage.load() 之后）
   * 会清除每个 thread 的 isRunning / error，避免恢复后显示过期的加载或错误状态
   */
  hydrate(threads: Thread[], currentThreadId: string | null): void {
    const next = new Map<string, Thread>();
    for (const t of threads) {
      const runs = Array.isArray((t as Thread).runs)
        ? (t as Thread).runs.map((r) => ({
            ...r,
            messages: (Array.isArray(r.messages) ? r.messages : []).map((m) =>
              normalizeMessage(m),
            ),
            isRunning: false,
            error: undefined,
          }))
        : [];
      next.set(t.id, {
        id: t.id,
        runs,
        title: (t as Thread).title,
      });
    }
    this.state.threads = next;
    this.state.currentThreadId = currentThreadId;
    this.streamingMessages.clear();
    this.streamingToolCalls.clear();
    this.notify();
  }
}
