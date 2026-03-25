"use client"

import { useState } from "react"
import { CheckCircle2, Mail, User, FileText, Loader2, XCircle, Edit3 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { PrepareEmailDraftResult, CreateGmailDraftResult } from "@/types/agent"

type ApprovalStatus = "pending" | "editing" | "approving" | "approved" | "rejected"

interface Props {
  result: PrepareEmailDraftResult | CreateGmailDraftResult
}

export function EmailDraftTab({ result }: Props) {
  // If this is an already-committed draft (backward compat), show success directly
  const isAlreadyCommitted = result.toolName === "createGmailDraft"

  const [status, setStatus] = useState<ApprovalStatus>(isAlreadyCommitted ? "approved" : "pending")
  const [editedSubject, setEditedSubject] = useState(result.subject)
  const [editedBody, setEditedBody] = useState(result.bodyHtml)
  const [committedDraft, setCommittedDraft] = useState<{ draftId: string; savedAt: string } | null>(
    isAlreadyCommitted ? { draftId: (result as CreateGmailDraftResult).draftId, savedAt: (result as CreateGmailDraftResult).savedAt } : null,
  )
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setStatus("approving")
    setError(null)

    try {
      const res = await fetch("/api/email/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: result.to,
          subject: editedSubject,
          bodyHtml: editedBody,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Nepodařilo se uložit draft")
      }

      const data = await res.json()
      setCommittedDraft(data)
      setStatus("approved")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznámá chyba")
      setStatus("pending")
    }
  }

  // Rejected state
  if (status === "rejected") {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">Návrh e-mailu zamítnut</p>
        </div>
      </div>
    )
  }

  // Approved state
  if (status === "approved" && committedDraft) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">
            Draft uložen do Gmailu &middot; {formatDate(committedDraft.savedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 overflow-hidden">
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
              <span className="text-sm text-foreground/85 font-medium">{editedSubject}</span>
            </div>
          </div>
          <div className="px-4 py-4">
            <div
              className="prose prose-invert prose-sm max-w-none
                [&_p]:text-foreground/80 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2
                [&_strong]:text-foreground/90
                [&_ul]:my-2 [&_li]:text-foreground/80 [&_li]:text-sm
                [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
              dangerouslySetInnerHTML={{ __html: editedBody }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/40 font-mono">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            Gmail Draft ID: {committedDraft.draftId}
          </span>
        </div>
      </div>
    )
  }

  // Pending / Editing / Approving state
  const isEditing = status === "editing"

  return (
    <div className="animate-fade-in space-y-4">
      {/* Approval badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <Mail className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-400">
          Návrh e-mailu připraven ke schválení
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Email preview / edit */}
      <div className="rounded-lg border border-border/40 bg-secondary/20 overflow-hidden">
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
            {isEditing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="flex-1 text-sm text-foreground/85 font-medium bg-secondary/50 border border-border/40 rounded px-2 py-1 outline-none focus:border-primary/40"
              />
            ) : (
              <span className="text-sm text-foreground/85 font-medium">{editedSubject}</span>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          {isEditing ? (
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              className="w-full text-sm text-foreground/80 bg-secondary/50 border border-border/40 rounded px-3 py-2 font-mono outline-none focus:border-primary/40 resize-y"
            />
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none
                [&_p]:text-foreground/80 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-2
                [&_strong]:text-foreground/90
                [&_ul]:my-2 [&_li]:text-foreground/80 [&_li]:text-sm
                [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
              dangerouslySetInnerHTML={{ __html: editedBody }}
            />
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={status === "approving"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            bg-emerald-500/15 text-emerald-400 border border-emerald-500/25
            hover:bg-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "approving" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Ukládám…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Schválit a uložit jako draft
            </>
          )}
        </button>

        <button
          onClick={() => setStatus(isEditing ? "pending" : "editing")}
          disabled={status === "approving"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            bg-secondary/50 text-muted-foreground border border-border/40
            hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <Edit3 className="w-3 h-3" />
          {isEditing ? "Ukončit úpravy" : "Upravit návrh"}
        </button>

        <button
          onClick={() => setStatus("rejected")}
          disabled={status === "approving"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            bg-red-500/10 text-red-400 border border-red-500/20
            hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3 h-3" />
          Zamítnout
        </button>
      </div>
    </div>
  )
}
