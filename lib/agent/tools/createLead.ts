import { tool } from "ai"
import { z } from "zod"
import { createLeadQuery } from "@/lib/db/queries/leads"
import { LEAD_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { CreateLeadResult } from "@/types/agent"

export const createLeadTool = tool({
  description:
    "Vytvoří nový lead v systému. " +
    "Vyžaduje jméno, email a zdroj. Status je defaultně NEW.",
  parameters: z.object({
    name: z.string().describe("Jméno leadu"),
    email: z.string().email().describe("Email leadu"),
    phone: z.string().optional().describe("Telefon"),
    source: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).describe("Zdroj leadu"),
    propertyInterest: z.string().optional().describe("Zájem o typ nemovitosti"),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]).optional().describe("Status (default: NEW)"),
  }),
  execute: async (params): Promise<CreateLeadResult> => {
    const lead = await createLeadQuery(params)

    return {
      toolName: "createLead",
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        statusLabel: STATUS_LABELS[lead.status] ?? lead.status,
      },
      chartType: "none",
    }
  },
})
