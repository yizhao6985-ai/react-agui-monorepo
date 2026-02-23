# Example Server（LangChain Agent）

基于 **LangChain** 与 **Express** 的 AG-UI 兼容 Agent 服务：接收前端 POST，流式返回 SSE 事件。供 [example-web](../web/README.md) 或任意 AG-UI 客户端调用。模型通过 LangChain 的 `initChatModel` 初始化（OpenAI）。

## 快速开始

1. 复制环境变量：`cp .env.example .env`
2. 编辑 `.env`：填入 `OPENAI_API_KEY`（[OpenAI API Keys](https://platform.openai.com/api-keys)）
3. （可选）设置 `OPENAI_MODEL`（默认 `gpt-4o-mini`）
4. 在仓库根目录运行：`pnpm dev:server`（或本目录 `pnpm start`）

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

| 变量             | 说明                                     |
| ---------------- | ---------------------------------------- |
| `OPENAI_API_KEY` | OpenAI API Key（必填）                   |
| `OPENAI_MODEL`   | OpenAI 模型（可选，默认 `gpt-4o-mini`）  |
| `TEMPERATURE`    | 温度 0–2（可选，默认 `1`）               |
| `PORT`           | 服务端口（可选，默认 `3001`）            |
