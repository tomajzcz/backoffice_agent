import { tool } from "ai"
import { z } from "zod"
import { updateDealQuery } from "@/lib/db/queries/deals"
import { DEAL_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { UpdateDealResult } from "@/types/agent"

export const updateDealTool = tool({
  description:
    "Aktualizuje existující obchod podle ID. " +
    "Při změně statusu na CLOSED_WON se automaticky nastaví closedAt.",
  parameters: z.object({
    dealId: z.number().int().describe("ID obchodu k aktualizaci"),
    status: z.enum(["IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST"]).optional().describe("Nový status"),
    value: z.number().positive().optional().describe("Nová hodnota v CZK"),
  }),
  execute: async ({ dealId, ...data }): Promise<UpdateDealResult> => {
    const updatedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
    const deal = await updateDealQuery(dealId, data)

    return {
      toolName: "updateDeal",
      deal: {
        id: deal.id,
        propertyAddress: deal.property.address,
        clientName: deal.client.name,
        status: deal.status,
        statusLabel: STATUS_LABELS[deal.status] ?? deal.status,
        value: Number(deal.value),
      },
      updatedFields,
      chartType: "none",
    }
  },
})
