import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export interface PropertyRenovationRow {
  id: number
  address: string
  district: string
  type: string
  price: number
  status: string
  areaM2: number
  yearBuilt: number | null
}

export async function getPropertyById(id: number) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      owner: {
        select: { name: true, email: true, phone: true },
      },
      _count: {
        select: { documents: true, tasks: true },
      },
    },
  })
}

export async function getMissingRenovationProperties(): Promise<PropertyRenovationRow[]> {
  const rows = await prisma.property.findMany({
    where: {
      lastRenovationYear: null,
      OR: [
        { renovationNotes: null },
        { renovationNotes: "" },
      ],
    },
    orderBy: [{ district: "asc" }, { address: "asc" }],
  })

  return rows.map((p) => ({
    id: p.id,
    address: p.address,
    district: p.district,
    type: p.type,
    price: Number(p.price),
    status: p.status,
    areaM2: Number(p.areaM2),
    yearBuilt: p.yearBuilt,
  }))
}

// ─── CRUD queries ─────────────────────────────────────────────────────────────

export interface ListPropertiesFilters {
  district?: string
  type?: string
  status?: string
  lifecycleStage?: string
  priceMin?: number
  priceMax?: number
  areaMin?: number
  areaMax?: number
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listPropertiesQuery(filters: ListPropertiesFilters) {
  const where: Prisma.PropertyWhereInput = {}

  if (filters.district) where.district = { contains: filters.district, mode: "insensitive" }
  if (filters.type) where.type = filters.type as Prisma.EnumPropertyTypeFilter["equals"]
  if (filters.status) where.status = filters.status as Prisma.EnumPropertyStatusFilter["equals"]
  if (filters.lifecycleStage) where.lifecycleStage = filters.lifecycleStage as Prisma.EnumLifecycleStageNullableFilter["equals"]
  if (filters.priceMin || filters.priceMax) {
    where.price = {}
    if (filters.priceMin) where.price.gte = filters.priceMin
    if (filters.priceMax) where.price.lte = filters.priceMax
  }
  if (filters.areaMin || filters.areaMax) {
    where.areaM2 = {}
    if (filters.areaMin) where.areaM2.gte = filters.areaMin
    if (filters.areaMax) where.areaM2.lte = filters.areaMax
  }
  if (filters.search) where.address = { contains: filters.search, mode: "insensitive" }

  const orderBy: Prisma.PropertyOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: { owner: { select: { name: true } } },
    }),
    prisma.property.count({ where }),
  ])

  return { items, total }
}

export async function createPropertyQuery(data: {
  address: string
  district: string
  type: string
  price: number
  areaM2: number
  status?: string
  disposition?: string
  yearBuilt?: number
  lastRenovationYear?: number
  renovationNotes?: string
  lifecycleStage?: string
  purchasePrice?: number
  renovationCost?: number
  expectedSalePrice?: number
  ownerId?: number
}) {
  return prisma.property.create({
    data: {
      address: data.address,
      district: data.district,
      type: data.type as "BYT" | "DUM" | "POZEMEK" | "KOMERCNI",
      price: data.price,
      areaM2: data.areaM2,
      status: (data.status as "AVAILABLE" | "IN_NEGOTIATION" | "SOLD" | "RENTED" | "WITHDRAWN") ?? "AVAILABLE",
      disposition: data.disposition,
      yearBuilt: data.yearBuilt,
      lastRenovationYear: data.lastRenovationYear,
      renovationNotes: data.renovationNotes,
      lifecycleStage: data.lifecycleStage as "ACQUISITION" | "IN_RENOVATION" | "READY_FOR_SALE" | "LISTED" | "SOLD" | undefined,
      stageChangedAt: data.lifecycleStage ? new Date() : undefined,
      purchasePrice: data.purchasePrice,
      renovationCost: data.renovationCost,
      expectedSalePrice: data.expectedSalePrice,
      ownerId: data.ownerId,
    },
    include: { owner: { select: { name: true, email: true, phone: true } } },
  })
}

