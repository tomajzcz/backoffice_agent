import { tool } from "ai"
import { z } from "zod"
import { scanMissingDocuments } from "@/lib/db/queries/documents"
import { PROPERTY_STATUS_LABELS, LIFECYCLE_STAGE_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/constants/labels"
import type { ScanMissingDocumentsResult } from "@/types/agent"

export const scanMissingDocumentsTool = tool({
  description:
    "Najde nemovitosti, u kterých chybí povinné dokumenty (kupní smlouva, energetický štítek, " +
    "list vlastnictví, fotodokumentace). Kontroluje aktivní nemovitosti (ne prodané/stažené).",
  parameters: z.object({}),
  execute: async (): Promise<ScanMissingDocumentsResult> => {
    const rawResults = await scanMissingDocuments()

    // Only include properties with at least 1 missing doc
    const withMissing = rawResults.filter((p) => p.missingDocs.length > 0)

    const properties = withMissing.map((p) => ({
      id: p.id,
      address: p.address,
      district: p.district,
      status: p.status,
      statusLabel: PROPERTY_STATUS_LABELS[p.status] ?? p.status,
      lifecycleStage: p.lifecycleStage,
      lifecycleStageLabel: p.lifecycleStage
        ? (LIFECYCLE_STAGE_LABELS[p.lifecycleStage] ?? p.lifecycleStage)
        : null,
      existingDocs: p.existingDocs,
      missingDocs: p.missingDocs,
      missingDocLabels: p.missingDocs.map((d) => DOCUMENT_TYPE_LABELS[d] ?? d),
      completeness: p.completeness,
    }))

    // Sort by completeness ascending (worst first)
    properties.sort((a, b) => a.completeness - b.completeness)

    // Chart: group by number of missing docs
    const buckets: Record<string, number> = {}
    for (const p of properties) {
      const key = `${p.missingDocs.length} chybějící`
      buckets[key] = (buckets[key] || 0) + 1
    }
    const chartData = Object.entries(buckets).map(([name, pocet]) => ({ name, pocet }))

    return {
      toolName: "scanMissingDocuments",
      totalPropertiesChecked: rawResults.length,
      totalWithMissingDocs: withMissing.length,
      properties,
      chartType: "bar",
      chartData,
    }
  },
})
