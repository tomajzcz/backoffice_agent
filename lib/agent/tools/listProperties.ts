import { tool } from "ai"
import { z } from "zod"
import { listPropertiesQuery } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS as TYPE_LABELS, PROPERTY_STATUS_LABELS as STATUS_LABELS, LIFECYCLE_STAGE_LABELS } from "@/lib/constants/labels"
import type { ListPropertiesResult } from "@/types/agent"

export const listPropertiesTool = tool({
  description:
    "Vrátí seznam nemovitostí s možností filtrování a stránkování. " +
    "Použij pro výpis všech nemovitostí nebo filtrování podle čtvrti, typu, statusu, ceny či plochy.",
  parameters: z.object({
    district: z.string().optional().describe("Filtr podle čtvrti (např. Holešovice)"),
    type: z.enum(["BYT", "DUM", "POZEMEK", "KOMERCNI"]).optional().describe("Typ nemovitosti"),
    status: z.enum(["AVAILABLE", "IN_NEGOTIATION", "SOLD", "RENTED", "WITHDRAWN"]).optional().describe("Status nemovitosti"),
    lifecycleStage: z.enum(["ACQUISITION", "IN_RENOVATION", "READY_FOR_SALE", "LISTED", "SOLD"]).optional().describe("Fáze životního cyklu"),
    priceMin: z.number().optional().describe("Minimální cena v CZK"),
    priceMax: z.number().optional().describe("Maximální cena v CZK"),
    areaMin: z.number().optional().describe("Minimální plocha v m²"),
    areaMax: z.number().optional().describe("Maximální plocha v m²"),
    search: z.string().optional().describe("Hledání v adrese"),
    limit: z.number().int().min(1).max(100).default(20).describe("Počet záznamů na stránku"),
    offset: z.number().int().min(0).default(0).describe("Přeskočit prvních N záznamů"),
    sortBy: z.enum(["createdAt", "price", "areaM2", "district"]).default("createdAt").describe("Řadit podle"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Směr řazení"),
  }),
  execute: async (params): Promise<ListPropertiesResult> => {
    const { items, total } = await listPropertiesQuery(params)

    return {
      toolName: "listProperties",
      totalCount: total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
      properties: items.map((p) => ({
        id: p.id,
        address: p.address,
        district: p.district,
        type: p.type,
        typeLabel: TYPE_LABELS[p.type] ?? p.type,
        price: Number(p.price),
        status: p.status,
        statusLabel: STATUS_LABELS[p.status] ?? p.status,
        lifecycleStage: p.lifecycleStage,
        lifecycleStageLabel: p.lifecycleStage
          ? (LIFECYCLE_STAGE_LABELS[p.lifecycleStage] ?? p.lifecycleStage)
          : null,
        areaM2: Number(p.areaM2),
        disposition: p.disposition,
        yearBuilt: p.yearBuilt,
        ownerName: p.owner?.name ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      chartType: "none",
    }
  },
})
