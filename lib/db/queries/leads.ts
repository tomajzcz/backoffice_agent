import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export interface MonthlyLeadData {
  month: string       // "2025-01"
  monthLabel: string  // "Led 2025"
  leads: number
  converted: number
  soldProperties: number
}

const CZECH_MONTHS = [
  "Led", "Úno", "Bře", "Dub", "Kvě", "Čer",
  "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro",
]

function monthLabel(year: number, month: number): string {
  return `${CZECH_MONTHS[month - 1]} ${year}`
}

// ─── CRUD queries ─────────────────────────────────────────────────────────────

export interface ListLeadsFilters {
  source?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listLeadsQuery(filters: ListLeadsFilters) {
  const where: Prisma.LeadWhereInput = {}

  if (filters.source) where.source = filters.source as Prisma.EnumAcquisitionSourceFilter["equals"]
  if (filters.status) where.status = filters.status as Prisma.EnumLeadStatusFilter["equals"]
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.lead.findMany({ where, take: filters.limit, skip: filters.offset, orderBy }),
    prisma.lead.count({ where }),
  ])

  return { items, total }
}

export async function createLeadQuery(data: {
  name: string
  email: string
  phone?: string
  source: string
  propertyInterest?: string
  status?: string
}) {
  return prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      source: data.source as "SREALITY" | "BEZREALITKY" | "DOPORUCENI" | "WEB" | "INZERCE" | "LINKEDIN",
      propertyInterest: data.propertyInterest,
      status: (data.status as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST") ?? "NEW",
      convertedAt: data.status === "CONVERTED" ? new Date() : undefined,
    },
  })
}

export async function updateLeadQuery(id: number, data: {
  name?: string
  email?: string
  phone?: string
  source?: string
  status?: string
  propertyInterest?: string
}) {
  const updateData: Prisma.LeadUpdateInput = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.source !== undefined) updateData.source = data.source as "SREALITY" | "BEZREALITKY" | "DOPORUCENI" | "WEB" | "INZERCE" | "LINKEDIN"
  if (data.propertyInterest !== undefined) updateData.propertyInterest = data.propertyInterest
  if (data.status !== undefined) {
    updateData.status = data.status as "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST"
    if (data.status === "CONVERTED") updateData.convertedAt = new Date()
  }

  return prisma.lead.update({ where: { id }, data: updateData })
}

// ─── Analytics queries ────────────────────────────────────────────────────────

export async function getLeadsSalesTimeline(monthsBack: number): Promise<MonthlyLeadData[]> {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1)

  // Query leads grouped by month
  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      convertedAt: true,
    },
  })

  // Query closed deals grouped by month
  const deals = await prisma.deal.findMany({
    where: {
      status: "CLOSED_WON",
      closedAt: { gte: startDate, not: null },
    },
    select: {
      closedAt: true,
    },
  })

  // Build month buckets
  const buckets: Map<string, MonthlyLeadData> = new Map()

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    buckets.set(key, {
      month: key,
      monthLabel: monthLabel(d.getFullYear(), d.getMonth() + 1),
      leads: 0,
      converted: 0,
      soldProperties: 0,
    })
  }

  // Count leads per month
  for (const lead of leads) {
    const d = new Date(lead.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.leads++
      if (lead.convertedAt) bucket.converted++
    }
  }

  // Count sold properties per month
  for (const deal of deals) {
    if (!deal.closedAt) continue
    const d = new Date(deal.closedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const bucket = buckets.get(key)
    if (bucket) bucket.soldProperties++
  }

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export async function deleteLeadQuery(id: number) {
  return prisma.lead.delete({ where: { id } })
}
