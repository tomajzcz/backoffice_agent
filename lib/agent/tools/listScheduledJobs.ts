import { tool } from "ai"
import { z } from "zod"
import { getScheduledJobs } from "@/lib/db/queries/monitoring"
import { JOB_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { ListScheduledJobsResult } from "@/types/agent"

export const listScheduledJobsTool = tool({
  description:
    "Zobrazí přehled všech naplánovaných monitorovacích jobů. " +
    "Ukazuje stav, cron výraz, čas posledního a příštího běhu, počet výsledků.",
  parameters: z.object({
    status: z
      .enum(["ACTIVE", "PAUSED", "ERROR"])
      .optional()
      .describe("Volitelný filtr podle stavu jobu"),
  }),
  execute: async ({ status }): Promise<ListScheduledJobsResult> => {
    let jobs = await getScheduledJobs()

    if (status) {
      jobs = jobs.filter((j) => j.status === status)
    }

    return {
      toolName: "listScheduledJobs",
      totalJobs: jobs.length,
      jobs: jobs.map((j) => ({
        id: j.id,
        name: j.name,
        description: j.description,
        cronExpr: j.cronExpr,
        status: `${j.status} (${STATUS_LABELS[j.status] ?? j.status})`,
        lastRunAt: j.lastRunAt?.toISOString() ?? null,
        nextRunAt: j.nextRunAt?.toISOString() ?? null,
        resultsCount: j._count.results,
      })),
      chartType: "none",
    }
  },
})
