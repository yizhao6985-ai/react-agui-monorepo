/**
 * Agent 运行器：将请求消息转为 LangChain Messages，调用 agent.stream()，将流式结果映射为 AG-UI 协议事件
 */

import { v4 as uuidv4 } from "uuid";
import type { RunAgentInput, AgentEvent, CreatedAgent } from "./types.js";
import { toLangChainMessages } from "./messages.js";

/** 从 update content 中取最后一条消息的 content 或 tool_calls */
function getLastMessageContent(msg: unknown): string {
  if (!msg || typeof msg !== "object") return "";
  const m = msg as { content?: string; kwargs?: { content?: string } };
  return m.content ?? m.kwargs?.content ?? "";
}

function getLastMessageToolCalls(
  msg: unknown,
): Array<{ id?: string; name?: string; args?: Record<string, unknown> }> {
  if (!msg || typeof msg !== "object") return [];
  const m = msg as {
    tool_calls?: unknown[];
    kwargs?: { tool_calls?: unknown[] };
  };
  const raw = m.tool_calls ?? m.kwargs?.tool_calls ?? [];
  return raw as Array<{
    id?: string;
    name?: string;
    args?: Record<string, unknown>;
  }>;
}

export async function* runAgent(
  input: RunAgentInput,
  agent: CreatedAgent,
): AsyncGenerator<AgentEvent> {
  const { threadId, runId } = input;

  yield { type: "RUN_STARTED", threadId, runId };

  const messageId = uuidv4();
  yield { type: "TEXT_MESSAGE_START", messageId, role: "assistant" };

  try {
    const messages = toLangChainMessages(input.messages);
    const streamOptions = { streamMode: "updates" } as Parameters<
      CreatedAgent["stream"]
    >[1];
    const stream = await agent.stream({ messages }, streamOptions);

    for await (const chunk of stream) {
      const entries = Object.entries(
        chunk as unknown as Record<string, unknown>,
      );
      if (entries.length === 0) continue;
      const [step, content] = entries[0];
      const messages = (content as { messages?: unknown[] })?.messages ?? [];
      const last = messages[messages.length - 1];
      if (!last) continue;

      // LangChain ReAct Agent 的图节点名为 "model_request"（见 langchain/dist/agents/nodes/utils.js），不是 "model"
      if (step === "model" || step === "model_request") {
        const text = getLastMessageContent(last);
        if (text) {
          yield { type: "TEXT_MESSAGE_CONTENT", messageId, delta: text };
        }
        const toolCalls = getLastMessageToolCalls(last);
        for (const tc of toolCalls) {
          const toolCallId = tc.id ?? `tc_${uuidv4()}`;
          const toolName = typeof tc.name === "string" ? tc.name : "unknown";
          const argsStr =
            typeof tc.args === "object" && tc.args !== null
              ? JSON.stringify(tc.args)
              : "{}";
          yield {
            type: "TOOL_CALL_START",
            toolCallId,
            toolCallName: toolName,
            parentMessageId: messageId,
          };
          yield { type: "TOOL_CALL_ARGS", toolCallId, delta: argsStr };
          yield { type: "TOOL_CALL_END", toolCallId };
        }
      }

      if (step === "tools") {
        for (const msg of messages) {
          const contentStr = getLastMessageContent(msg);
          const toolMsg = msg as { tool_call_id?: string };
          const toolCallId = toolMsg.tool_call_id ?? `tc_${uuidv4()}`;
          const toolMessageId = `msg_tool_${uuidv4()}`;
          yield {
            type: "TOOL_CALL_RESULT",
            messageId: toolMessageId,
            toolCallId,
            content: contentStr,
            role: "tool",
          };
        }
      }
    }

    yield { type: "TEXT_MESSAGE_END", messageId };
    yield { type: "RUN_FINISHED", threadId, runId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "RUN_ERROR", message };
  }
}
