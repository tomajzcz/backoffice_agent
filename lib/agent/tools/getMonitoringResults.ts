import { tool } from "ai"
import { z } from "zod"
import { getMonitoringResultsByJob, getScheduledJobById } from "@/lib/db/queries/monitoring"
import type { GetMonitoringResultsResult } from "@/types/agent"

export const getMonitoringResultsTool = tool({
  description:
    "Vrátí výsledky monitorovacího jobu za posledních N dní. " +
    "Ukazuje nalezené nemovitosti z realitních serverů včetně cen a dispozic.",
  parameters: z.object({
    jobId: z.number().describe("ID monitorovacího jobu"),
    days: z
      .number()
      .min(1)
      .max(90)
      .default(7)
      .describe("Počet dní zpětně (výchozí 7, max 90)"),
  }),
  execute: async ({ jobId, days }): Promise<GetMonitoringResultsResult> => {
    const job = await getScheduledJobById(jobId)

    if (!job) {
      throw new Error(`Monitorovací job s ID ${jobId} nebyl nalezen`)
    }

    const results = await getMonitoringResultsByJob(jobId, days)

    return {
      toolName: "getMonitoringResults",
      jobId: job.id,
      jobName: job.name,
      days,
      totalResults: results.length,
      newResults: results.filter((r) => r.isNew).length,
      results: results.map((r) => ({
        id: r.id,
        source: r.source,
        title: r.title,
        url: r.url,
        price: r.price ? Number(r.price) : null,
        district: r.district,
        disposition: r.disposition,
        foundAt: r.foundAt.toISOString(),
        isNew: r.isNew,
      })),
      chartType: "none",
    }
  },
})
