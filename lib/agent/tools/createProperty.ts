import { tool } from "ai"
import { z } from "zod"
import { createPropertyQuery } from "@/lib/db/queries/properties"
import { PROPERTY_TYPE_LABELS as TYPE_LABELS, PROPERTY_STATUS_LABELS as STATUS_LABELS } from "@/lib/constants/labels"
import type { CreatePropertyResult } from "@/types/agent"

export const createPropertyTool = tool({
  description:
    "Vytvoří novou nemovitost v systému. " +
    "Vyžaduje adresu, čtvrť, typ, cenu a plochu. Status je defaultně AVAILABLE.",
  parameters: z.object({
    address: z.string().describe("Adresa nemovitosti"),
    district: z.string().describe("Čtvrť (např. Holešovice, Žižkov)"),
    type: z.enum(["BYT", "DUM", "POZEMEK", "KOMERCNI"]).describe("Typ nemovitosti"),
    price: z.number().positive().describe("Cena v CZK"),
    areaM2: z.number().positive().describe("Plocha v m²"),
    status: z.enum(["AVAILABLE", "IN_NEGOTIATION", "SOLD", "RENTED", "WITHDRAWN"]).optional().describe("Status (default: AVAILABLE)"),
    disposition: z.string().optional().describe("Dispozice (např. 3+kk, 2+1)"),
    yearBuilt: z.number().int().optional().describe("Rok výstavby"),
    lastRenovationYear: z.number().int().optional().describe("Rok poslední rekonstrukce"),
    renovationNotes: z.string().optional().describe("Poznámky k rekonstrukci"),
    ownerId: z.number().int().optional().describe("ID vlastníka (klienta)"),
  }),
  execute: async (params): Promise<CreatePropertyResult> => {
    const property = await createPropertyQuery(params)

    return {
      toolName: "createProperty",
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
      chartType: "none",
    }
  },
})
