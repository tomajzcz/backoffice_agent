"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./MessageBubble"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "ai/react"

interface Props {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const visibleMessages = messages.filter((m) => (m.role as string) !== "tool")

  return (
    <ScrollArea className="flex-1 px-3 py-3">
      {visibleMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 py-10 select-none">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-lg font-bold text-primary" style={{ fontFamily: "Syne, sans-serif" }}>B</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground/70" style={{ fontFamily: "Syne, sans-serif" }}>
              Back Office Agent
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[200px] leading-relaxed">
              Zeptej se mě na stav nemovitostí, úkoly, investory, ziskovost nebo operativní audit.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {visibleMessages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLoading={isLoading && i === visibleMessages.length - 1 && msg.role === "assistant"}
            />
          ))}
        </div>
      )}
      <div ref={bottomRef} />
    </ScrollArea>
  )
}
