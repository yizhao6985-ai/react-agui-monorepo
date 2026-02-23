/**
 * 对话管理：会话列表、新建/切换/删除，通过 props 接收数据与回调
 * 不依赖 AGUIProvider
 */

import React, { useState } from "react";
import type { Session } from "react-agui-core";
import { cn } from "./utils/cn";

export interface ConversationsProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNew: () => void;
  onSwitch: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  /** 编辑会话标题，传入则显示重命名按钮 */
  onEditTitle?: (sessionId: string, title: string) => void;
  getItemTitle?: (session: Session) => string;
  className?: string;
}

const defaultGetTitle = (s: Session): string =>
  s.title?.trim() || s.id.slice(0, 12);

export function Conversations({
  sessions,
  currentSessionId,
  onNew,
  onSwitch,
  onDelete,
  onEditTitle,
  getItemTitle = defaultGetTitle,
  className,
}: ConversationsProps): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    if (!onEditTitle) return;
    setEditingId(session.id);
    setEditValue(getItemTitle(session));
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
      aria-label="会话列表"
    >
      <button
        type="button"
        className="mx-2 my-2 px-4 py-2.5 rounded-lg border border-dashed border-zinc-300 text-zinc-600 text-sm hover:border-indigo-500 hover:text-indigo-600"
        onClick={onNew}
        aria-label="新建会话"
      >
        新建会话
      </button>
      <div className="flex flex-col">
        {sessions.length === 0 ? (
          <div className="p-4 text-zinc-600 text-sm">暂无会话</div>
        ) : (
          sessions.map((session) => {
            const isActive = currentSessionId === session.id;
            const isEditing = editingId === session.id;
            return (
              <div
                key={session.id}
                className={cn(
                  "flex items-center justify-between gap-1 px-4 py-2.5 mx-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100",
                  isActive ? "bg-zinc-100" : undefined,
                )}
                role="option"
                aria-selected={isActive}
                onClick={() => !isEditing && onSwitch(session.id)}
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
                    {getItemTitle(session)}
                  </span>
                )}
                <div className="flex shrink-0 gap-0.5">
                  {onEditTitle && !isEditing && (
                    <button
                      type="button"
                      className="opacity-60 px-2 py-1 rounded text-zinc-600 hover:opacity-100 hover:bg-zinc-200 text-xs"
                      onClick={(e) => handleStartEdit(e, session)}
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
                      onDelete(session.id);
                    }}
                    aria-label="删除会话"
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
