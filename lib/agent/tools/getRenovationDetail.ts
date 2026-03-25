import { tool } from "ai"
import { z } from "zod"
import { getRenovationByIdQuery } from "@/lib/db/queries/renovations"
import {
  RENOVATION_PHASE_LABELS,
  RENOVATION_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants/labels"
import type { GetRenovationDetailResult } from "@/types/agent"

export const getRenovationDetailTool = tool({
  description:
    "Detail konkrétní rekonstrukce včetně rozpočtu, fáze, blokátorů a propojených úkolů.",
  parameters: z.object({
    renovationId: z.number().int().describe("ID rekonstrukce"),
  }),
  execute: async ({ renovationId }): Promise<GetRenovationDetailResult> => {
    const r = await getRenovationByIdQuery(renovationId)

    if (!r) {
      throw new Error(`Rekonstrukce #${renovationId} nenalezena.`)
    }

    const now = new Date()
    const daysInProgress = Math.ceil(
      (now.getTime() - r.startedAt.getTime()) / (1000 * 60 * 60 * 24),
    )

    const budgetPlanned = r.budgetPlanned ? Number(r.budgetPlanned) : null
    const budgetActual = r.budgetActual ? Number(r.budgetActual) : null
    const budgetUtilization =
      budgetPlanned && budgetActual
        ? Math.round((budgetActual / budgetPlanned) * 100)
        : null

    const openStatuses = ["OPEN", "IN_PROGRESS"]
    const openTasks = r.tasks.filter((t) => openStatuses.includes(t.status))
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now)

    return {
      toolName: "getRenovationDetail",
      renovation: {
        id: r.id,
        propertyId: r.propertyId,
        propertyAddress: r.property.address,
        propertyDistrict: r.property.district,
        phase: r.phase,
        phaseLabel: RENOVATION_PHASE_LABELS[r.phase] ?? r.phase,
        status: r.status,
        statusLabel: RENOVATION_STATUS_LABELS[r.status] ?? r.status,
        startedAt: r.startedAt.toISOString(),
        plannedEndAt: r.plannedEndAt?.toISOString() ?? null,
        actualEndAt: r.actualEndAt?.toISOString() ?? null,
        isDelayed: r.isDelayed,
        nextStep: r.nextStep,
        blockers: r.blockers,
        ownerName: r.ownerName,
        contractorName: r.contractorName,
        budgetPlanned,
        budgetActual,
        budgetUtilization,
        notes: r.notes,
        daysInProgress,
        tasks: r.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          statusLabel: TASK_STATUS_LABELS[t.status] ?? t.status,
          priority: t.priority,
          priorityLabel: TASK_PRIORITY_LABELS[t.priority] ?? t.priority,
          dueDate: t.dueDate?.toISOString() ?? null,
          isOverdue:
            openStatuses.includes(t.status) && !!t.dueDate && t.dueDate < now,
          assignee: t.assignee,
        })),
        openTasksCount: openTasks.length,
        overdueTasksCount: overdueTasks.length,
      },
      chartType: "none",
    }
  },
})
