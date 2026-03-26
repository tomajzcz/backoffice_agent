"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2, ChevronLeft, ChevronRight, FileBarChart, Pause, Settings } from "lucide-react"
import {
  listReportRunsAction,
  triggerExecutiveReportAction,
  toggleAutomationConfigAction,
  updateAutomationConfigAction,
  type ReportRunRow,
  type AutomationConfigRow,
} from "../actions"
import { AutomationSettingsDialog } from "./AutomationSettingsDialog"

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  RUNNING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
}

const STATUS_LABELS: Record<string, string> = {
  RUNNING: "Běží",
  SUCCESS: "Úspěch",
  FAILED: "Chyba",
}

const TRIGGER_LABELS: Record<string, string> = {
  cron: "Cron",
  manual: "Manuální",
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—"
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function OtherAutomationsTab({
  initialReportRuns,
  initialConfig,
}: {
  initialReportRuns: { items: ReportRunRow[]; total: number }
  initialConfig: AutomationConfigRow | null
}) {
  const [items, setItems] = useState<ReportRunRow[]>(initialReportRuns.items)
  const [total, setTotal] = useState(initialReportRuns.total)
  const [page, setPage] = useState(1)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState(initialConfig)
  const [toggling, setToggling] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function refreshRuns(newPage: number) {
    const data = await listReportRunsAction({
      limit: PAGE_SIZE,
      offset: (newPage - 1) * PAGE_SIZE,
    })
    setItems(data.items)
    setTotal(data.total)
    setPage(newPage)
  }

  async function handleTrigger() {
    setRunning(true)
    setRunResult(null)
    setError(null)
    const result = await triggerExecutiveReportAction()
    setRunning(false)
    if (result.success) {
      const data = result.data as { message: string }
      setRunResult(data.message)
      await refreshRuns(1)
    } else {
      setError(result.error)
      await refreshRuns(1)
    }
  }

  async function handleToggle() {
    if (!config) return
    setToggling(true)
    const result = await toggleAutomationConfigAction(config.key)
    setToggling(false)
    if (result.success) {
      setConfig({ ...config, isActive: !config.isActive })
    } else {
      setError(result.error)
    }
  }

  async function handleSettingsSave(data: {
    isActive: boolean
    cronExpr: string
    recipientEmail: string
  }) {
    if (!config) return
    const result = await updateAutomationConfigAction(config.key, data)
    if (result.success) {
      setConfig({ ...config, ...data })
    } else {
      setError(result.error)
    }
  }

  async function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    await refreshRuns(newPage)
  }

  if (!config) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground/80">
          Konfigurace executive reportu nenalezena. Spusťte seed databáze.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileBarChart className="w-4 h-4 text-primary/70" />
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                Týdenní executive report
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] border font-mono ${
                  config.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {config.isActive ? "Aktivní" : "Pozastaveno"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70 font-mono">
              <span>Plán: <span className="text-foreground/60">Pondělí v 9:00 (Praha)</span></span>
              <span>Cron: {config.cronExpr}</span>
              <span>Email: <span className="text-foreground/60">{config.recipientEmail}</span></span>
              <span>5 slidů PPTX</span>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground/50 mt-1">
              <span>KPI</span>
              <span>·</span>
              <span>Leady & konverze</span>
              <span>·</span>
              <span>Pipeline</span>
              <span>·</span>
              <span>Problémy</span>
              <span>·</span>
              <span>Akční plán</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSettingsOpen(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Nastavení"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleToggle}
              disabled={toggling}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title={config.isActive ? "Pozastavit" : "Aktivovat"}
            >
              <Pause className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleTrigger}
              disabled={running}
              size="sm"
              className="h-8 gap-1.5"
            >
              {running ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Spustit teď
            </Button>
          </div>
        </div>

        {runResult && (
          <div className="mt-3 px-3 py-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs">
            {runResult}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400/60 hover:text-red-400">
            ✕
          </button>
        </div>
      )}

      {/* History table */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground/80">Zatím žádné běhy executive reportu</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-secondary/20">
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Datum</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Trigger</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Status</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Slidů</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Trvání</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Chyba</th>
              </tr>
            </thead>
            <tbody>
              {items.map((run) => (
                <tr key={run.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground/80 font-mono">
                    {new Date(run.startedAt).toLocaleString("cs-CZ", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-foreground/70">
                    {TRIGGER_LABELS[run.trigger] ?? run.trigger}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] border font-mono ${STATUS_STYLES[run.status] ?? ""}`}
                    >
                      {STATUS_LABELS[run.status] ?? run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground/70">
                    {run.slideCount ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground/70">
                    {formatDuration(run.startedAt, run.finishedAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    {run.errorMessage && (
                      <span className="text-[10px] text-red-400/60 truncate max-w-[200px] inline-block align-middle">
                        {run.errorMessage.slice(0, 60)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/20 bg-secondary/10">
            <span className="text-[10px] text-muted-foreground/80 font-mono">
              Celkem {total} záznamů
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings dialog */}
      <AutomationSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        title="Nastavení executive reportu"
        showEmail={true}
        onSave={handleSettingsSave}
      />
    </div>
  )
}
