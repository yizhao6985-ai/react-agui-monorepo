/**
 * AGUI 工具函数统一导出
 */
export { generateMessageId, generateRunId, generateThreadId } from './ids';
/**
 * 从 Thread 取值的工具函数（派生 messages / currentRun / previousRunState）
 */
export { getCurrentRun, getPreviousRunState, getThreadMessages } from './thread';
/**
 * Message 的规范化与派生（segment 聚合文本、转 RunAgentInput messages）
 */
export { normalizeMessage, getMessageText, toRunAgentMessages } from './message';
/**
 * AG-UI 事件转换：将协议事件转为内部 MessageEventType
 */
export { eventToContent } from './event';
/**
 * AGUI 调试输出：run 开始/事件/失败/完成，仅在 enabled 时打印
 */
export { AGUIDebug } from './debug';
export type { AGUIDebugRunCompleteData, AGUIDebugRunFailedData, AGUIDebugRunStartData } from './debug';
