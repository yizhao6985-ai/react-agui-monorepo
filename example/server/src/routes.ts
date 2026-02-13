/**
 * HTTP routes and SSE utilities.
 * Handles request/response, delegates agent logic to agent module.
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { runAgent, type RunAgentInput } from "./agent.js";

function sendSSE(res: Response, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function createAgentRouter(): Router {
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
      for await (const event of runAgent({ ...input, threadId, runId })) {
        sendSSE(res, event);
      }
    } finally {
      res.end();
    }
  });

  return router;
}
