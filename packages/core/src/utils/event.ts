/**
 * AG-UI 事件转换：将协议事件转为内部 MessageEventType
 */

import { EventType } from '@ag-ui/core';
import type { AGUIMessage, MessageEventType } from '../types';

/** 将 AG-UI 事件对象转为内部 MessageEventType kind，无法识别时返回 null */
export function eventToContent(event: Record<string, unknown>): MessageEventType | null {
  const type = event.type as string;
  switch (type) {
    case EventType.TEXT_MESSAGE_START:
      return {
        kind: 'TEXT_MESSAGE_START',
        messageId: String(event.messageId ?? ''),
        role: (event.role as AGUIMessage['role']) ?? 'assistant',
      };
    case EventType.TEXT_MESSAGE_CONTENT:
      return {
        kind: 'TEXT_MESSAGE_CONTENT',
        messageId: String(event.messageId ?? ''),
        delta: String(event.delta ?? ''),
      };
    case EventType.TEXT_MESSAGE_END:
      return { kind: 'TEXT_MESSAGE_END', messageId: String(event.messageId ?? '') };
    case EventType.TOOL_CALL_START:
      return {
        kind: 'TOOL_CALL_START',
        toolCallId: String(event.toolCallId ?? ''),
        toolCallName: String(event.toolCallName ?? ''),
        parentMessageId: event.parentMessageId != null ? String(event.parentMessageId) : undefined,
      };
    case EventType.TOOL_CALL_ARGS:
      return {
        kind: 'TOOL_CALL_ARGS',
        toolCallId: String(event.toolCallId ?? ''),
        delta: String(event.delta ?? ''),
      };
    case EventType.TOOL_CALL_END:
      return { kind: 'TOOL_CALL_END', toolCallId: String(event.toolCallId ?? '') };
    case EventType.TOOL_CALL_RESULT:
      return {
        kind: 'TOOL_CALL_RESULT',
        messageId: String(event.messageId ?? ''),
        toolCallId: String(event.toolCallId ?? ''),
        content: String(event.content ?? ''),
        role: (event.role as 'tool') ?? 'tool',
      };
    case EventType.STATE_SNAPSHOT:
      return { kind: 'STATE_SNAPSHOT', snapshot: event.snapshot };
    case EventType.STATE_DELTA:
      return { kind: 'STATE_DELTA', delta: Array.isArray(event.delta) ? event.delta : [] };
    case EventType.MESSAGES_SNAPSHOT:
      return { kind: 'MESSAGES_SNAPSHOT', messages: (event.messages as AGUIMessage[]) ?? [] };
    case EventType.ACTIVITY_SNAPSHOT:
      return {
        kind: 'ACTIVITY_SNAPSHOT',
        messageId: String(event.messageId ?? ''),
        activityType: String(event.activityType ?? ''),
        content: (event.content as Record<string, unknown>) ?? {},
        replace: event.replace as boolean | undefined,
      };
    case EventType.ACTIVITY_DELTA:
      return {
        kind: 'ACTIVITY_DELTA',
        messageId: String(event.messageId ?? ''),
        activityType: String(event.activityType ?? ''),
        patch: Array.isArray(event.patch) ? event.patch : [],
      };
    case EventType.RUN_STARTED:
      return {
        kind: 'RUN_STARTED',
        threadId: String(event.threadId ?? ''),
        runId: String(event.runId ?? ''),
        parentRunId: event.parentRunId != null ? String(event.parentRunId) : undefined,
        input: event.input,
      };
    case EventType.RUN_FINISHED:
      return {
        kind: 'RUN_FINISHED',
        threadId: String(event.threadId ?? ''),
        runId: String(event.runId ?? ''),
        result: event.result,
      };
    case EventType.RUN_ERROR:
      return {
        kind: 'RUN_ERROR',
        message: String(event.message ?? ''),
        code: event.code != null ? String(event.code) : undefined,
      };
    case EventType.STEP_STARTED:
      return { kind: 'STEP_STARTED', stepName: String(event.stepName ?? '') };
    case EventType.STEP_FINISHED:
      return { kind: 'STEP_FINISHED', stepName: String(event.stepName ?? '') };
    case EventType.RAW:
      return {
        kind: 'RAW',
        event: event.event,
        source: event.source != null ? String(event.source) : undefined,
      };
    case EventType.CUSTOM:
      return { kind: 'CUSTOM', name: String(event.name ?? ''), value: event.value };
    default:
      return null;
  }
}
