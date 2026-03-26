"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Wrench, Activity } from "lucide-react"
import { EmptyState } from "./EmptyState"
import type { AgentRunRecord, ToolCallLog } from "@/types/agent"

function formatRelative(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "právě teď"
  if (mins < 60) return `před ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `před ${hours} h`
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(date))
}

const TOOL_LABELS: Record<string, string> = {
  queryNewClients: "Klienti",
  queryLeadsSalesTimeline: "Leady & prodeje",
  scanMissingRenovationData: "Scan renovací",
  createAgentTask: "Nový úkol",
  queryWeeklyKPIs: "Týdenní KPI",
  generateReport: "Zpráva",
  generatePresentation: "Prezentace",
}

export function LogsTab() {
  const [runs, setRuns] = useState<AgentRunRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchRuns() {
    setLoading(true)
    try {
      const res = await fetch("/api/agent-runs?limit=15")
      if (res.ok) setRuns(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg shimmer" />
        ))}
      </div>
    )
  }

  if (runs.length === 0) {
    return <EmptyState icon={Activity} title="Zatím žádné spuštění" description="Logy se zobrazí po prvním dotazu" />
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground/70 font-mono">
          {runs.length} posledních spuštění
        </p>
        <button
          onClick={fetchRuns}
          className="text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {runs.map((run) => {
          const tools = (run.toolsCalledJson ?? []) as ToolCallLog[]
          return (
            <div
              key={run.id}
              className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-foreground leading-snug line-clamp-2 flex-1">
                  {run.userQuery}
                </p>
                <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 mt-0.5">
                  {formatRelative(run.createdAt)}
                </span>
              </div>
              {tools.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tools.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/8 text-primary/70 border border-primary/15"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <Wrench className="w-2.5 h-2.5" />
                      {TOOL_LABELS[t.toolName] ?? t.toolName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
