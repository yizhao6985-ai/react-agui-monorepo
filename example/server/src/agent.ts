/**
 * Agent logic: LangChain chat model and streaming.
 * 支持 tool calling，会发出 TOOL_CALL_* 事件
 */

import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { getConfig } from "./config.js";
import { tools } from "./tools.js";

export interface RunAgentInput {
  threadId: string;
  runId: string;
  messages?: Array<{ role: string; content?: string; id?: string }>;
  state?: Record<string, unknown>;
  tools?: unknown[];
}

export interface AgentEvent {
  type: string;
  [key: string]: unknown;
}

function toLangChainMessages(
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

async function executeTool(
  name: string,
  args: string,
): Promise<string> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${name}` });
  try {
    const parsed = JSON.parse(args) as Record<string, unknown>;
    const result = await (tool as { invoke: (input: Record<string, unknown>) => Promise<unknown> }).invoke(parsed);
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: msg });
  }
}

export async function* runAgent(
  input: RunAgentInput,
): AsyncGenerator<AgentEvent> {
  const { threadId, runId } = input;

  yield { type: "RUN_STARTED", threadId, runId };

  const messageId = uuidv4();
  yield { type: "TEXT_MESSAGE_START", messageId, role: "assistant" };

  try {
    const { model: modelConfig } = getConfig();
    const model = new ChatOpenAI({
      modelName: modelConfig.modelName,
      temperature: modelConfig.temperature,
      ...(modelConfig.baseURL && {
        configuration: { baseURL: modelConfig.baseURL },
      }),
    });
    const modelWithTools = model.bindTools(tools);
    let messages: BaseMessage[] = toLangChainMessages(input.messages ?? []);
    let hasMore = true;

    while (hasMore) {
      const response = await modelWithTools.invoke(messages);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolMessages: ToolMessage[] = [];

        for (const tc of response.tool_calls) {
          const toolCallId = tc.id ?? `tc_${uuidv4()}`;
          const toolName = typeof tc.name === "string" ? tc.name : "unknown";
          const argsStr =
            typeof tc.args === "string"
              ? tc.args
              : JSON.stringify(tc.args ?? {});

          yield {
            type: "TOOL_CALL_START",
            toolCallId,
            toolCallName: toolName,
            parentMessageId: messageId,
          };
          yield { type: "TOOL_CALL_ARGS", toolCallId, delta: argsStr };
          yield { type: "TOOL_CALL_END", toolCallId };

          const result = await executeTool(toolName, argsStr);

          const toolMessageId = `msg_tool_${uuidv4()}`;
          yield {
            type: "TOOL_CALL_RESULT",
            messageId: toolMessageId,
            toolCallId,
            content: result,
            role: "tool",
          };

          toolMessages.push(
            new ToolMessage({
              content: result,
              tool_call_id: toolCallId,
            }),
          );
        }

        messages = [
          ...messages,
          new AIMessage({
            content: response.content ?? "",
            tool_calls: response.tool_calls,
          }),
          ...toolMessages,
        ];
      } else {
        const content =
          typeof response.content === "string"
            ? response.content
            : String(response.content ?? "");
        if (content) {
          yield { type: "TEXT_MESSAGE_CONTENT", messageId, delta: content };
        }
        hasMore = false;
      }
    }

    yield { type: "TEXT_MESSAGE_END", messageId };
    yield { type: "RUN_FINISHED", threadId, runId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: "RUN_ERROR", message };
  }
}
