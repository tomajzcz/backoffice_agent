import { tool } from "ai"
import { z } from "zod"
import { createShowingQuery } from "@/lib/db/queries/showings"
import {
  createCalendarEvent,
  buildShowingEventDescription,
} from "@/lib/google/calendar"
import { sendShowingConfirmationSms } from "@/lib/integrations/twilio"
import { SHOWING_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { CreateShowingResult } from "@/types/agent"

export const createShowingTool = tool({
  description:
    "Naplánuje novou prohlídku nemovitosti. " +
    "Vyžaduje propertyId, clientId a datum/čas prohlídky. " +
    "Automaticky vytvoří událost v Google Kalendáři a pošle klientovi potvrzovací SMS (obojí default true, vypni jen pokud uživatel výslovně nechce).",
  parameters: z.object({
    propertyId: z.number().int().describe("ID nemovitosti"),
    clientId: z.number().int().describe("ID klienta"),
    scheduledAt: z.string().describe("Datum a čas prohlídky (ISO 8601, např. 2026-03-28T14:00:00)"),
    notes: z.string().optional().describe("Poznámky k prohlídce"),
    createCalendarEvent: z
      .boolean()
      .default(true)
      .describe("Vytvořit událost v Google Kalendáři (výchozí: true)"),
    sendSmsConfirmation: z
      .boolean()
      .default(true)
      .describe("Poslat klientovi potvrzovací SMS s detaily prohlídky (výchozí: true)"),
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
    let calendarError: string | undefined

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
        console.error("Nepodařilo se vytvořit událost v kalendáři:", e)
        calendarError = e instanceof Error ? e.message : "Neznámá chyba při vytváření kalendářové události"
      }
    }

    // Send SMS confirmation if requested
    let smsSent = false
    let smsError: string | undefined

    if (params.sendSmsConfirmation) {
      const clientPhone = showing.client.phone
      if (!clientPhone) {
        smsError = "Klient nemá telefonní číslo"
      } else {
        try {
          await sendShowingConfirmationSms({
            clientName: showing.client.name,
            clientPhone,
            propertyAddress: showing.property.address,
            scheduledAt: params.scheduledAt,
          })
          smsSent = true
        } catch (e) {
          console.error("Nepodařilo se odeslat potvrzovací SMS:", e)
          smsError = e instanceof Error ? e.message : "Neznámá chyba při odesílání SMS"
        }
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
        calendarError,
        smsSent,
        smsError,
      },
      chartType: "none",
    }
  },
})
