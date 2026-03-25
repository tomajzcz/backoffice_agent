import { tool } from "ai"
import { z } from "zod"
import { getPropertiesWithCosts } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS, LIFECYCLE_STAGE_LABELS } from "@/lib/constants/labels"
import type { CalculatePropertyProfitabilityResult } from "@/types/agent"

export const calculatePropertyProfitabilityTool = tool({
  description:
    "Vypočítá ziskovost nemovitostí na základě nákupní ceny, nákladů na rekonstrukci a očekávané prodejní ceny. " +
    "Vrátí přehled s ROI a potenciálním ziskem. Použij pro investiční analýzy a porovnání výnosnosti.",
  parameters: z.object({
    propertyId: z.number().int().optional()
      .describe("ID konkrétní nemovitosti (volitelné, bez něj vrátí všechny s vyplněnými náklady)"),
    district: z.string().optional().describe("Filtrovat podle čtvrti"),
    minROI: z.number().optional().describe("Minimální ROI v % pro filtrování"),
  }),
  execute: async ({ propertyId, district, minROI }): Promise<CalculatePropertyProfitabilityResult> => {
    const rawProperties = await getPropertiesWithCosts({ propertyId, district })

    let properties = rawProperties.map((p) => {
      const purchasePrice = Number(p.purchasePrice ?? 0)
      const renovationCost = Number(p.renovationCost ?? 0)
      const expectedSalePrice = Number(p.expectedSalePrice ?? Number(p.price))
      const totalInvestment = purchasePrice + renovationCost
      const potentialProfit = expectedSalePrice - totalInvestment
      const roi = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0

      return {
        id: p.id,
        address: p.address,
        district: p.district,
        type: p.type,
        typeLabel: PROPERTY_TYPE_LABELS[p.type] ?? p.type,
        purchasePrice,
        renovationCost,
        expectedSalePrice,
        totalInvestment,
        potentialProfit,
        roi: Math.round(roi * 10) / 10,
        lifecycleStage: p.lifecycleStage,
        lifecycleStageLabel: p.lifecycleStage ? (LIFECYCLE_STAGE_LABELS[p.lifecycleStage] ?? p.lifecycleStage) : null,
      }
    })

    if (minROI !== undefined) {
      properties = properties.filter((p) => p.roi >= minROI)
    }

    // Sort by ROI descending
    properties.sort((a, b) => b.roi - a.roi)

    const totalInvestment = properties.reduce((s, p) => s + p.totalInvestment, 0)
    const totalExpectedRevenue = properties.reduce((s, p) => s + p.expectedSalePrice, 0)
    const totalPotentialProfit = properties.reduce((s, p) => s + p.potentialProfit, 0)
    const averageROI = properties.length > 0
      ? Math.round((properties.reduce((s, p) => s + p.roi, 0) / properties.length) * 10) / 10
      : 0

    // Chart: top 10 by profit (in millions)
    const chartData = properties.slice(0, 10).map((p) => ({
      name: p.address.length > 25 ? p.address.slice(0, 25) + "…" : p.address,
      pocet: Math.round(p.potentialProfit / 100000) / 10, // in millions
    }))

    return {
      toolName: "calculatePropertyProfitability",
      totalProperties: properties.length,
      totalInvestment,
      totalExpectedRevenue,
      totalPotentialProfit,
      averageROI,
      properties,
      chartType: "bar",
      chartData,
    }
  },
})
