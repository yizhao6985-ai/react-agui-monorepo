# react-agui-core

基于 [AG-UI 协议](https://docs.ag-ui.com/) 的 React 状态层：Provider、hooks、工具函数，**不包含 UI 组件**。带 Tailwind 的 UI 组件在 [packages/ui](../ui/README.md)（react-agui-ui）。

- 完整文档与使用说明见 [仓库根目录 README](../../README.md)。

## 构建

```bash
pnpm build   # 输出 dist/
pnpm dev     # 监听构建
```

## 导出概览

- **React**：`AGUIProvider`、`AGUIContext`、`useAGUI`
- **存储**：`createLocalThreadStorage`、类型 `AGUIThreadStorage`、`PersistedThread`
- **工具**：`getMessageText`、`getThreadMessages`
- **客户端**：`AGUIClient`（createThread、appendUserMessage、run、forkAtMessage、deleteThread、hydrate 等）
- **类型**：`Thread`、`Run`、`AGUIMessage`、`MessageSegment` 等

## useAGUI 回调

| 回调 | 说明 |
|------|------|
| `sendMessage(content, options?)` | 发送消息并触发 Agent |
| `editMessage(messageId, content, options?)` | 编辑消息并分叉：截断后续内容，用新内容重新发送 |
| `retryMessage(options?)` | 重试当前线程最后一条失败的 run |
| `createThread()` | 新建并切换为当前线程 |
| `deleteThread(threadId)` | 删除线程 |
| `switchThread(threadId \| null)` | 切换当前线程 |
| `updateThreadTitle(threadId, title)` | 更新线程标题 |
