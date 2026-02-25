# Example Web（Vite + React + Tailwind）

示例对话前端：**Vite + React**，使用 **react-agui-core**（Provider、useAGUI）与 **react-agui-ui**（Conversations、Bubble、Bubble.List、Sender），样式全部为 Tailwind。

## 命令

```bash
pnpm dev     # 开发（默认 http://localhost:5173）
pnpm build   # 构建
pnpm preview # 预览构建结果
```

## 与后端联调

开发模式下 Vite 将 `/agui` 代理到 `http://localhost:3001`。请先在本仓库根目录启动 [example/server](../server/README.md)（`pnpm dev:server`），并确保后端已配置 `OPENAI_API_KEY`，再执行 `pnpm dev:web`，即可与 LangChain Agent 对话。

生产环境可通过环境变量 `VITE_AGUI_URL` 配置后端地址。

## 功能

- 线程列表：新建、切换、删除、重命名
- 消息列表：发送、编辑（分叉后重新发送）、重试
- 线程持久化：localStorage（key: `example_agui_threads`）

## 依赖关系

- **react-agui-core**：AGUIProvider、useAGUI、createLocalThreadStorage
- **react-agui-ui**：Conversations、Bubble、Bubble.List、Sender（Tailwind）
- **Tailwind**：`content` 已包含 `packages/ui/src`，以生成 ui 组件的样式
