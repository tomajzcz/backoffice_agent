import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export interface ListShowingsFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  propertyId?: number
  clientId?: number
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listShowingsQuery(filters: ListShowingsFilters) {
  const where: Prisma.ShowingWhereInput = {}

  if (filters.status) where.status = filters.status as Prisma.EnumShowingStatusFilter["equals"]
  if (filters.dateFrom || filters.dateTo) {
    where.scheduledAt = {}
    if (filters.dateFrom) where.scheduledAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.scheduledAt.lte = new Date(filters.dateTo)
  }
  if (filters.propertyId) where.propertyId = filters.propertyId
  if (filters.clientId) where.clientId = filters.clientId

  const orderBy: Prisma.ShowingOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.showing.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        client: { select: { name: true } },
        property: { select: { address: true, district: true } },
      },
    }),
    prisma.showing.count({ where }),
  ])

  return { items, total }
}

export async function createShowingQuery(data: {
  propertyId: number
  clientId: number
  scheduledAt: string
  notes?: string
  googleCalendarEventId?: string
}) {
  return prisma.showing.create({
    data: {
      propertyId: data.propertyId,
      clientId: data.clientId,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes,
      googleCalendarEventId: data.googleCalendarEventId,
    },
    include: {
      client: { select: { name: true } },
      property: { select: { address: true, district: true } },
    },
  })
}

export async function updateShowingQuery(id: number, data: {
  status?: string
  scheduledAt?: string
  notes?: string
  googleCalendarEventId?: string | null
}) {
  const updateData: Prisma.ShowingUpdateInput = {}
  if (data.status !== undefined) updateData.status = data.status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt)
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.googleCalendarEventId !== undefined) updateData.googleCalendarEventId = data.googleCalendarEventId

  return prisma.showing.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { name: true } },
      property: { select: { address: true, district: true } },
    },
  })
}

export async function getShowingByIdQuery(id: number) {
  return prisma.showing.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      property: { select: { address: true, district: true } },
    },
  })
}

export async function deleteShowingQuery(id: number) {
  return prisma.showing.delete({ where: { id } })
}
