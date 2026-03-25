import { tool } from "ai"
import { z } from "zod"
import { getOverdueTasks, getUpcomingTasks } from "@/lib/db/queries/tasks"
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants/labels"
import type { ScanOverdueTasksResult } from "@/types/agent"

export const scanOverdueTasksTool = tool({
  description:
    "Najde všechny úkoly po termínu a blížící se úkoly. " +
    "Zobrazí prošlé úkoly (dueDate < dnes, stav OPEN/IN_PROGRESS) a úkoly blížící se termínu. " +
    "Použij pro kontrolu nesplněných úkolů a deadline.",
  parameters: z.object({
    includeDueSoon: z.number().int().min(1).max(14).default(3)
      .describe("Kolik dní dopředu zahrnout jako 'blížící se' (výchozí 3)"),
  }),
  execute: async ({ includeDueSoon }): Promise<ScanOverdueTasksResult> => {
    const now = new Date()
    const [overdue, upcoming] = await Promise.all([
      getOverdueTasks(),
      getUpcomingTasks(includeDueSoon),
    ])

    const overdueTasks = overdue.map((t) => {
      const daysOverdue = Math.ceil((now.getTime() - t.dueDate!.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        priorityLabel: TASK_PRIORITY_LABELS[t.priority] ?? t.priority,
        dueDate: t.dueDate!.toISOString(),
        daysOverdue,
        status: t.status,
        statusLabel: TASK_STATUS_LABELS[t.status] ?? t.status,
        assignee: t.assignee,
        propertyAddress: t.property?.address ?? null,
        propertyId: t.propertyId,
        dealId: t.dealId,
      }
    })

    const dueSoonTasks = upcoming.map((t) => {
      const daysUntilDue = Math.ceil((t.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: t.id,
        title: t.title,
        priority: t.priority,
        priorityLabel: TASK_PRIORITY_LABELS[t.priority] ?? t.priority,
        dueDate: t.dueDate!.toISOString(),
        daysUntilDue,
        assignee: t.assignee,
        propertyAddress: t.property?.address ?? null,
      }
    })

    // Aggregate by priority (overdue only)
    const priorityCounts: Record<string, number> = {}
    for (const t of overdueTasks) {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1
    }

    const byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      priorityLabel: TASK_PRIORITY_LABELS[priority] ?? priority,
      count,
    }))

    const chartData = byPriority.map((p) => ({
      name: p.priorityLabel,
      pocet: p.count,
    }))

    return {
      toolName: "scanOverdueTasks",
      totalOverdue: overdueTasks.length,
      totalDueSoon: dueSoonTasks.length,
      overdueTasks,
      dueSoonTasks,
      byPriority,
      chartType: "bar",
      chartData,
    }
  },
})
