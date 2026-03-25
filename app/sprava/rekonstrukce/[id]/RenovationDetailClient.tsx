"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, User, Wrench, Calendar, Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  RENOVATION_PHASE_LABELS,
  RENOVATION_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  STATUS_COLORS,
} from "@/lib/constants/labels"
import { formatCZK } from "@/lib/utils"
import {
  updateRenovationAction,
  deleteRenovationAction,
  createTaskAction,
} from "../../actions"
import { RenovationForm } from "../../components/RenovationForm"
import { DeleteConfirmDialog } from "../../components/DeleteConfirmDialog"
import { TaskForm } from "../../components/TaskForm"

const ALL_PHASES = [
  "PLANNING",
  "DEMOLITION",
  "ROUGH_WORK",
  "INSTALLATIONS",
  "SURFACES",
  "FINISHING",
  "READY_FOR_HANDOVER",
  "COMPLETED",
] as const

interface RenovationData {
  id: number
  propertyId: number
  propertyAddress: string
  propertyDistrict: string
  propertyType: string
  propertyDisposition: string | null
  phase: string
  status: string
  startedAt: string
  plannedEndAt: string | null
  actualEndAt: string | null
  isDelayed: boolean
  nextStep: string | null
  blockers: string | null
  ownerName: string | null
  contractorName: string | null
  budgetPlanned: number | null
  budgetActual: number | null
  notes: string | null
  tasks: Array<{
    id: number
    title: string
    status: string
    priority: string
    dueDate: string | null
    assignee: string | null
    isOverdue: boolean
  }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function Badge({ value, labelMap }: { value: string; labelMap: Record<string, string> }) {
  const label = labelMap[value] ?? value
  const color = STATUS_COLORS[value] ?? "text-muted-foreground border-border/40 bg-secondary/40"
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] border font-mono ${color}`}>
      {label}
    </span>
  )
}

function InfoCard({ icon: Icon, label, value, className }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null | undefined
  className?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono">{label}</p>
        <p className={`text-sm ${className ?? (value ? "text-foreground/80" : "text-muted-foreground/30")}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  )
}

