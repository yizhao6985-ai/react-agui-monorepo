/**
 * Segment：单条消息片段的 UI 组件
 * 支持 text、tool 等类型
 */

import React from "react";
import type { MessageSegment } from "react-agui-core";

export interface SegmentProps {
  segment: MessageSegment;
}

export function Segment({ segment }: SegmentProps): React.ReactNode {
  switch (segment.type) {
    case "text":
      return segment.content;
    case "tool":
      return (
        <span className="inline-block rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
          [Tool: {segment.toolCallName}]
          {segment.result != null && (
            <span className="ml-1 text-emerald-400" title={segment.result}>
              ✓
            </span>
          )}
        </span>
      );
    default:
      return null;
  }
}
