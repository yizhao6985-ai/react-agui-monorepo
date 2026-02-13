/**
 * 从 Session 取值的工具函数（派生 messages / currentRun / previousRunState）
 */

import type { AGUIMessage, Run, Session } from '../types';

/** 从 Session 的 runs 派生消息列表（按 run 顺序扁平化） */
export function getSessionMessages(session: Session): AGUIMessage[] {
  return session.runs.flatMap((r) => r.messages);
}

/** 获取当前正在运行的 run（session.runs 中最后一个且 isRunning 的），供派生 isLoading / error 等 */
export function getCurrentRun(session: Session | null | undefined): Run | undefined {
  if (!session) return undefined;
  const last = session.runs[session.runs.length - 1];
  return last?.isRunning ? last : undefined;
}

/** 获取上一轮 run 的 state，用于 RunAgentInput.state（续跑时传给后端） */
export function getPreviousRunState(session: Session): unknown {
  const runs = session.runs;
  if (runs.length < 2) return undefined;
  return runs[runs.length - 2].state;
}
