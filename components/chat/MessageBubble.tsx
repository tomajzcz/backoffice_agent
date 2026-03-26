"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ToolCallIndicator } from "./ToolCallIndicator"
import { cn } from "@/lib/utils"
import type { Message } from "ai/react"

interface Props {
  message: Message
  isLoading?: boolean
}

function formatTime(date?: Date | string) {
  if (!date) return ""
  return new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(date)
  )
}

export function MessageBubble({ message, isLoading }: Props) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  if ((message.role as string) === "tool") return null // tool results shown in Results panel

  // Extract tool calls and text from assistant message
  const parts = Array.isArray(message.content) ? message.content : []
  const textContent =
    typeof message.content === "string"
      ? message.content
      : parts.filter((p) => p.type === "text").map((p: { type: string; text?: string }) => p.text ?? "").join("")

  const toolCalls = parts.filter((p) => p.type === "tool-call") as Array<{
    type: "tool-call"
    toolCallId: string
    toolName: string
    args: Record<string, unknown>
  }>

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%]">
          <div className="bg-primary/8 border border-primary/15 rounded-2xl rounded-tr-md px-3.5 py-2.5">
            <p className="text-sm text-foreground leading-relaxed">{message.content as string}</p>
          </div>
          <p className="text-right text-[10px] text-muted-foreground/60 mt-1 pr-1 font-mono">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  if (isAssistant) {
    return (
      <div className="flex gap-2.5 animate-fade-in">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-primary" style={{ fontFamily: "Syne, sans-serif" }}>A</span>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Tool call indicators */}
          {toolCalls.map((tc) => (
            <ToolCallIndicator
              key={tc.toolCallId}
              toolName={tc.toolName}
              isLoading={isLoading ?? false}
            />
          ))}

          {/* Text content */}
          {textContent && (
            <div className={cn(
              "rounded-2xl rounded-tl-sm px-3.5 py-2.5",
              "bg-card/80 border border-border/40"
            )}>
              <div className="prose-agent">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {textContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Loading cursor */}
          {isLoading && !textContent && toolCalls.length === 0 && (
            <div className="bg-card/80 border border-border/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <span className="inline-block w-2 h-4 bg-primary/60 animate-blink rounded-sm" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
