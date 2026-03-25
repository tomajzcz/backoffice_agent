import { tool } from "ai"
import { z } from "zod"
import { updatePropertyQuery } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS as TYPE_LABELS, PROPERTY_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { UpdatePropertyResult } from "@/types/agent"

export const updatePropertyTool = tool({
  description:
    "Aktualizuje existující nemovitost podle ID. " +
    "Pošli pouze pole, která se mají změnit.",
  parameters: z.object({
    propertyId: z.number().int().describe("ID nemovitosti k aktualizaci"),
    address: z.string().optional().describe("Nová adresa"),
    district: z.string().optional().describe("Nová čtvrť"),
    type: z.enum(["BYT", "DUM", "POZEMEK", "KOMERCNI"]).optional().describe("Nový typ"),
    price: z.number().positive().optional().describe("Nová cena v CZK"),
    areaM2: z.number().positive().optional().describe("Nová plocha v m²"),
    status: z.enum(["AVAILABLE", "IN_NEGOTIATION", "SOLD", "RENTED", "WITHDRAWN"]).optional().describe("Nový status"),
    disposition: z.string().optional().describe("Nová dispozice"),
    yearBuilt: z.number().int().optional().describe("Nový rok výstavby"),
    lastRenovationYear: z.number().int().optional().describe("Nový rok rekonstrukce"),
    renovationNotes: z.string().optional().describe("Nové poznámky k rekonstrukci"),
    lifecycleStage: z.enum(["ACQUISITION", "IN_RENOVATION", "READY_FOR_SALE", "LISTED", "SOLD"]).optional().describe("Nová fáze životního cyklu"),
    purchasePrice: z.number().positive().optional().describe("Nákupní cena v CZK"),
    renovationCost: z.number().min(0).optional().describe("Náklady na rekonstrukci v CZK"),
    expectedSalePrice: z.number().positive().optional().describe("Očekávaná prodejní cena v CZK"),
    ownerId: z.number().int().optional().describe("Nové ID vlastníka"),
  }),
  execute: async ({ propertyId, ...data }): Promise<UpdatePropertyResult> => {
    const updatedFields = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
    const property = await updatePropertyQuery(propertyId, data)

    return {
      toolName: "updateProperty",
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
      },
      updatedFields,
      chartType: "none",
    }
  },
})
