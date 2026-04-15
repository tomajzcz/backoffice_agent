import { z } from "zod"

export const Id = z.number().int().positive()

const PROPERTY_STATUSES = [
  "AVAILABLE", "RESERVED", "UNDER_CONTRACT", "SOLD", "OFF_MARKET",
] as const
const PROPERTY_TYPES = ["APARTMENT", "HOUSE", "COMMERCIAL", "LAND"] as const
const LIFECYCLE_STAGES = [
  "ACQUISITION", "RENOVATION", "READY_TO_LIST", "LISTED", "SOLD",
] as const

export const CreatePropertySchema = z.object({
  address: z.string().min(1).max(500),
  district: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  price: z.number().nonnegative().max(1_000_000_000),
  areaM2: z.number().nonnegative().max(100_000),
  status: z.string().max(50).optional(),
  disposition: z.string().max(50).optional(),
  yearBuilt: z.number().int().min(1500).max(2100).optional(),
  lastRenovationYear: z.number().int().min(1500).max(2100).optional(),
  renovationNotes: z.string().max(5000).optional(),
  ownerId: Id.optional(),
})

export const UpdatePropertySchema = CreatePropertySchema.partial().extend({
  lifecycleStage: z.enum(LIFECYCLE_STAGES).optional(),
})

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional(),
  acquisitionSource: z.string().min(1).max(50),
  segment: z.string().min(1).max(50),
})

export const UpdateClientSchema = CreateClientSchema.partial()

export const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional(),
  source: z.string().min(1).max(50),
  propertyInterest: z.string().max(2000).optional(),
  status: z.string().max(50).optional(),
})

export const UpdateLeadSchema = CreateLeadSchema.partial()

export const CreateDealSchema = z.object({
  propertyId: Id,
  clientId: Id,
  value: z.number().nonnegative().max(1_000_000_000),
  status: z.string().max(50).optional(),
})

export const UpdateDealSchema = z.object({
  status: z.string().max(50).optional(),
  value: z.number().nonnegative().max(1_000_000_000).optional(),
})

export const CreateShowingSchema = z.object({
  propertyId: Id,
  clientId: Id,
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  notes: z.string().max(2000).optional(),
})

export const UpdateShowingSchema = z.object({
  status: z.string().max(50).optional(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  notes: z.string().max(2000).optional(),
})

export const CreateInvestorSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
})
export const UpdateInvestorSchema = CreateInvestorSchema.partial()

export const CreateDocumentSchema = z.object({
  propertyId: Id,
  type: z.string().min(1).max(50),
  name: z.string().min(1).max(300),
  url: z.string().url().max(2000).optional(),
  notes: z.string().max(2000).optional(),
})
export const UpdateDocumentSchema = CreateDocumentSchema.partial()

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.string().max(50).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  assignee: z.string().max(200).optional(),
  propertyId: Id.optional(),
  dealId: Id.optional(),
  renovationId: Id.optional(),
})
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
  assignee: z.string().max(200).nullable().optional(),
  propertyId: Id.optional(),
  dealId: Id.optional(),
})

export const CreateRenovationSchema = z.object({
  propertyId: Id,
  phase: z.string().max(50).optional(),
  plannedEndAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  nextStep: z.string().max(1000).optional(),
  blockers: z.string().max(2000).optional(),
  ownerName: z.string().max(200).optional(),
  contractorName: z.string().max(200).optional(),
  budgetPlanned: z.number().nonnegative().max(1_000_000_000).optional(),
  budgetActual: z.number().nonnegative().max(1_000_000_000).optional(),
  notes: z.string().max(5000).optional(),
})
export const UpdateRenovationSchema = z.object({
  phase: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  plannedEndAt: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
  nextStep: z.string().max(1000).nullable().optional(),
  blockers: z.string().max(2000).nullable().optional(),
  ownerName: z.string().max(200).nullable().optional(),
  contractorName: z.string().max(200).nullable().optional(),
  budgetPlanned: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  budgetActual: z.number().nonnegative().max(1_000_000_000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

// Suppress unused warnings — constants exist for reference when tightening enums later.
void PROPERTY_STATUSES
void PROPERTY_TYPES

export function parseOrError<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: "Neplatná data formuláře" }
  }
  return { ok: true, data: parsed.data }
}
