/**
 * Bubble.List：消息列表展示，含角色标签、loading 状态
 * 支持 ref 调用 scrollTo、scrollTop、scrollDown、getScrollPosition
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { AGUIMessage } from "react-agui-core";
import { cn } from "../utils/cn";
import { Bubble } from "./Bubble";
import { Loading } from "../Loading";

export type BubbleListRoleLabelFn = (role?: string) => string;

export interface BubbleListProps {
  messages: AGUIMessage[];
  loading?: boolean;
  loadingText?: string;
  getRoleLabel?: BubbleListRoleLabelFn;
  /** 编辑消息回调，传入则对 user 消息显示编辑按钮 */
  onEditMessage?: (messageId: string, content: string) => void;
  itemClassName?: string;
  listClassName?: string;
  className?: string;
}

export interface BubbleListRef {
  scrollTo: (value: number) => void;
  scrollTop: () => void;
  scrollDown: () => void;
  getScrollPosition: () => {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  };
}

const defaultGetRoleLabel: BubbleListRoleLabelFn = (role) => {
  if (role === "user") return "你";
  if (role === "assistant") return "助手";
  return role ?? "未知";
};

export const BubbleList = forwardRef<BubbleListRef, BubbleListProps>(
  function BubbleList(
    {
      messages,
      loading = false,
      loadingText = "正在回复…",
      getRoleLabel = defaultGetRoleLabel,
      onEditMessage,
      itemClassName,
      listClassName,
      className,
    },
    ref,
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      bottomSentinelRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages.length, loading]);

    useImperativeHandle(ref, () => ({
      scrollTo: (value: number) => {
        if (scrollRef.current) scrollRef.current.scrollTop = value;
      },
      scrollTop: () => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      },
      scrollDown: () => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight - el.clientHeight;
      },
      getScrollPosition: () => {
        const el = scrollRef.current;
        if (!el) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
        return {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        };
      },
    }));

    return (
      <div
        ref={scrollRef}
        className={cn(
          "flex flex-1 flex-col min-h-0 overflow-y-auto",
          className,
        )}
        role="log"
        aria-label="消息列表"
      >
        <div className={cn("flex flex-col", listClassName)}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("mb-5", itemClassName)}>
              <div className="mb-1 text-xs text-zinc-600">
                {getRoleLabel(msg.role)}
              </div>
              <Bubble message={msg} onEdit={onEditMessage} />
            </div>
          ))}
          <Loading loading={loading} text={loadingText} />
          <div ref={bottomSentinelRef} className="h-0 shrink-0" aria-hidden />
        </div>
      </div>
    );
  },
);
