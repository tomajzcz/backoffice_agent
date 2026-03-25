import { tool } from "ai"
import { z } from "zod"
import { runOperationalHealthScan } from "@/lib/db/queries/health"
import type { ScanOperationalHealthResult } from "@/types/agent"

const CATEGORY_LABELS: Record<string, string> = {
  missingRenovation: "Chybějící rekonstrukce",
  overdueTasks: "Prošlé úkoly",
  stalledDeals: "Zaseknuté obchody",
  showingsWithoutFollowUp: "Prohlídky bez follow-upu",
  propertiesWithoutOwner: "Nemovitosti bez vlastníka",
  missingLifecycle: "Chybějící fáze životního cyklu",
}

const CATEGORY_SEVERITY: Record<string, "high" | "medium" | "low"> = {
  overdueTasks: "high",
  stalledDeals: "high",
  missingRenovation: "medium",
  showingsWithoutFollowUp: "medium",
  propertiesWithoutOwner: "low",
  missingLifecycle: "low",
}

export const scanOperationalHealthTool = tool({
  description:
    "Provede komplexní audit operativního zdraví firmy. " +
    "Kontroluje: chybějící data o rekonstrukcích, prošlé úkoly, zaseknuté obchody, " +
    "prohlídky bez follow-upu, nemovitosti bez vlastníka a chybějící fáze životního cyklu. " +
    "Vrátí skóre 0–100 a seznam problémů. Použij pro ranní briefing nebo pravidelnou kontrolu.",
  parameters: z.object({
    stalledDealsDays: z.number().int().min(7).max(90).default(30)
      .describe("Kolik dní bez aktivity = zaseknutý obchod (výchozí 30)"),
    showingFollowUpDays: z.number().int().min(1).max(30).default(14)
      .describe("Kolik dní na follow-up po prohlídce (výchozí 14)"),
  }),
  execute: async ({ stalledDealsDays, showingFollowUpDays }): Promise<ScanOperationalHealthResult> => {
    const rawCategories = await runOperationalHealthScan(stalledDealsDays, showingFollowUpDays)

    const categories = rawCategories.map((c) => ({
      category: c.category,
      categoryLabel: CATEGORY_LABELS[c.category] ?? c.category,
      severity: CATEGORY_SEVERITY[c.category] ?? ("low" as const),
      count: c.items.length,
      items: c.items.slice(0, 10), // Limit to top 10 per category
    }))

    const totalIssues = categories.reduce((sum, c) => sum + c.count, 0)

    // Score: start at 100, subtract weighted penalties
    const highCount = categories.filter((c) => c.severity === "high").reduce((s, c) => s + c.count, 0)
    const mediumCount = categories.filter((c) => c.severity === "medium").reduce((s, c) => s + c.count, 0)
    const lowCount = categories.filter((c) => c.severity === "low").reduce((s, c) => s + c.count, 0)
    const overallScore = Math.max(0, Math.min(100, 100 - highCount * 8 - mediumCount * 3 - lowCount * 1))

    const chartData = categories.map((c) => ({
      name: c.categoryLabel,
      pocet: c.count,
    }))

    return {
      toolName: "scanOperationalHealth",
      overallScore,
      totalIssues,
      categories,
      chartType: "bar",
      chartData,
    }
  },
})
