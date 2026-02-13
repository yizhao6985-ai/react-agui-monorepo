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
    [doSend]
  );

  return (
    <div className={cn("flex flex-col", className)} role="form">
      <textarea
        rows={3}
        className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-100 text-sm resize-y focus:outline-none focus:border-indigo-500 disabled:opacity-60"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="消息输入"
      />
      <button
        type="button"
        className="mt-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={doSend}
        disabled={disabled || !canSend}
        aria-label="发送"
      >
        发送
      </button>
    </div>
  );
}
