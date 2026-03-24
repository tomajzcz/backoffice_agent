import { tool } from "ai"
import { z } from "zod"
import { listShowingsQuery } from "@/lib/db/queries/showings"
import { SHOWING_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { ListShowingsResult } from "@/types/agent"

export const listShowingsTool = tool({
  description:
    "Vrátí seznam prohlídek s možností filtrování a stránkování. " +
    "Zobrazuje i adresu nemovitosti a jméno klienta.",
  parameters: z.object({
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional().describe("Filtr podle statusu"),
    dateFrom: z.string().optional().describe("Datum od (YYYY-MM-DD)"),
    dateTo: z.string().optional().describe("Datum do (YYYY-MM-DD)"),
    propertyId: z.number().int().optional().describe("Filtr podle ID nemovitosti"),
    clientId: z.number().int().optional().describe("Filtr podle ID klienta"),
    limit: z.number().int().min(1).max(100).default(20).describe("Počet záznamů na stránku"),
    offset: z.number().int().min(0).default(0).describe("Přeskočit prvních N záznamů"),
    sortBy: z.enum(["scheduledAt", "status", "createdAt"]).default("scheduledAt").describe("Řadit podle"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Směr řazení"),
  }),
  execute: async (params): Promise<ListShowingsResult> => {
    const { items, total } = await listShowingsQuery(params)

    return {
      toolName: "listShowings",
      totalCount: total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
      showings: items.map((s) => ({
        id: s.id,
        propertyAddress: s.property.address,
        propertyDistrict: s.property.district,
        clientName: s.client.name,
        scheduledAt: s.scheduledAt.toISOString(),
        status: s.status,
        statusLabel: STATUS_LABELS[s.status] ?? s.status,
        notes: s.notes,
        googleCalendarEventId: s.googleCalendarEventId,
      })),
      chartType: "none",
    }
  },
})
