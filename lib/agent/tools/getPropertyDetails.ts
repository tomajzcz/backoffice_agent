import { tool } from "ai"
import { z } from "zod"
import { getPropertyById } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS as TYPE_LABELS, PROPERTY_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { GetPropertyDetailsResult } from "@/types/agent"

export const getPropertyDetailsTool = tool({
  description:
    "Vrátí kompletní detail nemovitosti včetně vlastníka. " +
    "Použij pro získání kontextu před odesláním emailu nebo plánováním prohlídky.",
  parameters: z.object({
    propertyId: z.number().describe("ID nemovitosti v systému"),
  }),
  execute: async ({ propertyId }): Promise<GetPropertyDetailsResult> => {
    const property = await getPropertyById(propertyId)

    if (!property) {
      throw new Error(`Nemovitost s ID ${propertyId} nebyla nalezena`)
    }

    return {
      toolName: "getPropertyDetails",
      property: {
        id: property.id,
        address: property.address,
        district: property.district,
        type: property.type,
        typeLabel: TYPE_LABELS[property.type] ?? property.type,
        price: Number(property.price),
        status: property.status,
        statusLabel: STATUS_LABELS[property.status] ?? property.status,
        areaM2: Number(property.areaM2),
        yearBuilt: property.yearBuilt,
        lastRenovationYear: property.lastRenovationYear,
        renovationNotes: property.renovationNotes,
        ownerName: property.owner?.name ?? null,
        ownerEmail: property.owner?.email ?? null,
        ownerPhone: property.owner?.phone ?? null,
      },
      chartType: "none",
    }
  },
})
