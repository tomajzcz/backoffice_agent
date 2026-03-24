import { tool } from "ai"
import { z } from "zod"
import { updateClientQuery } from "@/lib/db/queries/clients"
import { CLIENT_SEGMENT_LABELS as SEGMENT_LABELS } from "@/lib/constants/labels"
import type { UpdateClientResult } from "@/types/agent"

export const updateClientTool = tool({
  description:
    "Aktualizuje existujícího klienta podle ID. " +
    "Pošli pouze pole, která se mají změnit.",
  parameters: z.object({
    clientId: z.number().int().describe("ID klienta k aktualizaci"),
    name: z.string().optional().describe("Nové jméno"),
    email: z.string().email().optional().describe("Nový email"),
    phone: z.string().optional().describe("Nový telefon"),
    acquisitionSource: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).optional().describe("Nový zdroj akvizice"),
    segment: z.enum(["INVESTOR", "PRVNI_KUPUJICI", "UPGRADER", "DOWNGRADER", "PRENAJIMATEL"]).optional().describe("Nový segment"),
  }),
  execute: async ({ clientId, ...data }): Promise<UpdateClientResult> => {
    const updatedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
    const client = await updateClientQuery(clientId, data)

    return {
      toolName: "updateClient",
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        segment: client.segment,
        segmentLabel: SEGMENT_LABELS[client.segment] ?? client.segment,
      },
      updatedFields,
      chartType: "none",
    }
  },
})
