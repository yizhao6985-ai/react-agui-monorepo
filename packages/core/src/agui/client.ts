/**
 * AGUI 协议封装层：使用 @ag-ui/client 发请求与消费事件流，聚合为 Session/Run/Message
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
  Session,
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
  currentSessionId: string | null;
  sessions: Map<string, Session>;
}

export class AGUIClient {
  private options: AGUIClientOptions;
  private httpAgent: HttpAgent;
  private state: AGUIClientState = {
    currentSessionId: null,
    sessions: new Map(),
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
      currentSessionId: this.state.currentSessionId,
      sessions: new Map(this.state.sessions),
    };
    this.listeners.forEach((fn) => fn(state));
  }

  private createEmptySession(id: string): Session {
    return { id, runs: [] };
  }

  private ensureSession(sessionId: string): Session {
    let session = this.state.sessions.get(sessionId);
    if (!session) {
      session = this.createEmptySession(sessionId);
      this.state.sessions.set(sessionId, session);
    }
    return session;
  }

  /** 按 messageId 解析父消息：先查流式表，再查当前 run 的 messages（支持工具调用先于 TEXT_MESSAGE_END 到达的嵌套） */
  private resolveMessage(
    session: Session,
    messageId: string,
  ): AGUIMessage | undefined {
    const fromStreaming = this.streamingMessages.get(messageId);
    if (fromStreaming) return fromStreaming;
    const currentRun = getCurrentRun(session);
    return currentRun?.messages.find((m) => m.id === messageId);
  }

  /** 将事件追加到当前 run 的 messages（Run 包含 AGUIMessage，AGUIMessage 包含原始事件） */
  private appendContent(session: Session, content: MessageEventType): void {
    const currentRun = getCurrentRun(session);

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
      let parent = this.resolveMessage(session, parentMessageId);
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
      const parent = this.resolveMessage(session, parentMessageId);
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
      const parent = this.resolveMessage(session, parentMessageId);
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
      const parent = this.resolveMessage(session, parentMessageId);
      if (parent) parent.events.push(content);
      // 不在此处 delete：End 仅表示参数传完，Result 稍后才到，需保留映射供 TOOL_CALL_RESULT 查找
      return;
    }

    // 未考虑到的事件不处理
  }

  /**
   * 运行 Agent：通过 HttpAgent.run(input) 一次传入完整 RunAgentInput（threadId / messages / state）
   */
  async run(parameters: RunAgentParameters, sessionId?: string): Promise<void> {
    const sid = sessionId ?? this.state.currentSessionId;
    if (sid == null)
      throw new Error("run() requires sessionId or currentSessionId");
    this.state.currentSessionId = sid;
    const session = this.ensureSession(sid);
    const runId = parameters.runId ?? generateRunId();
    let run = session.runs.find((r) => r.runId === runId);
    if (!run) {
      run = {
        runId,
        messages: [],
        isRunning: true,
        timestamp: Date.now(),
      };
      session.runs.push(run);
    } else {
      run.isRunning = true;
      run.error = undefined;
    }
    this.notify();

    const input = {
      threadId: session.id,
      runId,
      state: (getPreviousRunState(session) ?? {}) as State,
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
            this.appendContent(session, content);
            this.notify();
          }
        },
        error: (err) => {
          this.debug.runFailed({
            sessionId: session.id,
            runId,
            errorMessage: err?.message ?? String(err),
            errorName: err?.name,
            stack: err?.stack,
          });
          const currentRun =
            getCurrentRun(session) ?? session.runs[session.runs.length - 1];
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
            sessionId: session.id,
            runId,
            durationMs: duration,
          });
          const lastRun = session.runs[session.runs.length - 1];
          if (lastRun) lastRun.isRunning = false;
          this.notify();
          resolve();
        },
      });
    });
  }

  /** 设置当前会话（不发起请求） */
  setCurrentSession(sessionId: string | null): void {
    this.state.currentSessionId = sessionId;
    this.notify();
  }

  /** 创建新会话并设为当前（id 即 threadId） */
  createSession(): Session {
    const id = generateThreadId();
    const session = this.createEmptySession(id);
    this.state.sessions.set(id, session);
    this.state.currentSessionId = id;
    this.notify();
    return session;
  }

  /**
   * 向指定会话追加一条用户消息并创建新 Run（用于视图层 sendMessage）
   * 返回 runId 与 run，供 run() 复用该 run 并填充 toRunAgentMessages(run.messages)
   */
  appendUserMessage(
    sessionId: string,
    content: string,
  ): { runId: string; run: Run; message: AGUIMessage } {
    const session = this.state.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    // 首次用户消息时，用内容前 20 字作为会话标题
    if (session.title == null && session.runs.length === 0) {
      const trimmed = content.trim();
      session.title = trimmed ? trimmed.slice(0, 20) : undefined;
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
    session.runs.push(run);
    this.notify();
    return { runId, run, message: msg };
  }

  /**
   * 更新指定会话元信息（如 title）
   */
  updateSession(sessionId: string, payload: { title?: string }): void {
    const session = this.state.sessions.get(sessionId);
    if (!session) return;
    if (payload.title !== undefined) session.title = payload.title;
    this.notify();
  }

  /**
   * 分叉：删除包含该消息的 run 及其之后的所有 runs（用于 editMessage 前）
   * 返回是否找到并执行了分叉
   */
  forkAtMessage(sessionId: string, messageId: string): boolean {
    const session = this.state.sessions.get(sessionId);
    if (!session) return false;
    let runIndex = -1;
    for (let i = 0; i < session.runs.length; i++) {
      if (session.runs[i].messages.some((m) => m.id === messageId)) {
        runIndex = i;
        break;
      }
    }
    if (runIndex < 0) return false;
    session.runs.length = runIndex;
    this.notify();
    return true;
  }

  /**
   * 删除会话（用于视图层 deleteSession）
   */
  deleteSession(sessionId: string): void {
    this.state.sessions.delete(sessionId);
    if (this.state.currentSessionId === sessionId) {
      this.state.currentSessionId = null;
    }
    this.notify();
  }

  /**
   * 从持久化数据恢复会话（用于 storage.load() 之后）
   * 会清除每个 session 的 isRunning / error，避免恢复后显示过期的加载或错误状态
   */
  hydrate(sessions: Session[], currentSessionId: string | null): void {
    const next = new Map<string, Session>();
    for (const s of sessions) {
      const runs = Array.isArray((s as Session).runs)
        ? (s as Session).runs.map((r) => ({
            ...r,
            messages: (Array.isArray(r.messages) ? r.messages : []).map((m) =>
              normalizeMessage(m),
            ),
            isRunning: false,
            error: undefined,
          }))
        : [];
      next.set(s.id, {
        id: s.id,
        runs,
        title: (s as Session).title,
      });
    }
    this.state.sessions = next;
    this.state.currentSessionId = currentSessionId;
    this.streamingMessages.clear();
    this.streamingToolCalls.clear();
    this.notify();
  }
}
