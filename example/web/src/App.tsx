import { useAGUI } from "react-agui-core";
import { Conversations, Bubble, Sender } from "react-agui-ui";

export default function App() {
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

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50">
        <div className="border-b border-zinc-200 px-4 py-3">
          <strong className="text-zinc-900">线程</strong>
        </div>
        <Conversations
          threads={threads}
          currentThreadId={currentThread?.id ?? null}
          onNew={createThread}
          onSwitch={switchThread}
          onDelete={deleteThread}
          onEditTitle={updateThreadTitle}
          className="min-h-0 flex-1 overflow-y-auto"
        />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden p-6">
          {error && (
            <div
              className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              <span>{error.message}</span>
              <button
                type="button"
                className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-red-100"
                onClick={() => retryMessage()}
              >
                重试
              </button>
            </div>
          )}

          {!currentThread && (
            <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
              请从左侧新建或选择一个线程
            </div>
          )}

          {currentThread ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-4">
              <Bubble.List
                messages={currentThread.runs.flatMap((r) => r.messages)}
                loading={loading}
                onEditMessage={editMessage}
              />
            </div>
          ) : null}

          <div className="shrink-0 border-t border-zinc-200 pt-4">
            <Sender onSend={sendMessage} disabled={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
