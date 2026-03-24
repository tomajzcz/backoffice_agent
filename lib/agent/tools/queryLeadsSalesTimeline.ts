import { tool } from "ai"
import { z } from "zod"
import { getLeadsSalesTimeline } from "@/lib/db/queries/leads"
import type { QueryLeadsSalesTimelineResult } from "@/types/agent"

export const queryLeadsSalesTimelineTool = tool({
  description:
    "Vrátí měsíční přehled počtu leadů a prodaných nemovitostí za posledních N měsíců. " +
    "Použij pro dotazy o vývoji leadů, prodejích, trendech, grafech časové osy nebo porovnání měsíců. " +
    "Data jsou vhodná pro line chart zobrazení.",
  parameters: z.object({
    months: z
      .number()
      .int()
      .min(1)
      .max(24)
      .default(6)
      .describe("Počet měsíců zpět, výchozí hodnota je 6. Maximálně 24."),
  }),
  execute: async ({ months }): Promise<QueryLeadsSalesTimelineResult> => {
    const timeline = await getLeadsSalesTimeline(months)

    const totalLeads = timeline.reduce((sum, m) => sum + m.leads, 0)
    const totalConverted = timeline.reduce((sum, m) => sum + m.converted, 0)
    const totalSold = timeline.reduce((sum, m) => sum + m.soldProperties, 0)
    const conversionRate =
      totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0

    return {
      toolName: "queryLeadsSalesTimeline",
      monthsBack: months,
      totalLeads,
      totalSold,
      conversionRate,
      timeline,
      chartType: "line",
      chartData: timeline.map((m) => ({
        name: m.monthLabel,
        leady: m.leads,
        prodeje: m.soldProperties,
      })),
    }
  },
})
