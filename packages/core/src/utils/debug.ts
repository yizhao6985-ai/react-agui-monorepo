/**
 * AGUI 调试输出：run 开始/事件/失败/完成，仅在 enabled 时打印
 */

const PREFIX = '[AGUI]';

export interface AGUIDebugRunStartData {
  threadId: string;
  runId: string;
  messagesCount: number;
  stateKeys: string[] | '(empty)';
  toolsCount: number;
  contextCount: number;
}

export interface AGUIDebugRunFailedData {
  sessionId: string;
  runId: string;
  errorMessage: string;
  errorName?: string;
  stack?: string;
}

export interface AGUIDebugRunCompleteData {
  sessionId: string;
  runId: string;
  durationMs: number;
}

export class AGUIDebug {
  constructor(private readonly enabled: boolean) {}

  /** 格式化单条事件的摘要 */
  static formatEventSummary(event: Record<string, unknown>): string {
    const type = String(event.type ?? '');
    const parts: string[] = [];
    if (event.messageId != null) parts.push(`messageId=${event.messageId}`);
    if (event.role != null) parts.push(`role=${event.role}`);
    if (event.delta != null)
      parts.push(
        `delta=${typeof event.delta === 'string' && event.delta.length > 60 ? event.delta.slice(0, 60) + '…' : event.delta}`
      );
    if (event.toolCallId != null) parts.push(`toolCallId=${event.toolCallId}`);
    if (event.toolCallName != null) parts.push(`toolCallName=${event.toolCallName}`);
    if (event.threadId != null) parts.push(`threadId=${event.threadId}`);
    if (event.runId != null) parts.push(`runId=${event.runId}`);
    if (event.stepName != null) parts.push(`stepName=${event.stepName}`);
    if (type === 'RUN_ERROR' && event.message != null) parts.push(`message=${event.message}`);
    return parts.length ? `${type} ${parts.join(' ')}` : type;
  }

  runStart(data: AGUIDebugRunStartData): void {
    if (!this.enabled) return;
    console.log(`${PREFIX} run start`, data);
  }

  event(payload: Record<string, unknown>): void {
    if (!this.enabled) return;
    console.log(`${PREFIX} event`, AGUIDebug.formatEventSummary(payload));
    console.log(`${PREFIX} event payload`, payload);
  }

  runFailed(data: AGUIDebugRunFailedData): void {
    if (!this.enabled) return;
    console.log(`${PREFIX} run failed`, data);
  }

  runComplete(data: AGUIDebugRunCompleteData): void {
    if (!this.enabled) return;
    console.log(`${PREFIX} run complete`, data);
  }
}
