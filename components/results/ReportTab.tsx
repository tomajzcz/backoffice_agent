"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Download, FileText, Mail, Send, CheckCircle2, X, Loader2 } from "lucide-react"
import { ExportButtons } from "./ExportButtons"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult | null
  isLoading?: boolean
}

export function ReportTab({ result, isLoading }: Props) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput || !result || result.toolName !== "generatePresentation") return

    setSendState("sending")
    setErrorMessage("")

    try {
      const url = new URL(result.downloadUrl, window.location.origin)
      const token = url.searchParams.get("token")

      const res = await fetch("/api/export/pptx/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailInput,
          token,
          filename: result.title ?? "prezentace",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Nepodařilo se odeslat")
      }

      setSendState("sent")
      setTimeout(() => {
        setSendState("idle")
        setShowEmailForm(false)
        setEmailInput("")
      }, 3000)
    } catch (err) {
      setSendState("error")
      setErrorMessage(err instanceof Error ? err.message : "Nepodařilo se odeslat email")
    }
  }

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
          <div className="flex items-center gap-3">
            <ExportButtons result={result} />
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              {new Date(result.generatedAt).toLocaleDateString("cs-CZ")}
            </span>
          </div>
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
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full">
              <a
                href={result.downloadUrl}
                download={`${result.title ?? "prezentace"}.pptx`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Stáhnout
              </a>
              <button
                onClick={() => {
                  setShowEmailForm(!showEmailForm)
                  setSendState("idle")
                  setErrorMessage("")
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  showEmailForm
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/50 text-foreground/70 border-border/30 hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                <Mail className="w-4 h-4" />
                Poslat emailem
              </button>
            </div>

            {/* Inline email form */}
            {showEmailForm && (
              <div className="w-full animate-fade-in">
                {sendState === "sent" ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Odesláno!</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendEmail} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        disabled={sendState === "sending"}
                      />
                      <button
                        type="submit"
                        disabled={sendState === "sending" || !emailInput}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendState === "sending" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmailForm(false)
                          setSendState("idle")
                          setErrorMessage("")
                          setEmailInput("")
                        }}
                        className="flex items-center justify-center p-2 rounded-lg text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {sendState === "error" && (
                      <p className="text-xs text-destructive/70 px-1">{errorMessage}</p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
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
