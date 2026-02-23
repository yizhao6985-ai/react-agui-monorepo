/**
 * Segment：单条消息片段的 UI 组件
 * 支持 text、tool 等类型；tool 的 args/result 默认折叠，点击展开
 */

import React, { useState } from "react";
import type { MessageSegment } from "react-agui-core";

export interface SegmentProps {
  segment: MessageSegment;
}

function ToolSegmentView({
  toolCallName,
  args,
  result,
}: {
  toolCallName: string;
  args?: string;
  result?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    (args != null && args !== "") || (result != null && result !== "");

  const isComplete = result != null && result !== "";
  const isLoading = !isComplete;

  const header = (
    <>
      <span className="inline-flex items-center gap-1.5">
        [Tool: {toolCallName}]
        {isLoading && (
          <span
            className="inline-block size-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
            aria-label="调用中"
          />
        )}
      </span>
      {isComplete && (
        <span className="text-emerald-600" title={result}>
          ✓
        </span>
      )}
      {hasDetails && (
        <span className="text-zinc-500" aria-hidden>
          {expanded ? "▼" : "▶"}
        </span>
      )}
    </>
  );

  return (
    <span className="inline-flex flex-col gap-1">
      {hasDetails ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1.5 rounded bg-zinc-200 px-2 py-0.5 text-left text-xs text-zinc-700 hover:bg-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          {header}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
          {header}
        </span>
      )}
      {expanded && hasDetails && (
        <pre className="max-h-48 overflow-auto rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-600 whitespace-pre-wrap break-words">
          {args != null && args !== "" && (
            <>
              <span className="font-medium text-zinc-500">args</span>
              {"\n"}
              {args}
              {result != null && result !== "" && "\n\n"}
            </>
          )}
          {result != null && result !== "" && (
            <>
              <span className="font-medium text-zinc-500">result</span>
              {"\n"}
              {result}
            </>
          )}
        </pre>
      )}
    </span>
  );
}

export function Segment({ segment }: SegmentProps): React.ReactNode {
  switch (segment.type) {
    case "text":
      return segment.content;
    case "tool":
      return (
        <ToolSegmentView
          toolCallName={segment.toolCallName}
          args={segment.args}
          result={segment.result}
        />
      );
    default:
      return null;
  }
}
