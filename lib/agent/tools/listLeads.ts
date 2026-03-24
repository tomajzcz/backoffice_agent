import { tool } from "ai"
import { z } from "zod"
import { listLeadsQuery } from "@/lib/db/queries/leads"
import { ACQUISITION_SOURCE_LABELS as SOURCE_LABELS, LEAD_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { ListLeadsResult } from "@/types/agent"

export const listLeadsTool = tool({
  description:
    "Vrátí seznam leadů s možností filtrování a stránkování. " +
    "Použij pro výpis všech leadů nebo filtrování podle zdroje, statusu, data nebo jména.",
  parameters: z.object({
    source: z.enum(["SREALITY", "BEZREALITKY", "DOPORUCENI", "WEB", "INZERCE", "LINKEDIN"]).optional().describe("Filtr podle zdroje"),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]).optional().describe("Filtr podle statusu"),
    dateFrom: z.string().optional().describe("Datum od (YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("Datum do (YYYY-MM-DD)"),
    search: z.string().optional().describe("Hledání ve jméně nebo emailu"),
    limit: z.number().int().min(1).max(100).default(20).describe("Počet záznamů na stránku"),
    offset: z.number().int().min(0).default(0).describe("Přeskočit prvních N záznamů"),
    sortBy: z.enum(["createdAt", "name", "status"]).default("createdAt").describe("Řadit podle"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Směr řazení"),
  }),
  execute: async (params): Promise<ListLeadsResult> => {
    const { items, total } = await listLeadsQuery(params)

    return {
      toolName: "listLeads",
      totalCount: total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
      leads: items.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        sourceLabel: SOURCE_LABELS[l.source] ?? l.source,
        status: l.status,
        statusLabel: STATUS_LABELS[l.status] ?? l.status,
        propertyInterest: l.propertyInterest,
        createdAt: l.createdAt.toISOString(),
        convertedAt: l.convertedAt?.toISOString() ?? null,
      })),
      chartType: "none",
    }
  },
})
