/**
 * 基于 localStorage 的 Thread 持久化实现
 * 注意：localStorage 约 5MB 限制，线程过多或消息过长可能触发 QUOTA_EXCEEDED，可改用 IndexedDB
 */

import type { Thread } from '../types';
import type { AGUIThreadStorage, PersistedThread } from './types';

const DEFAULT_KEY = 'agui_threads';

export interface LocalThreadStorageOptions {
  /** localStorage 的 key，默认 'agui_threads' */
  key?: string;
}

/**
 * 创建基于 localStorage 的线程存储
 */
export function createLocalThreadStorage(
  options: LocalThreadStorageOptions = {}
): AGUIThreadStorage {
  const key = options.key ?? DEFAULT_KEY;

  return {
    async load(): Promise<PersistedThread> {
      if (typeof localStorage === 'undefined') {
        return { threads: [], currentThreadId: null };
      }
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return { threads: [], currentThreadId: null };
        const data = JSON.parse(raw) as PersistedThread;
        const threads = Array.isArray(data.threads) ? data.threads : [];
        const currentThreadId =
          typeof data.currentThreadId === 'string' || data.currentThreadId === null
            ? data.currentThreadId
            : null;
        return { threads, currentThreadId };
      } catch {
        return { threads: [], currentThreadId: null };
      }
    },

    async save(threads: Thread[], currentThreadId: string | null): Promise<void> {
      if (typeof localStorage === 'undefined') return;
      try {
        const data: PersistedThread = {
          threads,
          currentThreadId,
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          console.warn('[agui] localStorage quota exceeded, thread not persisted');
        }
        throw e;
      }
    },
  };
}
