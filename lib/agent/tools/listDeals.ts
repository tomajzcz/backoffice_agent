import { tool } from "ai"
import { z } from "zod"
import { listDealsQuery } from "@/lib/db/queries/deals"
import { DEAL_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { ListDealsResult } from "@/types/agent"

export const listDealsTool = tool({
  description:
    "Vrátí seznam obchodů s možností filtrování a stránkování. " +
    "Zobrazuje i adresu nemovitosti a jméno klienta.",
  parameters: z.object({
    status: z.enum(["IN_PROGRESS", "CLOSED_WON", "CLOSED_LOST"]).optional().describe("Filtr podle statusu"),
    valueMin: z.number().optional().describe("Minimální hodnota v CZK"),
    valueMax: z.number().optional().describe("Maximální hodnota v CZK"),
    dateFrom: z.string().optional().describe("Datum od (YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("Datum do (YYYY-MM-DD)"),
    clientId: z.number().int().optional().describe("Filtr podle ID klienta"),
    propertyId: z.number().int().optional().describe("Filtr podle ID nemovitosti"),
    limit: z.number().int().min(1).max(100).default(20).describe("Počet záznamů na stránku"),
    offset: z.number().int().min(0).default(0).describe("Přeskočit prvních N záznamů"),
    sortBy: z.enum(["createdAt", "value", "status"]).default("createdAt").describe("Řadit podle"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Směr řazení"),
  }),
  execute: async (params): Promise<ListDealsResult> => {
    const { items, total } = await listDealsQuery(params)

    return {
      toolName: "listDeals",
      totalCount: total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
      deals: items.map((d) => ({
        id: d.id,
        propertyAddress: d.property.address,
        propertyDistrict: d.property.district,
        clientName: d.client.name,
        status: d.status,
        statusLabel: STATUS_LABELS[d.status] ?? d.status,
        value: Number(d.value),
        closedAt: d.closedAt?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
      chartType: "none",
    }
  },
})
