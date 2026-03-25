import { tool } from "ai"
import { z } from "zod"
import { getActiveRenovations } from "@/lib/db/queries/renovations"
import { RENOVATION_PHASE_LABELS, RENOVATION_STATUS_LABELS } from "@/lib/constants/labels"
import type { QueryActiveRenovationsResult } from "@/types/agent"

export const queryActiveRenovationsTool = tool({
  description:
    "Přehled aktivních rekonstrukcí nemovitostí. " +
    "Filtruj podle fáze, čtvrti nebo zpoždění. " +
    "Vrátí seznam rekonstrukcí s úkoly a rozpočtem.",
  parameters: z.object({
    phase: z
      .enum(["PLANNING", "DEMOLITION", "ROUGH_WORK", "INSTALLATIONS", "SURFACES", "FINISHING", "READY_FOR_HANDOVER"])
      .optional()
      .describe("Filtr podle fáze rekonstrukce"),
    district: z.string().optional().describe("Filtr podle čtvrti"),
    onlyDelayed: z.boolean().optional().default(false).describe("Zobrazit pouze zpožděné rekonstrukce"),
  }),
  execute: async ({ phase, district, onlyDelayed }): Promise<QueryActiveRenovationsResult> => {
    const items = await getActiveRenovations({ phase, district, onlyDelayed })

    // Aggregate by phase
    const phaseCounts: Record<string, number> = {}
    for (const r of items) {
      phaseCounts[r.phase] = (phaseCounts[r.phase] ?? 0) + 1
    }

    const byPhase = Object.entries(phaseCounts)
      .map(([p, count]) => ({
        phase: p,
        phaseLabel: RENOVATION_PHASE_LABELS[p] ?? p,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      toolName: "queryActiveRenovations",
      totalCount: items.length,
      filterPhase: phase ?? null,
      filterDistrict: district ?? null,
      renovations: items.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        propertyAddress: r.propertyAddress,
        propertyDistrict: r.propertyDistrict,
        phase: r.phase,
        phaseLabel: RENOVATION_PHASE_LABELS[r.phase] ?? r.phase,
        status: r.status,
        statusLabel: RENOVATION_STATUS_LABELS[r.status] ?? r.status,
        startedAt: r.startedAt.toISOString(),
        plannedEndAt: r.plannedEndAt?.toISOString() ?? null,
        isDelayed: r.isDelayed,
        nextStep: r.nextStep,
        blockers: r.blockers,
        ownerName: r.ownerName,
        contractorName: r.contractorName,
        budgetPlanned: r.budgetPlanned,
        budgetActual: r.budgetActual,
        openTasksCount: r.openTasksCount,
        overdueTasksCount: r.overdueTasksCount,
      })),
      byPhase,
      chartType: "bar",
      chartData: byPhase.map((p) => ({ name: p.phaseLabel, pocet: p.count })),
    }
  },
})