export function RenovationDetailClient({ renovation }: { renovation: RenovationData }) {
  const router = useRouter()

  // Dialog states
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const daysInProgress = Math.ceil(
    (new Date().getTime() - new Date(renovation.startedAt).getTime()) / (1000 * 60 * 60 * 24),
  )

  const budgetUtilization =
    renovation.budgetPlanned && renovation.budgetActual
      ? Math.round((renovation.budgetActual / renovation.budgetPlanned) * 100)
      : null

  const openTasks = renovation.tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
  const overdueTasks = renovation.tasks.filter((t) => t.isOverdue)

  // Warnings
  const warnings: Array<{ text: string; severity: "high" | "medium" | "low" }> = []
  if (renovation.isDelayed) warnings.push({ text: "Rekonstrukce je po plánovaném termínu", severity: "high" })
  if (overdueTasks.length > 0) warnings.push({ text: `${overdueTasks.length} úkolů po termínu`, severity: "high" })
  if (budgetUtilization && budgetUtilization > 100) warnings.push({ text: `Rozpočet přečerpán na ${budgetUtilization}%`, severity: "high" })
  if (!renovation.contractorName) warnings.push({ text: "Chybí dodavatel", severity: "medium" })
  if (!renovation.nextStep) warnings.push({ text: "Chybí další krok", severity: "low" })
  if (openTasks.length === 0 && renovation.status === "ACTIVE") warnings.push({ text: "Žádné otevřené úkoly", severity: "low" })

  const currentPhaseIndex = ALL_PHASES.indexOf(renovation.phase as typeof ALL_PHASES[number])

  async function handleAdvancePhase() {
    if (currentPhaseIndex < 0 || currentPhaseIndex >= ALL_PHASES.length - 1) return
    const nextPhase = ALL_PHASES[currentPhaseIndex + 1]
    await updateRenovationAction(renovation.id, { phase: nextPhase })
    router.refresh()
  }

  async function handleEditSave(data: Record<string, unknown>) {
    const result = await updateRenovationAction(renovation.id, data)
    if (result.success) {
      setEditOpen(false)
      router.refresh()
    }
  }

  async function handleDelete() {
    setActionLoading(true)
    const result = await deleteRenovationAction(renovation.id)
    setActionLoading(false)
    if (result.success) {
      setDeleteOpen(false)
      router.push("/sprava")
    }
  }

  async function handleTaskSave(data: Record<string, unknown>) {
    const result = await createTaskAction({
      title: data.title as string,
      description: data.description as string | undefined,
      priority: (data.priority as string) ?? "MEDIUM",
      status: data.status as string | undefined,
      dueDate: data.dueDate as string | undefined,
      assignee: data.assignee as string | undefined,
      propertyId: renovation.propertyId,
      renovationId: renovation.id,
    })
    if (result.success) {
      setTaskFormOpen(false)
      router.refresh()
    }
  }

  // Map renovation to editingRecord format for the form
  const editingRecord: Record<string, unknown> = {
    id: renovation.id,
    propertyId: renovation.propertyId,
    phase: renovation.phase,
    status: renovation.status,
    plannedEndAt: renovation.plannedEndAt,
    nextStep: renovation.nextStep,
    blockers: renovation.blockers,
    ownerName: renovation.ownerName,
    contractorName: renovation.contractorName,
    budgetPlanned: renovation.budgetPlanned,
    budgetActual: renovation.budgetActual,
    notes: renovation.notes,
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/sprava"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary/80 transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Zpět na správu dat
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              {renovation.propertyAddress}
            </h1>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {renovation.propertyDistrict} · Rekonstrukce #{renovation.id} · {daysInProgress} dní
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge value={renovation.phase} labelMap={RENOVATION_PHASE_LABELS} />
            <Badge value={renovation.status} labelMap={RENOVATION_STATUS_LABELS} />
            {renovation.isDelayed && (
              <span className="px-2 py-0.5 rounded text-[11px] border font-mono text-red-400 border-red-500/20 bg-red-500/10">
                Zpožděno
              </span>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs ml-2" onClick={() => setEditOpen(true)}>
              <Pencil className="w-3 h-3 mr-1" />
              Upravit
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 hover:text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                w.severity === "high"
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : w.severity === "medium"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-border/40 bg-secondary/20 text-muted-foreground/70"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {w.text}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Overview */}
        <div className="lg:col-span-2 rounded-xl border border-border/40 bg-secondary/10 px-5 py-4 space-y-4">
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
            Přehled
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <InfoCard icon={Calendar} label="Zahájeno" value={formatDate(renovation.startedAt)} />
            <InfoCard
              icon={Calendar}
              label="Plán. dokončení"
              value={renovation.plannedEndAt ? formatDate(renovation.plannedEndAt) : null}
              className={renovation.isDelayed ? "text-red-400 font-medium" : undefined}
            />
            <InfoCard icon={User} label="Vlastník" value={renovation.ownerName} />
            <InfoCard icon={Wrench} label="Dodavatel" value={renovation.contractorName} />
          </div>
          {renovation.nextStep && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono mb-1">Další krok</p>
              <p className="text-sm text-foreground/80">{renovation.nextStep}</p>
            </div>
          )}
          {renovation.blockers && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-400/70 font-mono mb-1">Blokátory</p>
              <p className="text-sm text-red-400/90">{renovation.blockers}</p>
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4">
          <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Rozpočet
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono">Plánovaný</p>
              <p className="text-sm font-mono text-amber-400">
                {renovation.budgetPlanned ? formatCZK(renovation.budgetPlanned) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono">Skutečný</p>
              <p className={`text-sm font-mono ${budgetUtilization && budgetUtilization > 100 ? "text-red-400" : "text-amber-400"}`}>
                {renovation.budgetActual ? formatCZK(renovation.budgetActual) : "—"}
              </p>
            </div>
            {budgetUtilization !== null && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono mb-1">Čerpání</p>
                <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetUtilization > 100 ? "bg-red-500" : budgetUtilization > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  />
                </div>
                <p className={`text-xs font-mono mt-1 ${budgetUtilization > 100 ? "text-red-400" : "text-muted-foreground/60"}`}>
                  {budgetUtilization}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
            Postup fází
          </h2>
          {renovation.status === "ACTIVE" && currentPhaseIndex >= 0 && currentPhaseIndex < ALL_PHASES.length - 1 && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleAdvancePhase}>
              Další fáze →
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {ALL_PHASES.map((phase, i) => {
            const isActive = phase === renovation.phase
            const isPast = i < currentPhaseIndex
            const isFuture = i > currentPhaseIndex
            return (
              <div key={phase} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-2 rounded-full ${
                    isActive
                      ? "bg-primary"
                      : isPast
                        ? "bg-emerald-500/60"
                        : isFuture
                          ? "bg-secondary/50"
                          : "bg-secondary/50"
                  }`}
                />
                <span
                  className={`text-[9px] font-mono text-center leading-tight ${
                    isActive
                      ? "text-primary font-medium"
                      : isPast
                        ? "text-emerald-400/60"
                        : "text-muted-foreground/30"
                  }`}
                >
                  {RENOVATION_PHASE_LABELS[phase]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>
            Úkoly ({openTasks.length} otevřených{overdueTasks.length > 0 ? `, ${overdueTasks.length} po termínu` : ""})
          </h2>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTaskFormOpen(true)}>
            <Plus className="w-3 h-3 mr-1" />
            Přidat úkol
          </Button>
        </div>
        {renovation.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground/40 py-4 text-center">Žádné úkoly</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Název", "Status", "Priorita", "Termín", "Zodpovědný"].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renovation.tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b border-border/20 ${
                      task.isOverdue
                        ? "bg-red-500/8"
                        : ""
                    }`}
                  >
                    <td className="py-2 pr-3 text-foreground/85 font-medium">{task.title}</td>
                    <td className="py-2 pr-3">
                      <Badge value={task.status} labelMap={TASK_STATUS_LABELS} />
                    </td>
                    <td className="py-2 pr-3">
                      <Badge value={task.priority} labelMap={TASK_PRIORITY_LABELS} />
                    </td>
                    <td className={`py-2 pr-3 font-mono text-muted-foreground/60 ${task.isOverdue ? "text-red-400" : ""}`}>
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                      {task.isOverdue && (
                        <span className="ml-1 text-red-400">!</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground/60">{task.assignee ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {renovation.notes && (
        <div className="rounded-xl border border-border/40 bg-secondary/10 px-5 py-4">
          <h2 className="text-sm font-semibold mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Poznámky
          </h2>
          <p className="text-sm text-foreground/70 whitespace-pre-wrap">{renovation.notes}</p>
        </div>
      )}

      {/* Edit Renovation Dialog */}
      <RenovationForm
        open={editOpen}
        onOpenChange={setEditOpen}
        editingRecord={editingRecord}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={actionLoading}
      />

      {/* Add Task Dialog */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        editingRecord={null}
        onSave={handleTaskSave}
        hidePropertyDeal
      />
    </div>
  )
}
