/**
 * 对话管理：线程列表、新建/切换/删除，通过 props 接收数据与回调
 * 不依赖 AGUIProvider
 */

import React, { useState } from "react";
import type { Thread } from "react-agui-core";
import { cn } from "./utils/cn";

export interface ConversationsProps {
  threads: Thread[];
  currentThreadId: string | null;
  onNew: () => void;
  onSwitch: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  /** 编辑线程标题，传入则显示重命名按钮 */
  onEditTitle?: (threadId: string, title: string) => void;
  getItemTitle?: (thread: Thread) => string;
  className?: string;
}

const defaultGetTitle = (t: Thread): string =>
  t.title?.trim() || t.id.slice(0, 12);

export function Conversations({
  threads,
  currentThreadId,
  onNew,
  onSwitch,
  onDelete,
  onEditTitle,
  getItemTitle = defaultGetTitle,
  className,
}: ConversationsProps): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (e: React.MouseEvent, thread: Thread) => {
    e.stopPropagation();
    if (!onEditTitle) return;
    setEditingId(thread.id);
    setEditValue(getItemTitle(thread));
  };

  const handleSaveEdit = () => {
    if (!editingId || !onEditTitle || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    onEditTitle(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <div
      className={cn("flex flex-col", className)}
      role="listbox"
      aria-label="线程列表"
    >
      <button
        type="button"
        className="mx-2 my-2 px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 text-zinc-600 text-sm hover:border-indigo-500 hover:text-indigo-600"
        onClick={onNew}
        aria-label="新建线程"
      >
        新建线程
      </button>
      <div className="flex flex-col">
        {threads.length === 0 ? (
          <div className="p-4 text-zinc-600 text-sm">暂无线程</div>
        ) : (
          threads.map((thread) => {
            const isActive = currentThreadId === thread.id;
            const isEditing = editingId === thread.id;
            return (
              <div
                key={thread.id}
                className={cn(
                  "flex items-center justify-between gap-1 px-4 py-2.5 mx-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100",
                  isActive ? "bg-zinc-100" : undefined,
                )}
                role="option"
                aria-selected={isActive}
                onClick={() => !isEditing && onSwitch(thread.id)}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={handleSaveEdit}
                    autoFocus
                    className="flex-1 min-w-0 rounded px-2 py-0.5 text-zinc-900 bg-white border border-zinc-300 focus:outline-none focus:border-indigo-500 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate flex-1 min-w-0">
                    {getItemTitle(thread)}
                  </span>
                )}
                <div className="flex shrink-0 gap-0.5">
                  {onEditTitle && !isEditing && (
                    <button
                      type="button"
                      className="opacity-60 px-2 py-1 rounded text-zinc-600 hover:opacity-100 hover:bg-zinc-200 text-xs"
                      onClick={(e) => handleStartEdit(e, thread)}
                      aria-label="重命名"
                    >
                      重命名
                    </button>
                  )}
                  <button
                    type="button"
                    className="opacity-60 px-2 py-1 rounded text-zinc-600 hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(thread.id);
                    }}
                    aria-label="删除线程"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
