/**
 * Bubble 模块：单条消息 + 消息列表
 */

import { Bubble } from "./Bubble";
import { BubbleList } from "./BubbleList";
import { Segment } from "./Segment";

export { Bubble, BubbleList, Segment };
export type { BubbleProps } from "./Bubble";
export type { BubbleListProps, BubbleListRef, BubbleListRoleLabelFn } from "./BubbleList";
export type { SegmentProps } from "./Segment";

export const BubbleWithList = Object.assign(Bubble, { List: BubbleList });
