import { tool } from "ai"
import { z } from "zod"
import { listCalendarEvents } from "@/lib/google/calendar"
import type { ListCalendarEventsResult } from "@/types/agent"

export const listCalendarEventsTool = tool({
  description:
    "Zobrazí seznam událostí v Google Kalendáři za zadané období. " +
    "Vrací všechny naplánované události včetně prohlídek, schůzek apod.",
  parameters: z.object({
    dateRangeStart: z
      .string()
      .describe("Počátek období (ISO 8601, YYYY-MM-DD)"),
    dateRangeEnd: z
      .string()
      .describe("Konec období (ISO 8601, YYYY-MM-DD)"),
    maxResults: z
      .number()
      .int()
      .optional()
      .describe("Maximální počet výsledků (výchozí 50)"),
  }),
  execute: async ({ dateRangeStart, dateRangeEnd, maxResults }): Promise<ListCalendarEventsResult> => {
    const events = await listCalendarEvents(dateRangeStart, dateRangeEnd, maxResults)

    return {
      toolName: "listCalendarEvents",
      dateRangeStart,
      dateRangeEnd,
      totalEvents: events.length,
      events: events.map((e) => ({
        googleEventId: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        location: e.location,
        description: e.description,
        status: e.status,
        htmlLink: e.htmlLink,
      })),
      chartType: "none",
    }
  },
})
