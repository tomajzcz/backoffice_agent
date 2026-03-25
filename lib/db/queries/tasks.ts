import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

// ─── List / paginated query ────────────────────────────────────────────────

export interface ListTasksFilters {
  status?: string
  priority?: string
  assignee?: string
  search?: string
  propertyId?: number
  renovationId?: number
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listTasksQuery(filters: ListTasksFilters) {
  const where: Prisma.AgentTaskWhereInput = {}

  if (filters.status) where.status = filters.status as Prisma.EnumTaskStatusFilter["equals"]
  if (filters.priority) where.priority = filters.priority as Prisma.EnumTaskPriorityFilter["equals"]
  if (filters.assignee) where.assignee = { contains: filters.assignee, mode: "insensitive" }
  if (filters.propertyId) where.propertyId = filters.propertyId
  if (filters.renovationId) where.renovationId = filters.renovationId
  if (filters.search) where.title = { contains: filters.search, mode: "insensitive" }

  const orderBy: Prisma.AgentTaskOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.agentTask.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        property: { select: { address: true } },
        deal: { select: { id: true } },
      },
    }),
    prisma.agentTask.count({ where }),
  ])

  return { items, total }
}

export async function deleteTaskQuery(id: number) {
  return prisma.agentTask.delete({ where: { id } })
}

// ─── Agent tool queries ────────────────────────────────────────────────────

export async function createTask(params: {
  title: string
  description?: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date
  assignee?: string
  propertyId?: number
  dealId?: number
  renovationId?: number
  sourceQuery?: string
}) {
  const task = await prisma.agentTask.create({
    data: {
      title: params.title,
      description: params.description ?? null,
      priority: params.priority,
      dueDate: params.dueDate ?? null,
      assignee: params.assignee ?? null,
      propertyId: params.propertyId ?? null,
      dealId: params.dealId ?? null,
      renovationId: params.renovationId ?? null,
      sourceQuery: params.sourceQuery ?? null,
      status: "OPEN",
    },
    include: {
      property: { select: { address: true } },
    },
  })

  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    dueDate: task.dueDate,
    assignee: task.assignee,
    propertyAddress: task.property?.address ?? null,
    dealId: task.dealId,
  }
}

export async function getOverdueTasks() {
  const now = new Date()

  return prisma.agentTask.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    include: {
      property: { select: { address: true } },
      deal: { select: { id: true } },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function getUpcomingTasks(daysAhead: number = 3) {
  const now = new Date()
  const future = new Date(now)
  future.setDate(future.getDate() + daysAhead)

  return prisma.agentTask.findMany({
    where: {
      dueDate: { gte: now, lte: future },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    include: {
      property: { select: { address: true } },
    },
    orderBy: { dueDate: "asc" },
  })
}

export async function updateTaskQuery(
  id: number,
  data: {
    status?: string
    priority?: string
    dueDate?: Date | null
    assignee?: string | null
    description?: string
  },
) {
  const updateData: Record<string, unknown> = {}
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
  if (data.assignee !== undefined) updateData.assignee = data.assignee
  if (data.description !== undefined) updateData.description = data.description

  return prisma.agentTask.update({
    where: { id },
    data: updateData,
    include: {
      property: { select: { address: true } },
      deal: { select: { id: true } },
    },
  })
}
