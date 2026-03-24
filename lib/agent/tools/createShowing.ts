import { tool } from "ai"
import { z } from "zod"
import { createShowingQuery } from "@/lib/db/queries/showings"
import {
  createCalendarEvent,
  buildShowingEventDescription,
} from "@/lib/google/calendar"
import { SHOWING_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { CreateShowingResult } from "@/types/agent"

export const createShowingTool = tool({
  description:
    "Naplánuje novou prohlídku nemovitosti. " +
    "Vyžaduje propertyId, clientId a datum/čas prohlídky. " +
    "Pokud createCalendarEvent je true, automaticky vytvoří událost v Google Kalendáři.",
  parameters: z.object({
    propertyId: z.number().int().describe("ID nemovitosti"),
    clientId: z.number().int().describe("ID klienta"),
    scheduledAt: z.string().describe("Datum a čas prohlídky (ISO 8601, např. 2026-03-28T14:00:00)"),
    notes: z.string().optional().describe("Poznámky k prohlídce"),
    createCalendarEvent: z
      .boolean()
      .optional()
      .describe("Vytvořit událost v Google Kalendáři (výchozí: false)"),
  }),
  execute: async (params): Promise<CreateShowingResult> => {
    // Create showing in DB first
    const showing = await createShowingQuery({
      propertyId: params.propertyId,
      clientId: params.clientId,
      scheduledAt: params.scheduledAt,
      notes: params.notes,
    })

    let calendarEventId: string | null = null

    // Create Google Calendar event if requested
    if (params.createCalendarEvent) {
      try {
        const description = buildShowingEventDescription(
          showing.property.address,
          showing.client.name,
          params.notes,
        )
        const event = await createCalendarEvent({
          summary: `Prohlídka: ${showing.property.address} – ${showing.client.name}`,
          startDateTime: params.scheduledAt,
          description,
          location: showing.property.address,
        })
        calendarEventId = event.id

        // Update showing with calendar event ID
        const { updateShowingQuery } = await import("@/lib/db/queries/showings")
        await updateShowingQuery(showing.id, {
          googleCalendarEventId: event.id,
        })
      } catch (e) {
        // Calendar creation failed, but showing was created — continue with warning
        console.error("Nepodařilo se vytvořit událost v kalendáři:", e)
      }
    }

    return {
      toolName: "createShowing",
      showing: {
        id: showing.id,
        propertyAddress: showing.property.address,
        clientName: showing.client.name,
        scheduledAt: showing.scheduledAt.toISOString(),
        status: showing.status,
        statusLabel: STATUS_LABELS[showing.status] ?? showing.status,
        googleCalendarEventId: calendarEventId,
      },
      chartType: "none",
    }
  },
})
