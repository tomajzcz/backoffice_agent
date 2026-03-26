"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExplainabilitySection } from "./ExplainabilitySection"
import { EmptyState } from "./EmptyState"
import { MessageSquare } from "lucide-react"
import type { Message } from "ai/react"
import type { ExplainabilityData } from "@/types/agent"

interface Props {
  messages: Message[]
  explainability?: ExplainabilityData | null
}

export function AnswerTab({ messages, explainability }: Props) {
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
    return <EmptyState icon={MessageSquare} title="Zde se zobrazí odpověď agenta" description="Zadejte dotaz v chatu" />
  }

  return (
    <div className="animate-fade-in">
      <div className="rounded-xl border border-border/30 bg-card/40 p-5">
        <div className="prose-agent">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
        </div>
      </div>
      {explainability && <ExplainabilitySection data={explainability} />}
    </div>
  )
}
