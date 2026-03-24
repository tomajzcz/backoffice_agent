import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export interface ListDealsFilters {
  status?: string
  valueMin?: number
  valueMax?: number
  dateFrom?: string
  dateTo?: string
  clientId?: number
  propertyId?: number
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listDealsQuery(filters: ListDealsFilters) {
  const where: Prisma.DealWhereInput = {}

  if (filters.status) where.status = filters.status as Prisma.EnumDealStatusFilter["equals"]
  if (filters.valueMin || filters.valueMax) {
    where.value = {}
    if (filters.valueMin) where.value.gte = filters.valueMin
    if (filters.valueMax) where.value.lte = filters.valueMax
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }
  if (filters.clientId) where.clientId = filters.clientId
  if (filters.propertyId) where.propertyId = filters.propertyId

  const orderBy: Prisma.DealOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        client: { select: { name: true } },
        property: { select: { address: true, district: true } },
      },
    }),
    prisma.deal.count({ where }),
  ])

  return { items, total }
}

export async function createDealQuery(data: {
  propertyId: number
  clientId: number
  value: number
  status?: string
}) {
  const status = (data.status as "IN_PROGRESS" | "CLOSED_WON" | "CLOSED_LOST") ?? "IN_PROGRESS"
  return prisma.deal.create({
    data: {
      propertyId: data.propertyId,
      clientId: data.clientId,
      value: data.value,
      status,
      closedAt: status === "CLOSED_WON" ? new Date() : undefined,
    },
    include: {
      client: { select: { name: true } },
      property: { select: { address: true, district: true } },
    },
  })
}

export async function updateDealQuery(id: number, data: {
  status?: string
  value?: number
}) {
  const updateData: Prisma.DealUpdateInput = {}
  if (data.value !== undefined) updateData.value = data.value
  if (data.status !== undefined) {
    updateData.status = data.status as "IN_PROGRESS" | "CLOSED_WON" | "CLOSED_LOST"
    if (data.status === "CLOSED_WON") updateData.closedAt = new Date()
  }

  return prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { name: true } },
      property: { select: { address: true, district: true } },
    },
  })
}

export async function deleteDealQuery(id: number) {
  return prisma.deal.delete({ where: { id } })
}
