import { tool } from "ai"
import { z } from "zod"
import { listClientsQuery } from "@/lib/db/queries/clients"
import { ACQUISITION_SOURCE_LABELS as SOURCE_LABELS, CLIENT_SEGMENT_LABELS as SEGMENT_LABELS } from "@/lib/constants/labels"
import type { ListClientsResult } from "@/types/agent"

export const listClientsTool = tool({
  description:
    "Vrátí seznam klientů s možností filtrování a stránkování. " +
    "Použij pro výpis všech klientů nebo filtrování podle segmentu, zdroje akvizice nebo jména.",
  parameters: z.object({
    segment: z.enum(["INVESTOR", "PRVNI_KUPUJICI", "UPGRADER", "DOWNGRADER", "PRENAJIMATEL"]).optional().describe("Filtr podle segmentu"),
    acquisitionSource: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).optional().describe("Filtr podle zdroje akvizice"),
    search: z.string().optional().describe("Hledání ve jméně nebo emailu"),
    limit: z.number().int().min(1).max(100).default(20).describe("Počet záznamů na stránku"),
    offset: z.number().int().min(0).default(0).describe("Přeskočit prvních N záznamů"),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt").describe("Řadit podle"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Směr řazení"),
  }),
  execute: async (params): Promise<ListClientsResult> => {
    const { items, total } = await listClientsQuery(params)

    return {
      toolName: "listClients",
      totalCount: total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
      clients: items.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        acquisitionSource: c.acquisitionSource,
        sourceLabel: SOURCE_LABELS[c.acquisitionSource] ?? c.acquisitionSource,
        segment: c.segment,
        segmentLabel: SEGMENT_LABELS[c.segment] ?? c.segment,
        createdAt: c.createdAt.toISOString(),
      })),
      chartType: "none",
    }
  },
})
