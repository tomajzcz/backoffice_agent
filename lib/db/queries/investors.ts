import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

// ─── List / paginated query ────────────────────────────────────────────────

export interface ListInvestorsFilters {
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listInvestorsQuery(filters: ListInvestorsFilters) {
  const where: Prisma.InvestorWhereInput = {}
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const orderBy: Prisma.InvestorOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.investor.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        properties: {
          include: {
            property: { select: { price: true } },
          },
        },
      },
    }),
    prisma.investor.count({ where }),
  ])

  return { items, total }
}

export async function createInvestorQuery(data: {
  name: string
  email: string
  phone?: string
  company?: string
  notes?: string
}) {
  return prisma.investor.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      notes: data.notes ?? null,
    },
  })
}

export async function updateInvestorQuery(id: number, data: {
  name?: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}) {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.company !== undefined) updateData.company = data.company
  if (data.notes !== undefined) updateData.notes = data.notes

  return prisma.investor.update({ where: { id }, data: updateData })
}

export async function deleteInvestorQuery(id: number) {
  await prisma.investorProperty.deleteMany({ where: { investorId: id } })
  return prisma.investor.delete({ where: { id } })
}

// ─── Agent tool queries ────────────────────────────────────────────────────

export async function getInvestorOverview(investorId?: number, investorName?: string) {
  const where: Record<string, unknown> = {}
  if (investorId) where.id = investorId
  if (investorName) where.name = { contains: investorName, mode: "insensitive" }

  const investors = await prisma.investor.findMany({
    where,
    include: {
      properties: {
        include: {
          property: {
            select: {
              id: true,
              address: true,
              district: true,
              price: true,
              lifecycleStage: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return investors.map((inv) => {
    const totalInvested = inv.properties.reduce(
      (sum, ip) => sum + (ip.investedAmount ? Number(ip.investedAmount) : 0),
      0,
    )
    const totalCurrentValue = inv.properties.reduce(
      (sum, ip) => sum + Number(ip.property.price),
      0,
    )

    return {
      id: inv.id,
      name: inv.name,
      email: inv.email,
      phone: inv.phone,
      company: inv.company,
      propertyCount: inv.properties.length,
      totalInvested,
      totalCurrentValue,
      properties: inv.properties.map((ip) => ({
        id: ip.property.id,
        address: ip.property.address,
        district: ip.property.district,
        lifecycleStage: ip.property.lifecycleStage,
        status: ip.property.status,
        investedAmount: ip.investedAmount ? Number(ip.investedAmount) : null,
        currentValue: Number(ip.property.price),
      })),
    }
  })
}
