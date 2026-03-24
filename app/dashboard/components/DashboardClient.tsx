"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Play, Pause, Pencil, Trash2, Loader2, Mail } from "lucide-react"
import { JobForm } from "./JobForm"
import {
  listJobsAction,
  createJobAction,
  updateJobAction,
  deleteJobAction,
  toggleJobStatusAction,
  runJobNowAction,
} from "../actions"
import type { JobConfig } from "@/lib/scraper/types"
import { formatCZK } from "@/lib/utils"

interface Job {
  id: number
  name: string
  description: string | null
  cronExpr: string
  lastRunAt: string | null
  status: string
  configJson: JobConfig
  notifyEmail: string | null
  createdAt: string
  resultsCount: number
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ERROR: "bg-red-500/10 text-red-400 border-red-500/20",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktivní",
  PAUSED: "Pozastaveno",
  ERROR: "Chyba",
}

export function DashboardClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runningJobId, setRunningJobId] = useState<number | null>(null)
  const [runResult, setRunResult] = useState<{ jobId: number; message: string } | null>(null)

  const refreshJobs = useCallback(async () => {
    const data = await listJobsAction()
    setJobs(data)
  }, [])

  function handleAdd() {
    setEditingJob(null)
    setFormOpen(true)
  }

  function handleEdit(job: Job) {
    setEditingJob(job)
    setFormOpen(true)
  }

  async function handleFormSave(data: {
    name: string
    description?: string
    cronExpr: string
    notifyEmail?: string
    configJson: JobConfig
  }) {
    setError(null)
    let result
    if (editingJob) {
      result = await updateJobAction(editingJob.id, data)
    } else {
      result = await createJobAction(data)
    }

    if (result.success) {
      setFormOpen(false)
      setEditingJob(null)
      await refreshJobs()
    } else {
      setError(result.error)
    }
  }

  async function handleDelete(jobId: number) {
    if (!confirm("Opravdu smazat tento monitoring? Všechny výsledky budou smazány.")) return
    setError(null)
    const result = await deleteJobAction(jobId)
    if (result.success) {
      await refreshJobs()
    } else {
      setError(result.error)
    }
  }

  async function handleToggle(jobId: number) {
    setError(null)
    const result = await toggleJobStatusAction(jobId)
    if (result.success) {
      await refreshJobs()
    } else {
      setError(result.error)
    }
  }

  async function handleRunNow(jobId: number) {
    setRunningJobId(jobId)
    setRunResult(null)
    setError(null)
    const result = await runJobNowAction(jobId)
    setRunningJobId(null)
    if (result.success) {
      const data = result.data as { scraped: number; new: number }
      setRunResult({
        jobId,
        message: `Scrapováno ${data.scraped} inzerátů, ${data.new} nových.`,
      })
      await refreshJobs()
    } else {
      setError(result.error)
    }
  }

  function formatLastRun(iso: string | null): string {
    if (!iso) return "—"
    return new Date(iso).toLocaleString("cs-CZ", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatFilters(config: JobConfig): string {
    const parts: string[] = []
    if (config.filters?.types?.length) {
      const typeLabels: Record<string, string> = { BYT: "Byty", DUM: "Domy", KOMERCNI: "Komerční" }
      parts.push(config.filters.types.map((t) => typeLabels[t] ?? t).join(", "))
    }
    if (config.filters?.dispositions?.length) {
      parts.push(config.filters.dispositions.join(", "))
    }
    if (config.filters?.maxPrice) {
      parts.push(`do ${formatCZK(config.filters.maxPrice)}`)
    }
    if (config.filters?.minAreaM2 || config.filters?.maxAreaM2) {
      const min = config.filters.minAreaM2 ? `${config.filters.minAreaM2}` : "0"
      const max = config.filters.maxAreaM2 ? `${config.filters.maxAreaM2}` : "∞"
      parts.push(`${min}–${max} m²`)
    }
    return parts.join(" · ") || "Bez filtrů"
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Monitoring Dashboard
            </h1>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Správa monitorovacích jobů a jejich výsledků
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nový monitoring
            </Button>
            <Link
              href="/"
              className="text-xs text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Zpět na chat
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400/60 hover:text-red-400">✕</button>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground/40 mb-4">Žádné monitorovací joby</p>
            <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Vytvořit první monitoring
            </Button>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-border/40 bg-secondary/10 overflow-hidden"
            >
              <div className="px-5 py-4">
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground/90" style={{ fontFamily: "Syne, sans-serif" }}>
                      {job.name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${STATUS_STYLES[job.status] ?? ""}`}>
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRunNow(job.id)}
                      disabled={runningJobId === job.id}
                      title="Spustit teď"
                    >
                      {runningJobId === job.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleToggle(job.id)}
                      title={job.status === "ACTIVE" ? "Pozastavit" : "Aktivovat"}
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEdit(job)}
                      title="Upravit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(job.id)}
                      title="Smazat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                {job.description && (
                  <p className="text-xs text-muted-foreground/60 mb-2">{job.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/50 font-mono">
                  <span>Lokalita: <span className="text-foreground/60">{job.configJson.locality}</span></span>
                  <span>Filtry: <span className="text-foreground/60">{formatFilters(job.configJson)}</span></span>
                  <span>Cron: {job.cronExpr}</span>
                  <span>Poslední běh: {formatLastRun(job.lastRunAt)}</span>
                  <span>{job.resultsCount} výsledků</span>
                  {job.notifyEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" />
                      {job.notifyEmail}
                    </span>
                  )}
                </div>

                {/* Run result */}
                {runResult?.jobId === job.id && (
                  <div className="mt-2 px-3 py-2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs">
                    {runResult.message}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <JobForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingJob={editingJob}
        onSave={handleFormSave}
      />
    </div>
  )
}
