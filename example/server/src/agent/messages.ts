/**
 * 消息格式转换：协议消息 -> LangChain BaseMessage[]
 */

import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";
import type { RunAgentInput } from "./types.js";

export function toLangChainMessages(
  messages: RunAgentInput["messages"] = [],
): BaseMessage[] {
  return messages.map((m) => {
    if (m.role === "user") return new HumanMessage(m.content ?? "");
    if (m.role === "assistant") return new AIMessage(m.content ?? "");
    if (m.role === "tool") {
      const toolMsg = m as { content?: string; tool_call_id?: string };
      return new ToolMessage({
        content: toolMsg.content ?? "",
        tool_call_id: toolMsg.tool_call_id ?? (m as { id?: string }).id ?? "",
      });
    }
    return new HumanMessage(String((m as { content?: string }).content ?? ""));
  });
}
