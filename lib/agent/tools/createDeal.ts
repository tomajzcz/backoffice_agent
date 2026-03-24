import { tool } from "ai"
import { z } from "zod"
import { createDealQuery } from "@/lib/db/queries/deals"
import { DEAL_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { CreateDealResult } from "@/types/agent"

export const createDealTool = tool({
  description:
    "Vytvoří nový obchod v systému. " +
    "Vyžaduje propertyId, clientId a hodnotu. Status je defaultně IN_PROGRESS.",
  parameters: z.object({
    propertyId: z.number().int().describe("ID nemovitosti"),
    clientId: z.number().int().describe("ID klienta"),
    value: z.number().positive().describe("Hodnota obchodu v CZK"),
    status: z.enum(["IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST"]).optional().describe("Status (default: IN_PROGRESS)"),
  }),
  execute: async (params): Promise<CreateDealResult> => {
    const deal = await createDealQuery(params)

    return {
      toolName: "createDeal",
      deal: {
        id: deal.id,
        propertyAddress: deal.property.address,
        clientName: deal.client.name,
        status: deal.status,
        statusLabel: STATUS_LABELS[deal.status] ?? deal.status,
        value: Number(deal.value),
      },
      chartType: "none",
    }
  },
})
