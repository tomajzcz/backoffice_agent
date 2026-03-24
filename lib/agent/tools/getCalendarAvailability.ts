import { tool } from "ai"
import { z } from "zod"
import { getCalendarFreeSlots } from "@/lib/google/calendar"
import type { GetCalendarAvailabilityResult } from "@/types/agent"

export const getCalendarAvailabilityTool = tool({
  description:
    "Zjistí volné termíny v Google Kalendáři pro zadané období. " +
    "Použij pro nalezení vhodných časů na prohlídky nemovitostí nebo schůzky s klienty. " +
    "Vrací volné sloty během pracovní doby (9:00–18:00, Po–Pá).",
  parameters: z.object({
    dateRangeStart: z
      .string()
      .describe("Počátek období ve formátu ISO 8601 (YYYY-MM-DD)"),
    dateRangeEnd: z
      .string()
      .describe("Konec období ve formátu ISO 8601 (YYYY-MM-DD)"),
  }),
  execute: async ({ dateRangeStart, dateRangeEnd }): Promise<GetCalendarAvailabilityResult> => {
    const freeSlots = await getCalendarFreeSlots(dateRangeStart, dateRangeEnd)

    // Group by date
    const byDateMap = new Map<string, { dateLabel: string; count: number }>()
    for (const slot of freeSlots) {
      const existing = byDateMap.get(slot.date)
      if (existing) {
        existing.count++
      } else {
        byDateMap.set(slot.date, { dateLabel: slot.dateLabel, count: 1 })
      }
    }

    const byDate = Array.from(byDateMap.entries()).map(([date, { dateLabel, count }]) => ({
      date,
      dateLabel,
      slotsCount: count,
    }))

    return {
      toolName: "getCalendarAvailability",
      dateRangeStart,
      dateRangeEnd,
      totalFreeSlots: freeSlots.length,
      freeSlots,
      byDate,
      chartType: "bar",
      chartData: byDate.map((d) => ({ name: d.dateLabel, pocet: d.slotsCount })),
    }
  },
})
