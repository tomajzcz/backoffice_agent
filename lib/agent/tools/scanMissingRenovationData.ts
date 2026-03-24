import { tool } from "ai"
import { z } from "zod"
import { getMissingRenovationProperties } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS as TYPE_LABELS, PROPERTY_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { ScanMissingRenovationResult } from "@/types/agent"

export const scanMissingRenovationDataTool = tool({
  description:
    "Najde nemovitosti, u kterých chybí data o rekonstrukci (rok poslední rekonstrukce ani poznámky nejsou vyplněny). " +
    "Použij pro operativní scan datové kvality nebo když Pepa chce vědět, které nemovitosti mají neúplný profil. " +
    "Vrátí seznam nemovitostí s přehledem podle čtvrti.",
  parameters: z.object({}),
  execute: async (): Promise<ScanMissingRenovationResult> => {
    const rows = await getMissingRenovationProperties()

    // Aggregate by district
    const districtCounts: Record<string, number> = {}
    for (const p of rows) {
      districtCounts[p.district] = (districtCounts[p.district] ?? 0) + 1
    }

    const byDistrict = Object.entries(districtCounts)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count)

    return {
      toolName: "scanMissingRenovationData",
      totalCount: rows.length,
      properties: rows.map((p) => ({
        id: p.id,
        address: p.address,
        district: p.district,
        type: p.type,
        typeLabel: TYPE_LABELS[p.type] ?? p.type,
        price: p.price,
        status: p.status,
        statusLabel: STATUS_LABELS[p.status] ?? p.status,
        areaM2: p.areaM2,
        yearBuilt: p.yearBuilt,
      })),
      byDistrict,
      chartType: "bar",
      chartData: byDistrict.map((d) => ({ name: d.district, pocet: d.count })),
    }
  },
})
