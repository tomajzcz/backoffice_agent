import { tool } from "ai"
import { z } from "zod"
import { getInvestorOverview } from "@/lib/db/queries/investors"
import { LIFECYCLE_STAGE_LABELS } from "@/lib/constants/labels"
import type { GetInvestorOverviewResult } from "@/types/agent"

export const getInvestorOverviewTool = tool({
  description:
    "Vrátí přehled investorského portfolia. Bez investorId vrátí všechny investory s jejich portfolii. " +
    "S investorId nebo investorName vrátí detail konkrétního investora včetně seznamu nemovitostí.",
  parameters: z.object({
    investorId: z.number().int().optional().describe("ID investora pro detail (volitelné)"),
    investorName: z.string().optional().describe("Hledat investora podle jména (volitelné)"),
  }),
  execute: async ({ investorId, investorName }): Promise<GetInvestorOverviewResult> => {
    const rawInvestors = await getInvestorOverview(investorId, investorName)

    const investors = rawInvestors.map((inv) => ({
      id: inv.id,
      name: inv.name,
      email: inv.email,
      company: inv.company,
      propertyCount: inv.propertyCount,
      totalInvested: inv.totalInvested,
      totalCurrentValue: inv.totalCurrentValue,
      properties: inv.properties.map((p) => ({
        id: p.id,
        address: p.address,
        district: p.district,
        lifecycleStage: p.lifecycleStage,
        lifecycleStageLabel: p.lifecycleStage
          ? (LIFECYCLE_STAGE_LABELS[p.lifecycleStage] ?? p.lifecycleStage)
          : null,
        investedAmount: p.investedAmount,
        currentValue: p.currentValue,
      })),
    }))

    const totalInvested = investors.reduce((s, i) => s + i.totalInvested, 0)
    const totalPortfolioValue = investors.reduce((s, i) => s + i.totalCurrentValue, 0)

    // Chart: investor name → portfolio value in millions
    const chartData = investors.map((i) => ({
      name: i.name,
      pocet: Math.round(i.totalCurrentValue / 100000) / 10,
    }))

    return {
      toolName: "getInvestorOverview",
      totalInvestors: investors.length,
      totalPortfolioValue,
      totalInvested,
      investors,
      chartType: "bar",
      chartData,
    }
  },
})
