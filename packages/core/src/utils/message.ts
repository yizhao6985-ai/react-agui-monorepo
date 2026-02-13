/**
 * Message 的规范化与派生（segment 聚合文本、转 RunAgentInput messages）
 */

import type { AGUIMessage, MessageEventType, TextSegment } from '../types';

/** 将可能来自快照/持久化的 message 规范为完整 AGUIMessage 类型（保证 renderType、segment、events） */
export function normalizeMessage(raw: Partial<AGUIMessage> & { id: string }): AGUIMessage {
  const segment = Array.isArray(raw.segment) ? raw.segment : [];
  const events = Array.isArray(raw.events) ? raw.events : [];
  const renderType = raw.renderType === 'tool' ? 'tool' : 'text';
  return {
    id: raw.id,
    role: raw.role,
    renderType,
    segment,
    events,
    timestamp: raw.timestamp,
  };
}

/** 从 Message 的 segment 派生聚合文本（用于展示或 toRunAgentMessages） */
export function getMessageText(message: AGUIMessage): string {
  const fromSegment = message.segment
    ?.filter((s): s is TextSegment => s.type === 'text')
    .map((s) => s.content)
    .join('');
  if (fromSegment !== undefined && fromSegment !== '') return fromSegment;
  const fromEvents = message.events
    ?.filter((e): e is MessageEventType & { kind: 'TEXT_MESSAGE_CONTENT' } => e.kind === 'TEXT_MESSAGE_CONTENT')
    .map((e) => e.delta)
    .join('');
  return fromEvents ?? '';
}

/** 将内部 AGUIMessage[] 转为 AG-UI RunAgentInput 所需的 messages 格式 */
export function toRunAgentMessages(messages: AGUIMessage[]): unknown[] {
  return messages.map((m) => {
    const base = { id: m.id, role: m.role ?? 'user' };
    const textContent = getMessageText(m);
    if (m.role === 'user') {
      return { ...base, role: 'user' as const, content: textContent };
    }
    if (m.role === 'assistant') {
      return { ...base, role: 'assistant' as const, content: textContent };
    }
    if (m.role === 'tool') {
      return { ...base, role: 'tool' as const, content: (m.events.find((c) => c.kind === 'TOOL_CALL_RESULT') as { content?: string } | undefined)?.content ?? '' };
    }
    return { ...base, content: textContent };
  });
}
