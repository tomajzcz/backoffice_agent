import { tool } from "ai"
import { z } from "zod"
import { getMonitoringResultsScored, getScheduledJobById } from "@/lib/db/queries/monitoring"
import type { AnalyzeNewListingsResult } from "@/types/agent"

export const analyzeNewListingsTool = tool({
  description:
    "Analyzuje nové nabídky z monitoringu. Počítá průměrnou cenu, cenu za m², " +
    "rozložení podle dispozice a prioritizuje nabídky podle skóre relevance. " +
    "Použij pro přehled trhu a identifikaci nejzajímavějších nabídek pro flip.",
  parameters: z.object({
    jobId: z.number().int().describe("ID monitorovacího jobu"),
    days: z.number().int().min(1).max(90).default(7).describe("Počet dní zpětně (výchozí 7)"),
    minScore: z.number().int().min(0).max(100).optional().describe("Minimální skóre relevance (0–100)"),
  }),
  execute: async ({ jobId, days, minScore }): Promise<AnalyzeNewListingsResult> => {
    const [results, job] = await Promise.all([
      getMonitoringResultsScored(jobId, days, minScore),
      getScheduledJobById(jobId),
    ])

    const jobName = job?.name ?? `Job #${jobId}`

    // Compute market stats
    const pricesOnly = results.filter((r) => r.price !== null).map((r) => Number(r.price))
    const avgPrice = pricesOnly.length > 0
      ? Math.round(pricesOnly.reduce((s, p) => s + p, 0) / pricesOnly.length)
      : 0

    const pricesPerM2 = results
      .filter((r) => r.pricePerM2 !== null)
      .map((r) => Number(r.pricePerM2))
    const avgPricePerM2 = pricesPerM2.length > 0
      ? Math.round(pricesPerM2.reduce((s, p) => s + p, 0) / pricesPerM2.length)
      : 0

    const sortedPrices = [...pricesOnly].sort((a, b) => a - b)
    const medianPrice = sortedPrices.length > 0
      ? sortedPrices[Math.floor(sortedPrices.length / 2)]
      : 0

    // By disposition aggregation
    const dispMap: Record<string, { count: number; totalPrice: number }> = {}
    for (const r of results) {
      const disp = r.disposition ?? "Neuvedeno"
      if (!dispMap[disp]) dispMap[disp] = { count: 0, totalPrice: 0 }
      dispMap[disp].count++
      if (r.price) dispMap[disp].totalPrice += Number(r.price)
    }
    const byDisposition = Object.entries(dispMap).map(([disposition, data]) => ({
      disposition,
      count: data.count,
      avgPrice: data.count > 0 ? Math.round(data.totalPrice / data.count) : 0,
    }))

    const topListings = results.map((r) => ({
      id: r.id,
      source: r.source,
      title: r.title,
      url: r.url,
      price: r.price ? Number(r.price) : null,
      pricePerM2: r.pricePerM2 ? Number(r.pricePerM2) : null,
      district: r.district,
      disposition: r.disposition,
      areaM2: r.areaM2 ? Number(r.areaM2) : null,
      score: r.score ?? 0,
      scoreReason: r.scoreReason,
      foundAt: r.foundAt.toISOString(),
      isNew: r.isNew,
    }))

    // Chart: avg price by disposition
    const chartData = byDisposition.map((d) => ({
      name: d.disposition,
      pocet: Math.round(d.avgPrice / 1000), // in thousands for readability
    }))

    return {
      toolName: "analyzeNewListings",
      jobId,
      jobName,
      days,
      totalResults: results.length,
      marketStats: {
        avgPrice,
        avgPricePerM2,
        priceRange: {
          min: sortedPrices.length > 0 ? sortedPrices[0] : 0,
          max: sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1] : 0,
        },
        medianPrice,
      },
      topListings,
      byDisposition,
      chartType: "bar",
      chartData,
    }
  },
})
