import { tool } from "ai"
import { z } from "zod"
import { getPropertiesByLifecycle } from "@/lib/db/queries/properties"
import { LIFECYCLE_STAGE_LABELS, PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/lib/constants/labels"
import type { QueryPropertiesByLifecycleResult } from "@/types/agent"

export const queryPropertiesByLifecycleTool = tool({
  description:
    "Vrátí přehled nemovitostí podle fáze životního cyklu (akvizice → rekonstrukce → připraveno k prodeji → inzerováno → prodáno). " +
    "Použij pro pipeline přehled, filtrování podle fáze nebo čtvrti, nebo zjištění zaseklých nemovitostí.",
  parameters: z.object({
    stage: z.enum(["ACQUISITION", "IN_RENOVATION", "READY_FOR_SALE", "LISTED", "SOLD"])
      .optional()
      .describe("Filtrovat podle fáze životního cyklu"),
    district: z.string().optional().describe("Filtrovat podle čtvrti"),
    includeStalled: z.boolean().default(false)
      .describe("Zahrnout identifikaci zaseklých nemovitostí (>30 dní v jedné fázi)"),
  }),
  execute: async ({ stage, district, includeStalled }): Promise<QueryPropertiesByLifecycleResult> => {
    const { items, byStage } = await getPropertiesByLifecycle(stage, district)
    const now = new Date()

    const properties = items.map((p) => {
      const daysInStage = p.stageChangedAt
        ? Math.ceil((now.getTime() - p.stageChangedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return {
        id: p.id,
        address: p.address,
        district: p.district,
        type: p.type,
        typeLabel: PROPERTY_TYPE_LABELS[p.type] ?? p.type,
        price: Number(p.price),
        status: p.status,
        statusLabel: PROPERTY_STATUS_LABELS[p.status] ?? p.status,
        lifecycleStage: p.lifecycleStage ?? "N/A",
        lifecycleStageLabel: p.lifecycleStage ? (LIFECYCLE_STAGE_LABELS[p.lifecycleStage] ?? p.lifecycleStage) : "Neurčeno",
        stageChangedAt: p.stageChangedAt?.toISOString() ?? null,
        daysInStage,
        areaM2: Number(p.areaM2),
        disposition: p.disposition,
        ownerName: p.owner?.name ?? null,
      }
    })

    const stalledProperties = includeStalled
      ? properties.filter((p) => p.daysInStage > 30 && p.lifecycleStage !== "SOLD")
      : []

    const chartData = byStage.map((s) => ({
      name: LIFECYCLE_STAGE_LABELS[s.stage] ?? s.stage,
      pocet: s.count,
    }))

    return {
      toolName: "queryPropertiesByLifecycle",
      totalCount: properties.length,
      filterStage: stage ?? null,
      filterDistrict: district ?? null,
      stalledProperties: stalledProperties.map((p) => ({
        id: p.id,
        address: p.address,
        district: p.district,
        lifecycleStage: p.lifecycleStage,
        lifecycleStageLabel: p.lifecycleStageLabel,
        daysInStage: p.daysInStage,
      })),
      properties,
      byStage: byStage.map((s) => ({
        stage: s.stage,
        stageLabel: LIFECYCLE_STAGE_LABELS[s.stage] ?? s.stage,
        count: s.count,
      })),
      chartType: "bar",
      chartData,
    }
  },
})
