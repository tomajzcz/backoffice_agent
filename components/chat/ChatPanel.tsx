"use client"

import { type FormEvent } from "react"
import { Separator } from "@/components/ui/separator"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import type { Message } from "ai/react"
import { Building2, LayoutDashboard, Database } from "lucide-react"
import Link from "next/link"

interface Props {
  messages: Message[]
  input: string
  isLoading: boolean
  error?: Error
  onInputChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function ChatPanel({ messages, input, isLoading, error, onInputChange, onSubmit }: Props) {
  const isEmpty = messages.filter((m) => (m.role as string) !== "tool").length === 0

  function handlePromptSelect(prompt: string) {
    onInputChange(prompt)
    // Trigger submit after a tick so value is set
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as FormEvent
      if (!isLoading) onSubmit(fakeEvent)
    }, 50)
  }

  return (
    <div className="flex flex-col h-full border-r border-border/50 bg-background/60">
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h1
            className="text-sm font-semibold text-foreground leading-none"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Back Office Agent
          </h1>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
            Realitní operativa & analytika
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            online
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2.5 border-b border-border/30">
        <Link
          href="/sprava"
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 hover:border-border/70 transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <Database className="w-3.5 h-3.5" />
          Správa dat
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 hover:border-border/70 transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Monitoring
        </Link>
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
