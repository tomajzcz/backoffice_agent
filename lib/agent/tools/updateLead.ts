import { tool } from "ai"
import { z } from "zod"
import { updateLeadQuery } from "@/lib/db/queries/leads"
import { LEAD_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { UpdateLeadResult } from "@/types/agent"

export const updateLeadTool = tool({
  description:
    "Aktualizuje existující lead podle ID. " +
    "Pošli pouze pole, která se mají změnit. Při změně statusu na CONVERTED se automaticky nastaví convertedAt.",
  parameters: z.object({
    leadId: z.number().int().describe("ID leadu k aktualizaci"),
    name: z.string().optional().describe("Nové jméno"),
    email: z.string().email().optional().describe("Nový email"),
    phone: z.string().optional().describe("Nový telefon"),
    source: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).optional().describe("Nový zdroj"),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]).optional().describe("Nový status"),
    propertyInterest: z.string().optional().describe("Nový zájem o nemovitost"),
  }),
  execute: async ({ leadId, ...data }): Promise<UpdateLeadResult> => {
    const updatedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
    const lead = await updateLeadQuery(leadId, data)

    return {
      toolName: "updateLead",
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        statusLabel: STATUS_LABELS[lead.status] ?? lead.status,
      },
      updatedFields,
      chartType: "none",
    }
  },
})
