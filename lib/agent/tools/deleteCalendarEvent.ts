import { tool } from "ai"
import { z } from "zod"
import { deleteCalendarEvent } from "@/lib/google/calendar"
import { getShowingByIdQuery, updateShowingQuery } from "@/lib/db/queries/showings"
import type { DeleteCalendarEventResult } from "@/types/agent"

export const deleteCalendarEventTool = tool({
  description:
    "Smaže/zruší událost v Google Kalendáři. " +
    "Identifikuj přes googleEventId nebo showingId. " +
    "Pokud je propojena s prohlídkou, odkaz na kalendář se automaticky odstraní.",
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
  }),
  execute: async (params): Promise<DeleteCalendarEventResult> => {
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

    await deleteCalendarEvent(eventId)

    // Clear the link from showing
    if (params.showingId) {
      await updateShowingQuery(params.showingId, {
        googleCalendarEventId: null,
      })
    }

    return {
      toolName: "deleteCalendarEvent",
      googleEventId: eventId,
      deleted: true,
      message: "Událost byla úspěšně smazána z kalendáře",
      linkedShowingId,
      chartType: "none",
    }
  },
})
