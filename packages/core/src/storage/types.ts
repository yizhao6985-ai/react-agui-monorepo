/**
 * Thread 持久化存储接口
 * 可实现为 localStorage、IndexedDB、服务端等
 */

import type { Thread } from '../types';

export interface PersistedThread {
  threads: Thread[];
  currentThreadId: string | null;
}

/**
 * 线程持久化存储接口
 * - load: 恢复线程列表与当前线程 ID
 * - save: 持久化线程列表与当前线程 ID（可由实现方做节流/批量）
 */
export interface AGUIThreadStorage {
  load(): Promise<PersistedThread>;
  save(threads: Thread[], currentThreadId: string | null): Promise<void>;
}
