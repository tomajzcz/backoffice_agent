import { tool } from "ai"
import { z } from "zod"
import { updateShowingQuery, getShowingByIdQuery } from "@/lib/db/queries/showings"
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google/calendar"
import { SHOWING_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { UpdateShowingResult } from "@/types/agent"

export const updateShowingTool = tool({
  description:
    "Aktualizuje existující prohlídku podle ID. " +
    "Lze změnit status, datum/čas nebo poznámky. " +
    "Pokud je prohlídka propojená s Google Kalendářem, změny se automaticky synchronizují. " +
    "Při zrušení (CANCELLED) se kalendářová událost automaticky smaže.",
  parameters: z.object({
    showingId: z.number().int().describe("ID prohlídky k aktualizaci"),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional().describe("Nový status"),
    scheduledAt: z.string().optional().describe("Nový datum a čas (ISO 8601)"),
    notes: z.string().optional().describe("Nové poznámky"),
  }),
  execute: async ({ showingId, ...data }): Promise<UpdateShowingResult> => {
    // Fetch current showing to check for calendar link
    const current = await getShowingByIdQuery(showingId)
    if (!current) throw new Error(`Prohlídka s ID ${showingId} neexistuje`)

    const updatedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)

    // Prepare DB update data
    const dbUpdateData: Parameters<typeof updateShowingQuery>[1] = { ...data }

    // Sync with Google Calendar if linked
    if (current.googleCalendarEventId) {
      try {
        if (data.status === "CANCELLED") {
          // Delete calendar event on cancellation
          await deleteCalendarEvent(current.googleCalendarEventId)
          dbUpdateData.googleCalendarEventId = null
        } else if (data.scheduledAt) {
          // Update calendar event time
          await updateCalendarEvent(current.googleCalendarEventId, {
            startDateTime: data.scheduledAt,
          })
        }
      } catch (e) {
        // Calendar sync failed — continue with DB update
        console.error("Synchronizace s kalendářem se nezdařila:", e)
      }
    }

    const showing = await updateShowingQuery(showingId, dbUpdateData)

    return {
      toolName: "updateShowing",
      showing: {
        id: showing.id,
        propertyAddress: showing.property.address,
        clientName: showing.client.name,
        scheduledAt: showing.scheduledAt.toISOString(),
        status: showing.status,
        statusLabel: STATUS_LABELS[showing.status] ?? showing.status,
        googleCalendarEventId: showing.googleCalendarEventId,
      },
      updatedFields,
      chartType: "none",
    }
  },
})
