import { tool } from "ai"
import { z } from "zod"
import { createCalendarEvent } from "@/lib/google/calendar"
import { updateShowingQuery } from "@/lib/db/queries/showings"
import type { CreateCalendarEventResult } from "@/types/agent"

export const createCalendarEventTool = tool({
  description:
    "Vytvoří novou událost v Google Kalendáři. " +
    "Použij pro naplánování schůzky, prohlídky nebo jiné události. " +
    "Volitelně propojí událost s existující prohlídkou (showingId).",
  parameters: z.object({
    summary: z.string().describe("Název události (např. 'Prohlídka: Vinohradská 15')"),
    startDateTime: z
      .string()
      .describe("Začátek události ve formátu ISO 8601 (např. 2026-03-28T14:00:00)"),
    endDateTime: z
      .string()
      .optional()
      .describe("Konec události ve formátu ISO 8601. Výchozí: začátek + 60 minut"),
    description: z.string().optional().describe("Popis události"),
    location: z.string().optional().describe("Místo události (adresa)"),
    showingId: z
      .number()
      .int()
      .optional()
      .describe("ID prohlídky, ke které se událost propojí"),
  }),
  execute: async (params): Promise<CreateCalendarEventResult> => {
    const event = await createCalendarEvent({
      summary: params.summary,
      startDateTime: params.startDateTime,
      endDateTime: params.endDateTime,
      description: params.description,
      location: params.location,
    })

    // Link to showing if provided
    if (params.showingId) {
      await updateShowingQuery(params.showingId, {
        googleCalendarEventId: event.id,
      })
    }

    return {
      toolName: "createCalendarEvent",
      event: {
        googleEventId: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location,
        htmlLink: event.htmlLink,
        description: event.description,
      },
      linkedShowingId: params.showingId ?? null,
      chartType: "none",
    }
  },
})
