# react-agui-ui

基于 [AG-UI 协议](https://docs.ag-ui.com/) 与 **Tailwind CSS** 的 React 组件库，依赖 [react-agui-core](../core/README.md)。提供 `Conversations`、`Bubble`、`Bubble.List`、`Loading`、`Sender` 等带样式的组件。

## 安装

```bash
pnpm add react-agui-ui react-agui-core
```

## Tailwind 配置

使用前需在项目中配置 Tailwind，并在 `content` 中包含本包源码路径，否则组件上的 Tailwind 类不会生效：

```js
// tailwind.config.js（示例：应用在仓库根或应用目录）
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // 本包源码（按实际路径二选一）
    "./node_modules/react-agui-ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}", // monorepo 中 example 引用 ui 时
  ],
  theme: { extend: {} },
  plugins: [],
};
```

## 使用

在 `AGUIProvider`（来自 react-agui-core）下引入：

```tsx
import { AGUIProvider, createLocalSessionStorage } from "react-agui-core";
import { Conversations, Bubble, Sender } from "react-agui-ui";

<AGUIProvider url="/agui" storage={createLocalSessionStorage()}>
  <Conversations
    sessions={sessions}
    currentSessionId={currentSession?.id ?? null}
    onNew={createSession}
    onSwitch={switchSession}
    onDelete={deleteSession}
    onEditTitle={updateSessionTitle}
  />
  <Bubble.List
    messages={messages}
    loading={loading}
    onEditMessage={editMessage}
  />
  <Bubble message={msg} onEdit={editMessage} />
  <Sender onSend={sendMessage} disabled={loading} placeholder="输入消息…" />
</AGUIProvider>;
```

更多用法见 [根目录 README](../../README.md)。

## 组件说明

| 组件            | 主要 props                                                                                       | 说明                                                  |
| --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `Conversations` | `sessions`、`currentSessionId`、`onNew`、`onSwitch`、`onDelete`、`onEditTitle?`、`getItemTitle?` | 会话列表，支持新建/切换/删除/重命名                   |
| `Bubble`        | `message`、`onEdit?`                                                                             | 单条消息渲染，`onEdit` 传入时对 user 消息显示编辑按钮 |
| `Bubble.List`   | `messages`、`loading?`、`loadingText?`、`onEditMessage?`                                         | 消息列表，含角色标签、loading 状态                    |
| `Loading`       | `loading?`、`text?`                                                                              | AGUI 级别 loading 状态展示（如「正在回复…」）         |
| `Sender`        | `onSend`、`disabled?`、`placeholder?`                                                            | 输入框 + 发送按钮                                     |

## 构建

```bash
pnpm build   # 输出 dist/
pnpm dev     # 监听构建
```
