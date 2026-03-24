import { tool } from "ai"
import { z } from "zod"
import { getNewClientsByQuarter } from "@/lib/db/queries/clients"
import { ACQUISITION_SOURCE_LABELS as SOURCE_LABELS, CLIENT_SEGMENT_LABELS as SEGMENT_LABELS } from "@/lib/constants/labels"
import type { QueryNewClientsResult } from "@/types/agent"

export const queryNewClientsTool = tool({
  description:
    "Vrátí seznam nových klientů za daný rok a kvartál (Q1–Q4) včetně breakdownu podle zdroje akvizice. " +
    "Použij tento tool pro jakýkoliv dotaz o nových klientech, počtu klientů nebo zdrojích akvizice. " +
    "Vrací strukturovaná data vhodná pro grafické zobrazení.",
  parameters: z.object({
    year: z
      .number()
      .int()
      .min(2020)
      .max(2030)
      .describe("Rok, pro který hledáme klienty, např. 2025"),
    quarter: z
      .number()
      .int()
      .min(1)
      .max(4)
      .describe("Kvartál: 1 = leden–březen, 2 = duben–červen, 3 = červenec–září, 4 = říjen–prosinec"),
  }),
  execute: async ({ year, quarter }): Promise<QueryNewClientsResult> => {
    const rows = await getNewClientsByQuarter(year, quarter)

    // Aggregate by source
    const sourceCounts: Record<string, number> = {}
    for (const client of rows) {
      sourceCounts[client.acquisitionSource] =
        (sourceCounts[client.acquisitionSource] ?? 0) + 1
    }

    const total = rows.length

    const bySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        sourceLabel: SOURCE_LABELS[source] ?? source,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const QUARTER_NAMES = ["Q1", "Q2", "Q3", "Q4"]
    const period = `${QUARTER_NAMES[quarter - 1]} ${year}`

    return {
      toolName: "queryNewClients",
      totalClients: total,
      period,
      bySource,
      clients: rows.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        source: c.acquisitionSource,
        sourceLabel: SOURCE_LABELS[c.acquisitionSource] ?? c.acquisitionSource,
        segment: c.segment,
        segmentLabel: SEGMENT_LABELS[c.segment] ?? c.segment,
        createdAt: c.createdAt.toISOString(),
      })),
      chartType: "bar",
      chartData: bySource.map((s) => ({
        name: s.sourceLabel,
        pocet: s.count,
      })),
    }
  },
})