export async function updatePropertyQuery(id: number, data: {
  address?: string
  district?: string
  type?: string
  price?: number
  areaM2?: number
  status?: string
  disposition?: string
  yearBuilt?: number
  lastRenovationYear?: number
  renovationNotes?: string
  lifecycleStage?: string
  purchasePrice?: number
  renovationCost?: number
  expectedSalePrice?: number
  ownerId?: number
}) {
  // Fetch current property to detect lifecycle stage transitions
  const currentProperty = data.lifecycleStage !== undefined
    ? await prisma.property.findUnique({ where: { id }, select: { lifecycleStage: true } })
    : null
  const oldStage = currentProperty?.lifecycleStage

  const updateData: Prisma.PropertyUpdateInput = {}
  if (data.address !== undefined) updateData.address = data.address
  if (data.district !== undefined) updateData.district = data.district
  if (data.type !== undefined) updateData.type = data.type as "BYT" | "DUM" | "POZEMEK" | "KOMERCNI"
  if (data.price !== undefined) updateData.price = data.price
  if (data.areaM2 !== undefined) updateData.areaM2 = data.areaM2
  if (data.status !== undefined) updateData.status = data.status as "AVAILABLE" | "IN_NEGOTIATION" | "SOLD" | "RENTED" | "WITHDRAWN"
  if (data.disposition !== undefined) updateData.disposition = data.disposition
  if (data.yearBuilt !== undefined) updateData.yearBuilt = data.yearBuilt
  if (data.lastRenovationYear !== undefined) updateData.lastRenovationYear = data.lastRenovationYear
  if (data.renovationNotes !== undefined) updateData.renovationNotes = data.renovationNotes
  if (data.lifecycleStage !== undefined) {
    updateData.lifecycleStage = data.lifecycleStage as "ACQUISITION" | "IN_RENOVATION" | "READY_FOR_SALE" | "LISTED" | "SOLD"
    updateData.stageChangedAt = new Date()
  }
  if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice
  if (data.renovationCost !== undefined) updateData.renovationCost = data.renovationCost
  if (data.expectedSalePrice !== undefined) updateData.expectedSalePrice = data.expectedSalePrice
  if (data.ownerId !== undefined) updateData.owner = { connect: { id: data.ownerId } }

  const result = await prisma.property.update({
    where: { id },
    data: updateData,
    include: { owner: { select: { name: true, email: true, phone: true } } },
  })

  // Auto-create/complete renovation on lifecycle stage transition
  if (data.lifecycleStage !== undefined && data.lifecycleStage !== oldStage) {
    if (data.lifecycleStage === "IN_RENOVATION") {
      // Create renovation if none active
      await prisma.$transaction(async (tx) => {
        const existing = await tx.renovation.findFirst({
          where: { propertyId: id, status: "ACTIVE" },
        })
        if (!existing) {
          await tx.renovation.create({
            data: { propertyId: id, phase: "PLANNING", status: "ACTIVE" },
          })
        }
      })
    } else if (oldStage === "IN_RENOVATION") {
      // Complete active renovation
      await prisma.renovation.updateMany({
        where: { propertyId: id, status: "ACTIVE" },
        data: { status: "COMPLETED", phase: "COMPLETED", actualEndAt: new Date() },
      })
    }
  }

  return result
}

export async function deletePropertyQuery(id: number) {
  return prisma.property.delete({ where: { id } })
}

// ─── Lifecycle pipeline query ──────────────────────────────────────────────

export async function getPropertiesByLifecycle(
  stage?: string,
  district?: string,
) {
  const where: Prisma.PropertyWhereInput = {}
  if (stage) where.lifecycleStage = stage as Prisma.EnumLifecycleStageNullableFilter["equals"]
  if (district) where.district = { contains: district, mode: "insensitive" }

  const [items, byStage] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { owner: { select: { name: true } } },
      orderBy: [{ lifecycleStage: "asc" }, { stageChangedAt: "asc" }],
    }),
    prisma.property.groupBy({
      by: ["lifecycleStage"],
      _count: true,
      where: district ? { district: { contains: district, mode: "insensitive" } } : undefined,
    }),
  ])

  return {
    items,
    byStage: byStage
      .filter((g) => g.lifecycleStage !== null)
      .map((g) => ({
        stage: g.lifecycleStage!,
        count: g._count,
      })),
  }
}

// ─── Profitability query ────────────────────────────────────────────────────

export async function getPropertiesWithCosts(filters?: {
  propertyId?: number
  district?: string
}) {
  const where: Prisma.PropertyWhereInput = {
    purchasePrice: { not: null },
  }
  if (filters?.propertyId) where.id = filters.propertyId
  if (filters?.district) where.district = { contains: filters.district, mode: "insensitive" }

  return prisma.property.findMany({
    where,
    orderBy: { price: "desc" },
  })
}
