import { tool } from "ai"
import { z } from "zod"
import { scanRenovationHealth } from "@/lib/db/queries/renovations"
import type { ScanRenovationHealthResult } from "@/types/agent"

export const scanRenovationHealthTool = tool({
  description:
    "Zdravotní audit všech aktivních rekonstrukcí. " +
    "Kontroluje zpoždění, přečerpání rozpočtu, chybějící dodavatele, blokátory a prošlé úkoly.",
  parameters: z.object({}),
  execute: async (): Promise<ScanRenovationHealthResult> => {
    const health = await scanRenovationHealth()

    const issues: ScanRenovationHealthResult["issues"] = []

    if (health.delayed.length > 0) {
      issues.push({
        category: "delayed",
        categoryLabel: "Zpožděné rekonstrukce",
        severity: "high",
        count: health.delayed.length,
        items: health.delayed,
      })
    }

    if (health.overBudget.length > 0) {
      issues.push({
        category: "overBudget",
        categoryLabel: "Přečerpání rozpočtu",
        severity: "high",
        count: health.overBudget.length,
        items: health.overBudget,
      })
    }

    if (health.withOverdueTasks.length > 0) {
      issues.push({
        category: "overdueTasks",
        categoryLabel: "Prošlé úkoly",
        severity: "high",
        count: health.withOverdueTasks.length,
        items: health.withOverdueTasks,
      })
    }

    if (health.withBlockers.length > 0) {
      issues.push({
        category: "blockers",
        categoryLabel: "Blokátory",
        severity: "medium",
        count: health.withBlockers.length,
        items: health.withBlockers,
      })
    }

    if (health.missingContractor.length > 0) {
      issues.push({
        category: "missingContractor",
        categoryLabel: "Chybí dodavatel",
        severity: "medium",
        count: health.missingContractor.length,
        items: health.missingContractor,
      })
    }

    if (health.missingNextStep.length > 0) {
      issues.push({
        category: "missingNextStep",
        categoryLabel: "Chybí další krok",
        severity: "low",
        count: health.missingNextStep.length,
        items: health.missingNextStep,
      })
    }

    // Health score: 100 = perfect, deduct for issues
    const totalIssues =
      health.delayed.length * 15 +
      health.overBudget.length * 10 +
      health.withOverdueTasks.length * 10 +
      health.withBlockers.length * 5 +
      health.missingContractor.length * 5 +
      health.missingNextStep.length * 3
    const healthScore = Math.max(0, 100 - totalIssues)

    return {
      toolName: "scanRenovationHealth",
      totalActive: health.totalActive,
      totalDelayed: health.delayed.length,
      totalOverBudget: health.overBudget.length,
      totalWithBlockers: health.withBlockers.length,
      healthScore,
      issues,
      chartType: "bar",
      chartData: issues.map((i) => ({ name: i.categoryLabel, pocet: i.count })),
    }
  },
})
