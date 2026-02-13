# Example Server（LangChain Agent）

基于 **LangChain** 与 **Express** 的 AG-UI 兼容 Agent 服务：接收前端 POST，流式返回 SSE 事件。供 [example-web](../web/README.md) 或任意 AG-UI 客户端调用。

## 快速开始

1. 复制环境变量：`cp .env.example .env`
2. 编辑 `.env`，填入你的 `OPENAI_API_KEY`（从 [OpenAI API Keys](https://platform.openai.com/api-keys) 获取）
3. （可选）使用 OpenRouter 等 OpenAI 兼容端点时，设置 `OPENAI_BASE_URL`（如 `https://openrouter.ai/api/v1`）
4. （可选）设置 `OPENAI_MODEL` 指定模型（默认 `gpt-4o-mini`）
5. 在仓库根目录运行：`pnpm dev:server`（或本目录 `pnpm start`）

## 命令

```bash
pnpm dev    # tsx watch 开发
pnpm start  # tsx 直接运行 TypeScript
```

## 接口

- **POST /**  
  - 请求体：AG-UI `RunAgentInput`（`threadId`、`runId`、`messages` 等）  
  - 响应：`Content-Type: text/event-stream`，流式发送 `RUN_STARTED`、`TEXT_MESSAGE_*`、`TOOL_CALL_*`、`RUN_FINISHED` 等事件  

默认端口 **3001**，可通过环境变量 `PORT` 覆盖。

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API Key（必填） |
| `OPENAI_BASE_URL` | OpenAI 兼容端点（可选，如 OpenRouter） |
| `OPENAI_MODEL` | 模型名称（可选，默认 `gpt-4o-mini`） |
| `PORT` | 服务端口（可选，默认 `3001`） |
