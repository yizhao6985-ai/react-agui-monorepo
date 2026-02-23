/**
 * 按 AGUI 事件类型渲染单条事件内容
 */

import React from "react";
import type { MessageEventType } from "react-agui-core";

export function renderEvent(content: MessageEventType): React.ReactNode {
  switch (content.kind) {
    case "TEXT_MESSAGE_START":
    case "TEXT_MESSAGE_END":
    case "TOOL_CALL_END":
      return null;
    case "TEXT_MESSAGE_CONTENT":
      return content.delta;
    case "TOOL_CALL_START":
      return (
        <span className="inline-block rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700">
          [Tool: {content.toolCallName}]
        </span>
      );
    case "TOOL_CALL_ARGS":
      return <span className="text-zinc-600" title={content.delta}>…</span>;
    case "TOOL_CALL_RESULT":
      return (
        <span className="text-emerald-600" title={content.content}>
          ✓ result
        </span>
      );
    case "STATE_SNAPSHOT":
      return (
        <pre className="overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
          {JSON.stringify(content.snapshot, null, 2)}
        </pre>
      );
    case "STATE_DELTA":
      return (
        <span className="text-zinc-600 text-sm">
          patch ({content.delta?.length ?? 0} ops)
        </span>
      );
    case "RUN_STARTED":
      return <span className="text-zinc-600 text-sm">Run started</span>;
    case "RUN_FINISHED":
      return <span className="text-zinc-600 text-sm">Run finished</span>;
    case "RUN_ERROR":
      return (
        <span className="text-red-600 text-sm">
          Error: {content.message}
        </span>
      );
    case "STEP_STARTED":
    case "STEP_FINISHED":
      return <span className="text-zinc-600 text-sm">{content.stepName}</span>;
    case "ACTIVITY_SNAPSHOT":
      return (
        <span className="text-zinc-600 text-sm">
          {content.activityType}: {JSON.stringify(content.content)}
        </span>
      );
    case "ACTIVITY_DELTA":
      return (
        <span className="text-zinc-600 text-sm">
          {content.activityType}: patch ({content.patch?.length ?? 0} ops)
        </span>
      );
    case "MESSAGES_SNAPSHOT":
      return <span className="text-zinc-600 text-sm">Messages snapshot</span>;
    case "RAW":
    case "CUSTOM":
      return <span className="text-zinc-600 text-sm">{String(content.kind)}</span>;
    default:
      return null;
  }
}
