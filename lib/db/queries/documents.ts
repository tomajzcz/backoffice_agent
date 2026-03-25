import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

// ─── List / paginated query ────────────────────────────────────────────────

export interface ListDocumentsFilters {
  propertyId?: number
  type?: string
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listDocumentsQuery(filters: ListDocumentsFilters) {
  const where: Prisma.DocumentWhereInput = {}
  if (filters.propertyId) where.propertyId = filters.propertyId
  if (filters.type) where.type = filters.type as Prisma.EnumDocumentTypeFilter["equals"]
  if (filters.search) where.name = { contains: filters.search, mode: "insensitive" }

  const orderBy: Prisma.DocumentOrderByWithRelationInput =
    filters.sortBy === "propertyAddress"
      ? { property: { address: filters.sortOrder } }
      : { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: { property: { select: { address: true, district: true } } },
    }),
    prisma.document.count({ where }),
  ])

  return { items, total }
}

export async function updateDocumentQuery(id: number, data: {
  propertyId?: number
  type?: string
  name?: string
  url?: string
  notes?: string
}) {
  const updateData: Record<string, unknown> = {}
  if (data.propertyId !== undefined) updateData.propertyId = data.propertyId
  if (data.type !== undefined) updateData.type = data.type
  if (data.name !== undefined) updateData.name = data.name
  if (data.url !== undefined) updateData.url = data.url
  if (data.notes !== undefined) updateData.notes = data.notes

  return prisma.document.update({
    where: { id },
    data: updateData,
    include: { property: { select: { address: true, district: true } } },
  })
}

export async function deleteDocumentQuery(id: number) {
  return prisma.document.delete({ where: { id } })
}

// ─── Agent tool queries ────────────────────────────────────────────────────

const REQUIRED_DOC_TYPES = [
  "KUPNI_SMLOUVA",
  "ENERGETICKY_STITEK",
  "LIST_VLASTNICTVI",
  "FOTODOKUMENTACE",
] as const

export async function getPropertyDocuments(propertyId: number) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { address: true },
  })

  const documents = await prisma.document.findMany({
    where: { propertyId },
    orderBy: { uploadedAt: "desc" },
  })

  return {
    propertyAddress: property?.address ?? `Nemovitost #${propertyId}`,
    documents,
  }
}

export async function scanMissingDocuments() {
  // Check all active properties (not SOLD/WITHDRAWN)
  const properties = await prisma.property.findMany({
    where: {
      status: { notIn: ["SOLD", "WITHDRAWN"] },
    },
    select: {
      id: true,
      address: true,
      district: true,
      status: true,
      lifecycleStage: true,
      documents: {
        select: { type: true },
      },
    },
    orderBy: { address: "asc" },
  })

  return properties.map((p) => {
    const existingTypes = p.documents.map((d) => d.type)
    const missingTypes = REQUIRED_DOC_TYPES.filter((t) => !existingTypes.includes(t))
    const completeness = Math.round(
      ((REQUIRED_DOC_TYPES.length - missingTypes.length) / REQUIRED_DOC_TYPES.length) * 100,
    )

    return {
      id: p.id,
      address: p.address,
      district: p.district,
      status: p.status,
      lifecycleStage: p.lifecycleStage,
      existingDocs: existingTypes,
      missingDocs: missingTypes as string[],
      completeness,
    }
  })
}

export async function createDocumentQuery(data: {
  propertyId: number
  type: string
  name: string
  url?: string
  notes?: string
}) {
  return prisma.document.create({
    data: {
      propertyId: data.propertyId,
      type: data.type as "KUPNI_SMLOUVA" | "NAVRH_NA_VKLAD" | "ZNALECKY_POSUDEK" | "ENERGETICKY_STITEK" | "LIST_VLASTNICTVI" | "FOTODOKUMENTACE" | "OSTATNI",
      name: data.name,
      url: data.url ?? null,
      notes: data.notes ?? null,
    },
  })
}
