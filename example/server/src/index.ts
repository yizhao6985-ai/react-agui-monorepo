/**
 * Example AG-UI compatible agent server.
 * Uses LangChain to run a simple chat agent and streams responses as AG-UI SSE events.
 * Copy .env.example to .env and set OPENAI_API_KEY.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServerAgent } from "./agent/index.js";
import { createAgentRouter } from "./routes/index.js";
import { getConfig } from "./agent/config/index.js";

const { port, openaiApiKey } = getConfig();

if (!openaiApiKey && !process.env.CI) {
  console.error(
    "请先复制 .env.example 为 .env 并配置 OPENAI_API_KEY：\n" +
      "  cp .env.example .env\n" +
      "然后编辑 .env 填入你的 API Key",
  );
  process.exit(1);
}

(async () => {
  const agent = await createServerAgent();
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/", createAgentRouter(agent));

  app.listen(port, () => {
    console.log(
      `Example AG-UI agent server listening on http://localhost:${port}`,
    );
  });
})();
