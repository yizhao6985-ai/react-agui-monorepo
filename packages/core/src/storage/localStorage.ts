/**
 * 基于 localStorage 的 Session 持久化实现
 * 注意：localStorage 约 5MB 限制，会话过多或消息过长可能触发 QUOTA_EXCEEDED，可改用 IndexedDB
 */

import type { Session } from '../types';
import type { AGUISessionStorage, PersistedSession } from './types';

const DEFAULT_KEY = 'agui_sessions';

export interface LocalSessionStorageOptions {
  /** localStorage 的 key，默认 'agui_sessions' */
  key?: string;
}

/**
 * 创建基于 localStorage 的会话存储
 */
export function createLocalSessionStorage(
  options: LocalSessionStorageOptions = {}
): AGUISessionStorage {
  const key = options.key ?? DEFAULT_KEY;

  return {
    async load(): Promise<PersistedSession> {
      if (typeof localStorage === 'undefined') {
        return { sessions: [], currentSessionId: null };
      }
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return { sessions: [], currentSessionId: null };
        const data = JSON.parse(raw) as PersistedSession;
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        const currentSessionId =
          typeof data.currentSessionId === 'string' || data.currentSessionId === null
            ? data.currentSessionId
            : null;
        return { sessions, currentSessionId };
      } catch {
        return { sessions: [], currentSessionId: null };
      }
    },

    async save(sessions: Session[], currentSessionId: string | null): Promise<void> {
      if (typeof localStorage === 'undefined') return;
      try {
        const data: PersistedSession = {
          sessions,
          currentSessionId,
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          console.warn('[agui] localStorage quota exceeded, session not persisted');
        }
        throw e;
      }
    },
  };
}
