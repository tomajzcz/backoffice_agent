import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

// ─── Refresh delayed flags ──────────────────────────────────────────────────

async function refreshDelayedFlags() {
  const now = new Date()
  await Promise.all([
    // Mark as delayed: active, past planned end, not yet flagged
    prisma.renovation.updateMany({
      where: {
        status: "ACTIVE",
        plannedEndAt: { lt: now },
        isDelayed: false,
      },
      data: { isDelayed: true },
    }),
    // Unmark delayed: either completed or planned end is in the future
    prisma.renovation.updateMany({
      where: {
        isDelayed: true,
        OR: [
          { status: { not: "ACTIVE" } },
          { plannedEndAt: { gte: now } },
          { plannedEndAt: null },
        ],
      },
      data: { isDelayed: false },
    }),
  ])
}

// ─── List / paginated query ─────────────────────────────────────────────────

export interface ListRenovationsFilters {
  status?: string
  phase?: string
  isDelayed?: boolean
  search?: string
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}

export async function listRenovationsQuery(filters: ListRenovationsFilters) {
  await refreshDelayedFlags()

  const where: Prisma.RenovationWhereInput = {}

  if (filters.status) where.status = filters.status as Prisma.EnumRenovationStatusFilter["equals"]
  if (filters.phase) where.phase = filters.phase as Prisma.EnumRenovationPhaseFilter["equals"]
  if (filters.isDelayed !== undefined) where.isDelayed = filters.isDelayed
  if (filters.search) {
    where.property = { address: { contains: filters.search, mode: "insensitive" } }
  }

  const orderBy: Prisma.RenovationOrderByWithRelationInput = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.renovation.findMany({
      where,
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        property: { select: { address: true, district: true } },
        tasks: {
          select: { id: true, status: true, dueDate: true },
        },
      },
    }),
    prisma.renovation.count({ where }),
  ])

  const now = new Date()
  const mapped = items.map((r) => {
    const openTasks = r.tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now)
    return {
      id: r.id,
      propertyId: r.propertyId,
      propertyAddress: r.property.address,
      propertyDistrict: r.property.district,
      phase: r.phase,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      plannedEndAt: r.plannedEndAt?.toISOString() ?? null,
      actualEndAt: r.actualEndAt?.toISOString() ?? null,
      isDelayed: r.isDelayed,
      nextStep: r.nextStep,
      blockers: r.blockers,
      ownerName: r.ownerName,
      contractorName: r.contractorName,
      budgetPlanned: r.budgetPlanned ? Number(r.budgetPlanned) : null,
      budgetActual: r.budgetActual ? Number(r.budgetActual) : null,
      notes: r.notes,
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
    }
  })

  return { items: mapped, total }
}

// ─── Detail query ───────────────────────────────────────────────────────────

