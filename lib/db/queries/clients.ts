import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export interface ClientRow {
  id: number
  name: string
  email: string
  phone: string | null
  acquisitionSource: string
  segment: string
  createdAt: Date
}

export async function getNewClientsByQuarter(
  year: number,
  quarter: number
): Promise<ClientRow[]> {
  const quarterStart = new Date(year, (quarter - 1) * 3, 1)
  const quarterEnd = new Date(year, quarter * 3, 1)

  const clients = await prisma.client.findMany({
    where: {
      createdAt: {
        gte: quarterStart,
        lt: quarterEnd,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    acquisitionSource: c.acquisitionSource,
    segment: c.segment,
    createdAt: c.createdAt,
  }))
}

export async function getClientsByYear(year: number): Promise<ClientRow[]> {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year + 1, 0, 1)

  const clients = await prisma.client.findMany({
    where: {
      createdAt: {
        gte: yearStart,
        lt: yearEnd,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    acquisitionSource: c.acquisitionSource,
    segment: c.segment,
    createdAt: c.createdAt,
  }))
}

// ─── CRUD queries ─────────────────────────────────────────────────────────────

export interface ListClientsFilters {
  segment?: string
  acquisitionSource?: string
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listClientsQuery(filters: ListClientsFilters) {
  const where: Prisma.ClientWhereInput = {}

  if (filters.segment) where.segment = filters.segment as Prisma.EnumClientSegmentFilter["equals"]
  if (filters.acquisitionSource) where.acquisitionSource = filters.acquisitionSource as Prisma.EnumAcquisitionSourceFilter["equals"]
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const orderBy: Prisma.ClientOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, take: filters.limit, skip: filters.offset, orderBy }),
    prisma.client.count({ where }),
  ])

  return { items, total }
}

export async function createClientQuery(data: {
  name: string
  email: string
  phone?: string
  acquisitionSource: string
  segment: string
}) {
  return prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      acquisitionSource: data.acquisitionSource as "SREALITY" | "BEZREALITKY" | "DOPORUCENI" | "WEB" | "INZERCE" | "LINKEDIN",
      segment: data.segment as "INVESTOR" | "PRVNI_KUPUJICI" | "UPGRADER" | "DOWNGRADER" | "PRENAJIMATEL",
    },
  })
}

export async function updateClientQuery(id: number, data: {
  name?: string
  email?: string
  phone?: string
  acquisitionSource?: string
  segment?: string
}) {
  const updateData: Prisma.ClientUpdateInput = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.acquisitionSource !== undefined) updateData.acquisitionSource = data.acquisitionSource as "SREALITY" | "BEZREALITKY" | "DOPORUCENI" | "WEB" | "INZERCE" | "LINKEDIN"
  if (data.segment !== undefined) updateData.segment = data.segment as "INVESTOR" | "PRVNI_KUPUJICI" | "UPGRADER" | "DOWNGRADER" | "PRENAJIMATEL"

  return prisma.client.update({ where: { id }, data: updateData })
}

export async function deleteClientQuery(id: number) {
  return prisma.client.delete({ where: { id } })
}
