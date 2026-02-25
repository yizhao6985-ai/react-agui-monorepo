# react-agui-core

基于 [AG-UI 协议](https://docs.ag-ui.com/) 的 React 生态：**react-agui-core** 提供状态与逻辑（Provider、hooks、工具），**react-agui-ui** 提供基于 Tailwind 的 UI 组件（Conversations、Bubble、Bubble.List、Sender），支持发送、编辑（分叉重发）、重试、线程重命名等。

---

## Monorepo 结构

本仓库为 pnpm workspace 单体仓库：

| 包                 | 说明                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| **packages/core**  | `react-agui-core`：Provider、hooks、工具（无 UI 组件）                       |
| **packages/ui**    | `react-agui-ui`：Tailwind 组件（Conversations、Bubble、Bubble.List、Sender） |
| **example/server** | 示例后端：LangChain + Express，AG-UI 兼容 SSE 流式服务                       |
| **example/web**    | 示例前端：Vite + React + Tailwind，使用 core + ui                            |

**根目录常用命令：**

```bash
pnpm install          # 安装所有依赖
pnpm build:core       # 构建 SDK
pnpm build:ui         # 构建 UI 组件库
pnpm dev:core         # 监听构建 core
pnpm dev:ui           # 监听构建 ui
pnpm dev:server       # 启动示例后端（需 OPENAI_API_KEY）
pnpm dev:web          # 启动示例前端（/agui 代理到后端）
```

---

## 示例项目配置与启动

示例包含 **example/server**（LangChain Agent 后端）和 **example/web**（Vite + React 前端），用于演示完整对话流程。

### 1. 后端配置（example/server）

1. 进入目录并复制环境变量模板：

   ```bash
   cd example/server
   cp .env.example .env
   ```

2. 编辑 `.env`，填入 **OpenAI API Key**（[OpenAI API Keys](https://platform.openai.com/api-keys)）；可选设置 `OPENAI_MODEL`（默认 `gpt-4o-mini`）、`TEMPERATURE`、`PORT`。

3. 在**仓库根目录**启动后端：
   ```bash
   pnpm dev:server
   ```
   默认监听 `http://localhost:3001`。后端使用 LangChain 的 `initChatModel` 初始化 OpenAI 模型，详见 [example/server/README.md](example/server/README.md)。

### 2. 前端配置（example/web）

前端依赖 **packages/core** 与 **packages/ui**，启动前需先构建：

```bash
pnpm build:core
pnpm build:ui
```

开发模式下，Vite 会将 `/agui` 代理到 `http://localhost:3001`，无需额外配置。

生产构建时，可通过环境变量 `VITE_AGUI_URL` 指定后端地址：

```bash
VITE_AGUI_URL=https://your-backend.com/agui pnpm build
```

### 3. 启动与访问

1. 在根目录执行 `pnpm install`（若未安装依赖）
2. 构建 core 与 ui：`pnpm build:core`、`pnpm build:ui`（前端依赖二者）
3. 先启动后端：`pnpm dev:server`
4. 再启动前端：`pnpm dev:web`
5. 浏览器打开 `http://localhost:5173`，即可与 LangChain Agent 对话

线程数据会持久化到 localStorage（key: `example_agui_threads`）。

---

## 架构

- **AGUI 封装层**（core）：`AGUIClient` 连接后端、消费 SSE，聚合成 Thread / Run / Message。
- **React 层**（core）：`AGUIProvider` + `useAGUI()` 暴露面向视图的数据与回调（threads、currentThread、sendMessage、createThread 等）。
- **UI 层**（ui）：`Conversations`、`Bubble`、`Bubble.List`、`Sender` 等带 Tailwind 样式的组件，依赖 core。

数据模型要点：线程为 `Thread { id, runs }`，每条 Run 含 `messages`；当前线程的「消息列表」为 `currentThread.runs.flatMap(r => r.messages)`。

---

## 安装

仅用状态与逻辑（自己写 UI）：

```bash
pnpm add react-agui-core
# 协议依赖（core 的 peer）
pnpm add @ag-ui/core
```

需要现成 UI 组件（Tailwind）：

```bash
pnpm add react-agui-core react-agui-ui @ag-ui/core
```

使用 **react-agui-ui** 时，项目需已配置 Tailwind，并在 `content` 中包含 ui 包源码路径，详见 [packages/ui/README.md](packages/ui/README.md)。

---

## 使用

### 1. 用 Provider 包裹应用（可选线程持久化）

```tsx
import { AGUIProvider, createLocalThreadStorage } from "react-agui-core";

const storage = createLocalThreadStorage({ key: "my_app_agui_threads" });

<AGUIProvider
  url="https://your-agui-backend.com/agui"
  storage={storage}
  debug={false}
>
  <App />
</AGUIProvider>;
```

不传 `storage` 时线程仅内存；传入则挂载时加载、变更时防抖保存。

### 2. 在组件内使用 useAGUI（core）+ 可选 UI 组件（ui）

```tsx
import { useAGUI } from "react-agui-core";
import { Conversations, Bubble, Sender } from "react-agui-ui";

function Chat() {
  const {
    threads,
    currentThread,
    loading,
    error,
    sendMessage,
    editMessage,
    retryMessage,
    createThread,
    deleteThread,
    switchThread,
    updateThreadTitle,
  } = useAGUI();

  const messages = currentThread?.runs.flatMap((r) => r.messages) ?? [];

  return (
    <div className="flex">
      <aside>
        <Conversations
          threads={threads}
          currentThreadId={currentThread?.id ?? null}
          onNew={createThread}
          onSwitch={switchThread}
          onDelete={deleteThread}
          onEditTitle={updateThreadTitle}
        />
      </aside>
      <main>
        {error && (
          <div>
            {error.message}
            <button onClick={() => retryMessage()}>重试</button>
          </div>
        )}
        <Bubble.List
          messages={messages}
          loading={loading}
          onEditMessage={editMessage}
        />
        <Sender onSend={sendMessage} disabled={loading} />
      </main>
    </div>
  );
}
```

### 3. 线程区 / 对话区 / 输入区

| 区域       | 数据与操作                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **线程区** | `threads`、`currentThread?.id` 高亮；`createThread()`、`switchThread(id)`、`deleteThread(id)`、`updateThreadTitle(id, title)` |
| **对话区** | 消息列表：`<Bubble.List messages={...} loading={...} onEditMessage={...} />`；`loading`、`error`、`retryMessage()`                  |
| **输入区** | `sendMessage(content)`（无当前线程时会先 `createThread()`）；`<Sender onSend={...} disabled={loading} />`                          |

### 4. useAGUI() 返回说明

| 数据             | 类型                         | 说明                                     |
| ---------------- | ---------------------------- | ---------------------------------------- |
| `threads`        | `Thread[]`                   | 线程列表                                 |
| `currentThread`  | `Thread \| null`             | 当前线程；消息来自 `currentThread.runs`  |
| `loading`        | `boolean`                    | 当前是否在请求中                         |
| `error`          | `{ message, code? } \| null` | 当前线程错误                             |

| 回调                                        | 说明                                                       |
| ------------------------------------------- | ---------------------------------------------------------- |
| `sendMessage(content, options?)`            | 发送消息并触发 Agent；可传 `threadId`                      |
| `editMessage(messageId, content, options?)` | 编辑消息并分叉：截断该条及之后的所有内容，用新内容重新发送 |
| `retryMessage(options?)`                    | 重试当前线程最后一条失败的 run                             |
| `createThread()`                            | 新建并切换为当前线程                                       |
| `deleteThread(threadId)`                    | 删除线程                                                   |
| `switchThread(threadId \| null)`            | 切换当前线程                                               |
| `updateThreadTitle(threadId, title)`        | 更新线程标题                                               |

### 5. 线程持久化（core）

- **接口**：`AGUIThreadStorage`（`load` / `save`），可自实现为 IndexedDB、服务端等。
- **内置**：`createLocalThreadStorage({ key?: string })`，默认 key `agui_threads`，localStorage 约 5MB 限制需注意。

---

## API 摘要

**react-agui-core**

| 名称                                   | 说明                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `AGUIProvider`                         | 根组件，传入 `url`、可选 `headers`、`debug`、`storage`                                         |
| `useAGUI()`                            | 返回 threads、currentThread、loading、error 及 sendMessage、editMessage、retryMessage 等回调   |
| `createLocalThreadStorage`             | 基于 localStorage 的线程持久化                                                                 |
| `getMessageText`, `getThreadMessages`  | 工具函数（供 ui 或自定义 UI 使用）                                                             |
| `AGUIClient`                           | 底层客户端，可单独使用（无 React）                                                             |

**react-agui-ui**（需先配置 Tailwind content）

| 名称            | 说明                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Conversations` | 线程列表，需传入 `threads`、`currentThreadId`、`onNew`、`onSwitch`、`onDelete`，可选 `onEditTitle`、`getItemTitle`   |
| `Bubble`        | 单条消息渲染（文本、工具调用等），可选 `onEdit` 编辑 user 消息                                                       |
| `Bubble.List`   | 消息列表展示，含角色标签、loading 状态，可选 `onEditMessage` 编辑消息                                                |
| `Sender`        | 输入框 + 发送，需传入 `onSend`、`disabled`，可选 `placeholder`                                                       |

---

## License

MIT
