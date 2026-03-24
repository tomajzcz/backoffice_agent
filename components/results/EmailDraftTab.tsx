"use client"

import { CheckCircle2, Mail, User, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { CreateGmailDraftResult } from "@/types/agent"

interface Props {
  result: CreateGmailDraftResult
}

export function EmailDraftTab({ result }: Props) {
  return (
    <div className="animate-fade-in space-y-4">
      {/* Success badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-400">
          Draft uložen do Gmailu &middot; {formatDate(result.savedAt)}
        </p>
      </div>

      {/* Email preview */}
      <div className="rounded-lg border border-border/40 bg-secondary/20 overflow-hidden">
        {/* Header fields */}
        <div className="px-4 py-3 space-y-2 border-b border-border/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium w-16 shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <User className="w-3 h-3" />
              Komu
            </span>
            <span className="text-sm text-foreground/85 font-mono">{result.to}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium w-16 shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <FileText className="w-3 h-3" />
              Předmět
            </span>
            <span className="text-sm text-foreground/85 font-medium">{result.subject}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <div
            className="prose prose-invert prose-sm max-w-none
              [&_p]:text-foreground/80 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2
              [&_strong]:text-foreground/90
              [&_ul]:my-2 [&_li]:text-foreground/80 [&_li]:text-sm
              [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
            dangerouslySetInnerHTML={{ __html: result.bodyHtml }}
          />
        </div>
      </div>

      {/* Draft ID */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/40 font-mono">
        <span className="flex items-center gap-1.5">
          <Mail className="w-3 h-3" />
          Gmail Draft ID: {result.draftId}
        </span>
      </div>
    </div>
  )
}
