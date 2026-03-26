"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2, ChevronLeft, ChevronRight, Phone, Settings, Pause } from "lucide-react"
import { CALL_STATUS_LABELS } from "@/lib/constants/labels"
import {
  listCallLogsAction,
  triggerReminderCallsAction,
  updateAutomationConfigAction,
  toggleAutomationConfigAction,
  type CallLogRow,
  type AutomationConfigRow,
} from "../actions"
import { AutomationSettingsDialog } from "./AutomationSettingsDialog"

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  INITIATED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  NO_PHONE: "bg-secondary/40 text-muted-foreground border-border/40",
  SKIPPED: "bg-secondary/40 text-muted-foreground border-border/40",
}

export function ReminderCallsTab({
  initialCallLogs,
  initialConfig,
}: {
  initialCallLogs: { items: CallLogRow[]; total: number }
  initialConfig: AutomationConfigRow | null
}) {
  const [items, setItems] = useState<CallLogRow[]>(initialCallLogs.items)
  const [total, setTotal] = useState(initialCallLogs.total)
  const [page, setPage] = useState(1)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState(initialConfig)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function refreshLogs(newPage: number) {
    const data = await listCallLogsAction({
      limit: PAGE_SIZE,
      offset: (newPage - 1) * PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
    })
    setItems(data.items)
    setTotal(data.total)
    setPage(newPage)
  }

  async function handleTrigger() {
    setRunning(true)
    setRunResult(null)
    setError(null)
    const result = await triggerReminderCallsAction()
    setRunning(false)
    if (result.success) {
      const data = result.data as { message: string }
      setRunResult(data.message)
      await refreshLogs(1)
    } else {
      setError(result.error)
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
    await refreshLogs(newPage)
  }

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-primary/70" />
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                Denní připomínkové hovory
              </h3>
              {config && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] border font-mono ${
                    config.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {config.isActive ? "Aktivní" : "Pozastaveno"}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/70 font-mono">
              <span>Plán: <span className="text-foreground/60">Denně v 7:00 (Praha)</span></span>
              <span>Cron: {config?.cronExpr ?? "0 5 * * *"}</span>
              <span>ElevenLabs Voice AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {config && (
              <>
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
              </>
            )}
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
          <button onClick={() => setError(null)} className="ml-3 text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Call logs table */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground/80">Zatím žádné záznamy o hovorech</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30 bg-secondary/20">
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Datum</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Klient</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Telefon</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Nemovitost</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Prohlídka</th>
                <th className="px-4 py-2.5 text-left font-mono text-muted-foreground/80 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground/80 font-mono">
                    {new Date(log.callDate).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-2.5 text-foreground/85 font-medium">{log.clientName}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground/70">
                    {log.phoneNormalized ?? log.clientPhone ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-foreground/70">{log.propertyAddress}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground/70">{log.showingTime}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] border font-mono ${STATUS_STYLES[log.status] ?? ""}`}
                      title={log.errorMessage ?? undefined}
                    >
                      {CALL_STATUS_LABELS[log.status] ?? log.status}
                    </span>
                    {log.status === "FAILED" && log.errorMessage && (
                      <span className="ml-2 text-[10px] text-red-400/60 truncate max-w-[200px] inline-block align-middle">
                        {log.errorMessage.slice(0, 60)}
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
      {config && (
        <AutomationSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          config={config}
          title="Nastavení připomínkových hovorů"
          showEmail={false}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  )
}
