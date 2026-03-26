"use client"

import { type FormEvent } from "react"
import { Separator } from "@/components/ui/separator"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import type { Message } from "ai/react"

interface Props {
  messages: Message[]
  input: string
  isLoading: boolean
  error?: Error
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function ChatPanel({ messages, input, isLoading, error, onInputChange, onSubmit }: Props) {
  const visibleMessages = messages.filter((m) => (m.role as string) !== "tool")
  const isEmpty = visibleMessages.length === 0

  function handlePromptSelect(prompt: string) {
    onInputChange(prompt)
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as FormEvent
      if (!isLoading) onSubmit(fakeEvent)
    }, 50)
  }

  return (
    <div className="flex flex-col h-full border-r border-border/30 bg-background/60">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-border/30">
        <h2
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Konverzace
        </h2>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          {visibleMessages.length > 0 ? `${visibleMessages.length} zpráv` : "Nová konverzace"}
        </p>
      </div>

      {/* Message list */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Error display */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <span className="font-medium">Chyba:</span> {error.message}
        </div>
      )}

      {/* Suggested prompts */}
      <Separator className="opacity-30" />
      <SuggestedPrompts onSelect={handlePromptSelect} visible={isEmpty} />

      {/* Input */}
      <Separator className="opacity-30" />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  )
}
