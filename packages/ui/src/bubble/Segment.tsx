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
    <div className="flex w-full items-center gap-2">
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-indigo-50 text-[10px] font-semibold text-indigo-500">
          T
        </span>
        <span className="truncate">
          工具 ·{" "}
          <span className="font-medium text-zinc-800">{toolCallName}</span>
        </span>
        {isLoading && (
          <span
            className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-zinc-300 border-t-transparent"
            aria-label="调用中"
          />
        )}
        {isComplete && (
          <span className="ml-0.5 text-emerald-500" title={result}>
            ✓
          </span>
        )}
      </div>
      {hasDetails && (
        <span className="ml-auto text-[10px] text-zinc-400" aria-hidden>
          {expanded ? "收起" : "展开"}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex my-4 w-full flex-col gap-1 text-[13px] leading-relaxed">
      {hasDetails ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1.5 text-left text-[11px] text-zinc-700 shadow-sm hover:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {header}
        </button>
      ) : (
        <span className="inline-flex w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/80 px-2.5 py-1.5 text-[11px] text-zinc-700 shadow-sm">
          {header}
        </span>
      )}
      {expanded && hasDetails && (
        <div className="max-h-80 w-full space-y-3 overflow-auto rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-700 shadow-sm">
          {args != null && args !== "" && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                args
              </div>
              <pre className="whitespace-pre-wrap break-words rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
                {args}
              </pre>
            </div>
          )}
          {result != null && result !== "" && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                result
              </div>
              <pre className="whitespace-pre-wrap break-words rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
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
