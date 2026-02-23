/**
 * react-agui-ui
 * AGUI React 组件库，基于 Tailwind CSS，依赖 react-agui-core
 */

export { cn } from "./utils/cn";
/**
 * 输入组件：输入框 + 发送，通过 props 接收 onSend 与 disabled
 * 无状态、受控由调用方决定，不依赖 AGUIProvider
 */
export { Sender } from "./Sender";
export type { SenderProps } from "./Sender";
/**
 * AGUI 级别 loading 状态展示
 */
export { Loading } from "./Loading";
export type { LoadingProps } from "./Loading";
/**
 * Bubble 模块：单条消息 + 消息列表
 */
export { BubbleWithList as Bubble, Segment } from "./bubble";
export type {
  BubbleProps,
  BubbleListProps,
  BubbleListRef,
  BubbleListRoleLabelFn,
  SegmentProps,
} from "./bubble";
/**
 * 会话列表组件：包含新建会话、切换会话、删除会话
 */
export { Conversations } from "./Conversations";
export type { ConversationsProps } from "./Conversations";
