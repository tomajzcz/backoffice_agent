import { tool } from "ai"
import { z } from "zod"
import { updateCalendarEvent } from "@/lib/google/calendar"
import { getShowingByIdQuery, updateShowingQuery } from "@/lib/db/queries/showings"
import type { UpdateCalendarEventResult } from "@/types/agent"

export const updateCalendarEventTool = tool({
  description:
    "Aktualizuje existující událost v Google Kalendáři. " +
    "Identifikuj událost buď přes googleEventId, nebo showingId (prohlídka propojená s kalendářem). " +
    "Pokud měníš čas přes showingId, automaticky se aktualizuje i prohlídka v databázi.",
  parameters: z.object({
    googleEventId: z
      .string()
      .optional()
      .describe("Google Calendar event ID"),
    showingId: z
      .number()
      .int()
      .optional()
      .describe("ID prohlídky — událost se dohledá automaticky"),
    summary: z.string().optional().describe("Nový název události"),
    startDateTime: z
      .string()
      .optional()
      .describe("Nový začátek události (ISO 8601)"),
    endDateTime: z
      .string()
      .optional()
      .describe("Nový konec události (ISO 8601)"),
    location: z.string().optional().describe("Nové místo události"),
    description: z.string().optional().describe("Nový popis události"),
  }),
  execute: async (params): Promise<UpdateCalendarEventResult> => {
    let eventId = params.googleEventId
    let linkedShowingId: number | null = params.showingId ?? null

    // Resolve event ID from showing
    if (!eventId && params.showingId) {
      const showing = await getShowingByIdQuery(params.showingId)
      if (!showing) throw new Error(`Prohlídka s ID ${params.showingId} neexistuje`)
      if (!showing.googleCalendarEventId) {
        throw new Error(`Prohlídka ${params.showingId} nemá propojenou kalendářovou událost`)
      }
      eventId = showing.googleCalendarEventId
    }

    if (!eventId) {
      throw new Error("Musíš zadat googleEventId nebo showingId")
    }

    const updatedFields: string[] = []
    if (params.summary) updatedFields.push("summary")
    if (params.startDateTime) updatedFields.push("startDateTime")
    if (params.endDateTime) updatedFields.push("endDateTime")
    if (params.location) updatedFields.push("location")
    if (params.description) updatedFields.push("description")

    const event = await updateCalendarEvent(eventId, {
      summary: params.summary,
      startDateTime: params.startDateTime,
      endDateTime: params.endDateTime,
      location: params.location,
      description: params.description,
    })

    // Sync scheduledAt back to showing if time changed
    if (params.showingId && params.startDateTime) {
      await updateShowingQuery(params.showingId, {
        scheduledAt: params.startDateTime,
      })
    }

    return {
      toolName: "updateCalendarEvent",
      event: {
        googleEventId: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location,
      },
      updatedFields,
      linkedShowingId,
      chartType: "none",
    }
  },
})
