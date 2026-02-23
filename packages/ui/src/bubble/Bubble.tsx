/**
 * Bubble：单条消息渲染，专注于 message 的展示
 * 使用 segment 做渲染，event 仅用于存储原始信息
 */

import React, { useState } from "react";
import { getMessageText } from "react-agui-core";
import type { AGUIMessage } from "react-agui-core";
import { cn } from "../utils/cn";
import { Segment } from "./Segment";

export interface BubbleProps {
  message: AGUIMessage;
  className?: string;
  /** 编辑消息回调，传入则对 user 消息显示编辑按钮 */
  onEdit?: (messageId: string, content: string) => void;
}

export function Bubble({
  message,
  className,
  onEdit,
}: BubbleProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const cls = cn("whitespace-pre-wrap break-words leading-relaxed", className);
  const segments = message.segment ?? [];
  const nodes = segments.map((seg, i) => (
    <Segment key={seg.type === "tool" ? seg.toolCallId : i} segment={seg} />
  ));
  const text = getMessageText(message);
  const isUser = message.role === "user";
  const canEdit = isUser && onEdit;

  const handleStartEdit = () => {
    setEditValue(text);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() !== text) {
      onEdit?.(message.id, editValue.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className={cls}
        data-message-id={message.id}
        data-role={message.role}
      >
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSaveEdit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={handleSaveEdit}
          autoFocus
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 resize-y"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500"
            onClick={handleSaveEdit}
          >
            保存
          </button>
          <button
            type="button"
            className="rounded px-3 py-1 text-xs text-zinc-600 hover:text-zinc-800"
            onClick={() => setEditing(false)}
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  if (text && nodes.length === 0) {
    return (
      <div
        className={cls}
        data-message-id={message.id}
        data-role={message.role}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{text}</div>
          {canEdit && (
            <button
              type="button"
              className="shrink-0 opacity-60 px-2 py-0.5 rounded text-xs text-zinc-600 hover:opacity-100 hover:bg-zinc-100"
              onClick={handleStartEdit}
              aria-label="编辑"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cls} data-message-id={message.id} data-role={message.role}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {nodes.length > 0 ? nodes : text || null}
        </div>
        {canEdit && (
          <button
            type="button"
            className="shrink-0 opacity-60 px-2 py-0.5 rounded text-xs text-zinc-600 hover:opacity-100 hover:bg-zinc-100"
            onClick={handleStartEdit}
            aria-label="编辑"
          >
            编辑
          </button>
        )}
      </div>
    </div>
  );
}
