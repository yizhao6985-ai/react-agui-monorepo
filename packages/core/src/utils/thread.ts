/**
 * 从 Thread 取值的工具函数（派生 messages / currentRun / previousRunState）
 */

import type { AGUIMessage, Run, Thread } from '../types';

/** 从 Thread 的 runs 派生消息列表（按 run 顺序扁平化） */
export function getThreadMessages(thread: Thread): AGUIMessage[] {
  return thread.runs.flatMap((r) => r.messages);
}

/** 获取当前正在运行的 run（thread.runs 中最后一个且 isRunning 的），供派生 isLoading / error 等 */
export function getCurrentRun(thread: Thread | null | undefined): Run | undefined {
  if (!thread) return undefined;
  const last = thread.runs[thread.runs.length - 1];
  return last?.isRunning ? last : undefined;
}

/** 获取上一轮 run 的 state，用于 RunAgentInput.state（续跑时传给后端） */
export function getPreviousRunState(thread: Thread): unknown {
  const runs = thread.runs;
  if (runs.length < 2) return undefined;
  return runs[runs.length - 2].state;
}
