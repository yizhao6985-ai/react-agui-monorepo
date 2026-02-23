/**
 * AGUI 级别的 loading 状态展示（如「正在回复…」）
 * 无状态，由调用方根据 loading 决定是否渲染
 */

import React from "react";
import { cn } from "./utils/cn";

export interface LoadingProps {
  /** 是否显示 */
  loading?: boolean;
  /** 文案，默认「正在回复…」 */
  text?: string;
  className?: string;
}

export function Loading({
  loading = false,
  text = "正在回复…",
  className,
}: LoadingProps): React.ReactElement | null {
  if (!loading) return null;
  return (
    <div
      className={cn("py-2 text-sm text-zinc-600", className)}
      role="status"
      aria-label="思考中"
    >
      {text}
    </div>
  );
}
