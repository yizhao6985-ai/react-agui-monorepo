/**
 * 输入组件：输入框 + 发送，通过 props 接收 onSend 与 disabled
 * 无状态、受控由调用方决定，不依赖 AGUIProvider
 */

import React, { useCallback, useState } from "react";
import { cn } from "./utils/cn";

export interface SenderProps {
  onSend: (value: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function Sender({
  onSend,
  disabled = false,
  placeholder = "输入消息…",
  className,
}: SenderProps): React.ReactElement {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0;

  const doSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const result = onSend(trimmed);
      if (result instanceof Promise) {
        await result;
      }
      setValue("");
    } catch (err) {
      console.error("[Sender] onSend failed:", err);
    }
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    },
    [doSend],
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-300 bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500",
        className,
      )}
      role="form"
    >
      <textarea
        rows={3}
        className="min-h-[80px] w-full resize-y rounded-t-xl border-0 bg-transparent px-4 py-3 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:opacity-60"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="消息输入"
      />
      <div className="flex shrink-0 justify-end border-t border-zinc-100 px-3 py-2">
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={doSend}
          disabled={disabled || !canSend}
          aria-label="发送"
        >
          发送
        </button>
      </div>
    </div>
  );
}
