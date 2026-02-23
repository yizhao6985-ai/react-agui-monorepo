/**
 * HTTP 路由与 SSE 工具
 * 处理请求/响应，将 Agent 逻辑委托给 agent 模块
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  runAgent,
  type RunAgentInput,
  type CreatedAgent,
} from "../agent/index.js";

function sendSSE(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function createAgentRouter(agent: CreatedAgent): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const input = req.body as RunAgentInput;
    const threadId = input.threadId ?? "";
    const runId = input.runId ?? uuidv4();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      for await (const event of runAgent(
        { ...input, threadId, runId },
        agent,
      )) {
        sendSSE(res, event);
      }
    } finally {
      res.end();
    }
  });

  return router;
}
