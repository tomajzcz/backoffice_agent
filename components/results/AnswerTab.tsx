"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Message } from "ai/react"

interface Props {
  messages: Message[]
}

export function AnswerTab({ messages }: Props) {
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")

  const textContent =
    typeof lastAssistant?.content === "string"
      ? lastAssistant.content
      : Array.isArray(lastAssistant?.content)
      ? (lastAssistant.content as unknown as { type: string; text?: string }[])
          .filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join("")
      : ""

  if (!textContent) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground/40 text-sm">
        Zde se zobrazí odpověď agenta
      </div>
    )
  }

  return (
    <div className="prose-agent animate-fade-in">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
    </div>
  )
}