export async function getRenovationByIdQuery(id: number) {
  await refreshDelayedFlags()

  return prisma.renovation.findUnique({
    where: { id },
    include: {
      property: { select: { address: true, district: true, type: true, disposition: true } },
      tasks: {
        include: {
          property: { select: { address: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

// ─── Active renovation for property ─────────────────────────────────────────

export async function getActiveRenovationForProperty(propertyId: number) {
  return prisma.renovation.findFirst({
    where: { propertyId, status: "ACTIVE" },
  })
}

// ─── CRUD queries ───────────────────────────────────────────────────────────

export async function createRenovationQuery(data: {
  propertyId: number
  phase?: string
  status?: string
  plannedEndAt?: Date
  nextStep?: string
  blockers?: string
  ownerName?: string
  contractorName?: string
  budgetPlanned?: number
  budgetActual?: number
  notes?: string
}) {
  // Enforce: only one active renovation per property
  const existing = await prisma.renovation.findFirst({
    where: { propertyId: data.propertyId, status: "ACTIVE" },
  })
  if (existing) {
    throw new Error("Nemovitost již má aktivní rekonstrukci (ID: " + existing.id + ").")
  }

  const renovation = await prisma.renovation.create({
    data: {
      propertyId: data.propertyId,
      phase: (data.phase as "PLANNING" | "DEMOLITION" | "ROUGH_WORK" | "INSTALLATIONS" | "SURFACES" | "FINISHING" | "READY_FOR_HANDOVER" | "COMPLETED" | "ON_HOLD") ?? "PLANNING",
      status: (data.status as "ACTIVE" | "COMPLETED" | "ON_HOLD") ?? "ACTIVE",
      plannedEndAt: data.plannedEndAt,
      nextStep: data.nextStep,
      blockers: data.blockers,
      ownerName: data.ownerName,
      contractorName: data.contractorName,
      budgetPlanned: data.budgetPlanned,
      budgetActual: data.budgetActual,
      notes: data.notes,
    },
    include: {
      property: { select: { address: true, district: true } },
    },
  })

  // Auto-sync: set property lifecycleStage to IN_RENOVATION
  await prisma.property.updateMany({
    where: { id: data.propertyId, lifecycleStage: { not: "IN_RENOVATION" } },
    data: { lifecycleStage: "IN_RENOVATION", stageChangedAt: new Date() },
  })

  return renovation
}

export async function updateRenovationQuery(id: number, data: {
  phase?: string
  status?: string
  plannedEndAt?: Date | null
  nextStep?: string | null
  blockers?: string | null
  ownerName?: string | null
  contractorName?: string | null
  budgetPlanned?: number | null
  budgetActual?: number | null
  notes?: string | null
}) {
  const updateData: Record<string, unknown> = {}
  if (data.phase !== undefined) updateData.phase = data.phase
  if (data.status !== undefined) {
    updateData.status = data.status
    if (data.status === "COMPLETED") {
      updateData.actualEndAt = new Date()
      if (!data.phase) updateData.phase = "COMPLETED"
    }
  }
  if (data.plannedEndAt !== undefined) updateData.plannedEndAt = data.plannedEndAt
  if (data.nextStep !== undefined) updateData.nextStep = data.nextStep
  if (data.blockers !== undefined) updateData.blockers = data.blockers
  if (data.ownerName !== undefined) updateData.ownerName = data.ownerName
  if (data.contractorName !== undefined) updateData.contractorName = data.contractorName
  if (data.budgetPlanned !== undefined) updateData.budgetPlanned = data.budgetPlanned
  if (data.budgetActual !== undefined) updateData.budgetActual = data.budgetActual
  if (data.notes !== undefined) updateData.notes = data.notes

  return prisma.renovation.update({
    where: { id },
    data: updateData,
    include: {
      property: { select: { address: true, district: true } },
    },
  })
}

export async function deleteRenovationQuery(id: number) {
  // Unlink tasks first
  await prisma.agentTask.updateMany({
    where: { renovationId: id },
    data: { renovationId: null },
  })
  return prisma.renovation.delete({ where: { id } })
}

// ─── Agent tool queries ─────────────────────────────────────────────────────

export async function getActiveRenovations(filters?: {
  phase?: string
  district?: string
  onlyDelayed?: boolean
}) {
  await refreshDelayedFlags()

  const where: Prisma.RenovationWhereInput = { status: "ACTIVE" }

  if (filters?.phase) where.phase = filters.phase as Prisma.EnumRenovationPhaseFilter["equals"]
  if (filters?.onlyDelayed) where.isDelayed = true
  if (filters?.district) {
    where.property = { district: { contains: filters.district, mode: "insensitive" } }
  }

  const items = await prisma.renovation.findMany({
    where,
    include: {
      property: { select: { address: true, district: true } },
      tasks: {
        select: { id: true, status: true, dueDate: true },
      },
    },
    orderBy: [{ isDelayed: "desc" }, { startedAt: "asc" }],
  })

  const now = new Date()
  return items.map((r) => {
    const openTasks = r.tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < now)
    return {
      id: r.id,
      propertyId: r.propertyId,
      propertyAddress: r.property.address,
      propertyDistrict: r.property.district,
      phase: r.phase,
      status: r.status,
      startedAt: r.startedAt,
      plannedEndAt: r.plannedEndAt,
      isDelayed: r.isDelayed,
      nextStep: r.nextStep,
      blockers: r.blockers,
      ownerName: r.ownerName,
      contractorName: r.contractorName,
      budgetPlanned: r.budgetPlanned ? Number(r.budgetPlanned) : null,
      budgetActual: r.budgetActual ? Number(r.budgetActual) : null,
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
    }
  })
}

export async function scanRenovationHealth() {
  await refreshDelayedFlags()

  const renovations = await prisma.renovation.findMany({
    where: { status: "ACTIVE" },
    include: {
      property: { select: { address: true, district: true } },
      tasks: {
        select: { id: true, status: true, dueDate: true },
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      },
    },
  })

  const now = new Date()

  const delayed: Array<{ renovationId: number; propertyAddress: string; detail: string }> = []
  const overBudget: typeof delayed = []
  const withBlockers: typeof delayed = []
  const missingContractor: typeof delayed = []
  const missingNextStep: typeof delayed = []
  const withOverdueTasks: typeof delayed = []

  for (const r of renovations) {
    const addr = r.property.address

    if (r.isDelayed) {
      const daysOver = r.plannedEndAt
        ? Math.ceil((now.getTime() - r.plannedEndAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      delayed.push({ renovationId: r.id, propertyAddress: addr, detail: `${daysOver} dní po termínu` })
    }

    if (r.budgetPlanned && r.budgetActual && Number(r.budgetActual) > Number(r.budgetPlanned)) {
      const pct = Math.round((Number(r.budgetActual) / Number(r.budgetPlanned)) * 100)
      overBudget.push({ renovationId: r.id, propertyAddress: addr, detail: `Čerpání ${pct}% rozpočtu` })
    }

    if (r.blockers) {
      withBlockers.push({ renovationId: r.id, propertyAddress: addr, detail: r.blockers })
    }

    if (!r.contractorName) {
      missingContractor.push({ renovationId: r.id, propertyAddress: addr, detail: "Chybí dodavatel" })
    }

    if (!r.nextStep) {
      missingNextStep.push({ renovationId: r.id, propertyAddress: addr, detail: "Chybí další krok" })
    }

    const overdueTasks = r.tasks.filter((t) => t.dueDate && t.dueDate < now)
    if (overdueTasks.length > 0) {
      withOverdueTasks.push({ renovationId: r.id, propertyAddress: addr, detail: `${overdueTasks.length} úkolů po termínu` })
    }
  }

  return {
    totalActive: renovations.length,
    delayed,
    overBudget,
    withBlockers,
    missingContractor,
    missingNextStep,
    withOverdueTasks,
  }
}
