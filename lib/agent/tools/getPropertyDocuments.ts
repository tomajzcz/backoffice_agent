import { tool } from "ai"
import { z } from "zod"
import { getPropertyDocuments } from "@/lib/db/queries/documents"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants/labels"
import type { GetPropertyDocumentsResult } from "@/types/agent"

export const getPropertyDocumentsTool = tool({
  description:
    "Vrátí seznam dokumentů k nemovitosti. Zobrazí typ, název, datum nahrání a odkaz.",
  parameters: z.object({
    propertyId: z.number().int().describe("ID nemovitosti"),
  }),
  execute: async ({ propertyId }): Promise<GetPropertyDocumentsResult> => {
    const { propertyAddress, documents } = await getPropertyDocuments(propertyId)

    return {
      toolName: "getPropertyDocuments",
      propertyId,
      propertyAddress,
      totalDocuments: documents.length,
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        typeLabel: DOCUMENT_TYPE_LABELS[d.type] ?? d.type,
        name: d.name,
        url: d.url,
        uploadedAt: d.uploadedAt.toISOString(),
        notes: d.notes,
      })),
      chartType: "none",
    }
  },
})
