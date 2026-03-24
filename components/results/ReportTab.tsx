"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Download, FileText } from "lucide-react"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult | null
  isLoading?: boolean
}

export function ReportTab({ result, isLoading }: Props) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground/40">
        <FileText className="w-5 h-5" />
        <p className="text-sm">Spusť generování reportu nebo prezentace</p>
      </div>
    )
  }

  if (result.toolName === "generateReport") {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground/80" style={{ fontFamily: "Syne, sans-serif" }}>
            {result.title}
          </h3>
          <span className="text-[10px] text-muted-foreground/40 font-mono">
            {new Date(result.generatedAt).toLocaleDateString("cs-CZ")}
          </span>
        </div>
        <div className="prose prose-sm prose-invert prose-agent max-w-none text-xs leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.markdown}</ReactMarkdown>
        </div>
      </div>
    )
  }

  if (result.toolName === "generatePresentation") {
    const hasUrl = !!result.downloadUrl

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-center space-y-2">
          <FileText className="w-10 h-10 text-primary/60 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground/80" style={{ fontFamily: "Syne, sans-serif" }}>
            {result.title}
          </h3>
          <p className="text-xs text-muted-foreground/50">
            {result.slideCount} {result.slideCount === 1 ? "slide" : result.slideCount < 5 ? "slidy" : "slidů"} · PPTX formát
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 text-muted-foreground text-sm border border-border/30 cursor-not-allowed select-none">
            <Download className="w-4 h-4 opacity-40" />
            Čeká na dokončení odpovědi…
          </div>
        ) : hasUrl ? (
          <a
            href={result.downloadUrl}
            download={`${result.title ?? "prezentace"}.pptx`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Stáhnout prezentaci (.pptx)
          </a>
        ) : (
          <p className="text-xs text-destructive/70">Generování se nezdařilo. Zkus to znovu.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-40 text-muted-foreground/40 text-sm">
      Výsledek nemá formát zprávy
    </div>
  )
}
