/**
 * Session 持久化存储接口
 * 可实现为 localStorage、IndexedDB、服务端等
 */

import type { Session } from '../types';

export interface PersistedSession {
  sessions: Session[];
  currentSessionId: string | null;
}

/**
 * 会话持久化存储接口
 * - load: 恢复会话列表与当前会话 ID
 * - save: 持久化会话列表与当前会话 ID（可由实现方做节流/批量）
 */
export interface AGUISessionStorage {
  load(): Promise<PersistedSession>;
  save(sessions: Session[], currentSessionId: string | null): Promise<void>;
}
