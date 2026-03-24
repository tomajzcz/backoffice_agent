import { tool } from "ai"
import { z } from "zod"
import { getWeeklyReports } from "@/lib/db/queries/weekly-reports"
import type { QueryWeeklyKPIsResult } from "@/types/agent"

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export const queryWeeklyKPIsTool = tool({
  description:
    "Vrátí weekly KPI data za posledních N týdnů z databáze (nové leady, klienti, nemovitosti, uzavřené obchody, tržby). " +
    "Použij pro přehled výkonnosti, trendy, nebo jako podklad pro report či prezentaci. " +
    "Výchozí hodnota je 8 týdnů.",
  parameters: z.object({
    weeksBack: z
      .number()
      .int()
      .min(1)
      .max(26)
      .default(8)
      .describe("Počet posledních týdnů k zobrazení (1–26, výchozí 8)"),
  }),
  execute: async ({ weeksBack }): Promise<QueryWeeklyKPIsResult> => {
    const rows = await getWeeklyReports(weeksBack)

    const weeks = rows.map((r) => {
      const { week, year } = getISOWeek(r.weekStart)
      return {
        weekStart: r.weekStart.toISOString(),
        weekLabel: `T${week} ${year}`,
        newLeads: r.newLeads,
        newClients: r.newClients,
        propertiesListed: r.propertiesListed,
        dealsClosed: r.dealsClosed,
        revenue: r.revenue,
      }
    })

    // Trends: compare second half vs first half
    const half = Math.floor(weeks.length / 2)
    const firstHalf = weeks.slice(0, half)
    const secondHalf = weeks.slice(half)

    const trends = {
      leadsChange: pctChange(avg(secondHalf.map((w) => w.newLeads)), avg(firstHalf.map((w) => w.newLeads))),
      clientsChange: pctChange(avg(secondHalf.map((w) => w.newClients)), avg(firstHalf.map((w) => w.newClients))),
      revenueChange: pctChange(avg(secondHalf.map((w) => w.revenue)), avg(firstHalf.map((w) => w.revenue))),
      dealsChange: pctChange(avg(secondHalf.map((w) => w.dealsClosed)), avg(firstHalf.map((w) => w.dealsClosed))),
    }

    const totals = {
      totalLeads: weeks.reduce((s, w) => s + w.newLeads, 0),
      totalClients: weeks.reduce((s, w) => s + w.newClients, 0),
      totalDeals: weeks.reduce((s, w) => s + w.dealsClosed, 0),
      totalRevenue: weeks.reduce((s, w) => s + w.revenue, 0),
    }

    return {
      toolName: "queryWeeklyKPIs",
      weeksBack,
      weeks,
      trends,
      totals,
      chartType: "bar",
      chartData: weeks.map((w) => ({
        name: w.weekLabel,
        leady: w.newLeads,
        klienti: w.newClients,
        obchody: w.dealsClosed,
      })),
    }
  },
})
