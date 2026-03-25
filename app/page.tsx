"use client"

import { useRef, useMemo } from "react"
import { useChat } from "ai/react"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { ResultsPanel } from "@/components/results/ResultsPanel"
import type { AgentToolResult, ExplainabilityData } from "@/types/agent"

export default function Home() {
  // Stable session ID — useRef to avoid re-generation on re-render
  const sessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )

  const { messages, input, isLoading, setInput, handleSubmit, handleInputChange, append, error, data } = useChat({
    api: "/api/chat",
    body: { sessionId: sessionId.current },
    onError: (err) => console.error("[useChat] error:", err),
  })

  // Extract latest tool result from message stream
  // In Vercel AI SDK v3+, useChat stores tool results in message.toolInvocations
  // on assistant messages, NOT as separate role="tool" messages
  const latestToolResult = useMemo((): AgentToolResult | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === "assistant" && msg.toolInvocations) {
        for (let j = msg.toolInvocations.length - 1; j >= 0; j--) {
          const inv = msg.toolInvocations[j]
          if (inv.state === "result") {
            return inv.result as AgentToolResult
          }
        }
      }
    }
    return null
  }, [messages])

  // Extract latest explainability annotation from stream data
  const latestExplainability = useMemo((): ExplainabilityData | null => {
    if (!data || data.length === 0) return null
    for (let i = data.length - 1; i >= 0; i--) {
      const d = data[i]
      if (d && typeof d === "object" && !Array.isArray(d) && (d as Record<string, unknown>).type === "explainability") {
        return d as unknown as ExplainabilityData
      }
    }
    return null
  }, [data])

  function handleInputChangeWrapper(value: string) {
    // Bridge between string-based setter from SuggestedPrompts and ai/react event-based handler
    setInput(value)
  }

  function handleAction(prompt: string) {
    append({ role: "user", content: prompt })
  }

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left panel: Chat */}
      <div className="w-[400px] shrink-0 flex flex-col">
        <ChatPanel
          messages={messages}
          input={input}
          isLoading={isLoading}
          error={error}
          onInputChange={handleInputChangeWrapper}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right panel: Results */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ResultsPanel messages={messages} latestToolResult={latestToolResult} latestExplainability={latestExplainability} onAction={handleAction} isLoading={isLoading} />
      </div>
    </main>
  )
}
