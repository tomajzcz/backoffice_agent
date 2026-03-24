import { tool } from "ai"
import { z } from "zod"
import { createClientQuery } from "@/lib/db/queries/clients"
import { CLIENT_SEGMENT_LABELS as SEGMENT_LABELS } from "@/lib/constants/labels"
import type { CreateClientResult } from "@/types/agent"

export const createClientTool = tool({
  description:
    "Vytvoří nového klienta v systému. " +
    "Vyžaduje jméno, email, zdroj akvizice a segment.",
  parameters: z.object({
    name: z.string().describe("Jméno klienta"),
    email: z.string().email().describe("Email klienta"),
    phone: z.string().optional().describe("Telefon klienta"),
    acquisitionSource: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).describe("Zdroj akvizice"),
    segment: z.enum(["INVESTOR", "PRVNI_KUPUJICI", "UPGRADER", "DOWNGRADER", "PRENAJIMATEL"]).describe("Segment klienta"),
  }),
  execute: async (params): Promise<CreateClientResult> => {
    const client = await createClientQuery(params)

    return {
      toolName: "createClient",
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        segment: client.segment,
        segmentLabel: SEGMENT_LABELS[client.segment] ?? client.segment,
      },
      chartType: "none",
    }
  },
})
