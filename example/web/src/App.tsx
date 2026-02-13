import { useAGUI } from "react-agui-core";
import { Conversations, Bubble, Sender } from "react-agui-ui";

export default function App() {
  const {
    sessions,
    currentSession,
    loading,
    error,
    sendMessage,
    editMessage,
    retryMessage,
    createSession,
    deleteSession,
    switchSession,
    updateSessionTitle,
  } = useAGUI();

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <strong className="text-zinc-100">会话</strong>
        </div>
        <Conversations
          sessions={sessions}
          currentSessionId={currentSession?.id ?? null}
          onNew={createSession}
          onSwitch={switchSession}
          onDelete={deleteSession}
          onEditTitle={updateSessionTitle}
          className="min-h-0 flex-1 overflow-y-auto"
        />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden p-6">
          {error && (
            <div
              className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300"
              role="alert"
            >
              <span>{error.message}</span>
              <button
                type="button"
                className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-red-900/50"
                onClick={() => retryMessage()}
              >
                重试
              </button>
            </div>
          )}

          {!currentSession && (
            <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
              请从左侧新建或选择一个会话
            </div>
          )}

          {currentSession ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-4">
              <Bubble.List
                messages={currentSession.runs.flatMap((r) => r.messages)}
                loading={loading}
                onEditMessage={editMessage}
              />
            </div>
          ) : null}

          <div className="shrink-0 border-t border-zinc-800 pt-4">
            <Sender onSend={sendMessage} disabled={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}
