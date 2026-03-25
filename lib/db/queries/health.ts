import { prisma } from "@/lib/db/prisma"

export interface HealthCategory {
  category: string
  items: Array<{ id: number; label: string; detail: string }>
}

export async function runOperationalHealthScan(
  stalledDealsDays: number = 30,
  showingFollowUpDays: number = 14,
): Promise<HealthCategory[]> {
  const now = new Date()
  const stalledSince = new Date(now)
  stalledSince.setDate(stalledSince.getDate() - stalledDealsDays)
  const followUpSince = new Date(now)
  followUpSince.setDate(followUpSince.getDate() - showingFollowUpDays)

  const [
    missingRenovation,
    overdueTasks,
    stalledDeals,
    completedShowings,
    propertiesWithoutOwner,
    missingLifecycle,
  ] = await Promise.all([
    // 1. Properties missing renovation data
    prisma.property.findMany({
      where: {
        lastRenovationYear: null,
        OR: [{ renovationNotes: null }, { renovationNotes: "" }],
      },
      select: { id: true, address: true, district: true },
      orderBy: { address: "asc" },
    }),

    // 2. Overdue tasks
    prisma.agentTask.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
      },
      orderBy: { dueDate: "asc" },
    }),

    // 3. Deals IN_PROGRESS stalled > N days
    prisma.deal.findMany({
      where: {
        status: "IN_PROGRESS",
        updatedAt: { lt: stalledSince },
      },
      select: {
        id: true,
        value: true,
        updatedAt: true,
        property: { select: { address: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),

    // 4. Completed showings without follow-up deal (completed before threshold)
    prisma.showing.findMany({
      where: {
        status: "COMPLETED",
        scheduledAt: { lt: followUpSince },
      },
      select: {
        id: true,
        propertyId: true,
        clientId: true,
        scheduledAt: true,
        property: { select: { address: true } },
        client: { select: { name: true } },
      },
    }),

    // 5. Properties without owner
    prisma.property.findMany({
      where: { ownerId: null, status: { notIn: ["SOLD", "WITHDRAWN"] } },
      select: { id: true, address: true, district: true },
      orderBy: { address: "asc" },
    }),

    // 6. Properties missing lifecycle stage
    prisma.property.findMany({
      where: { lifecycleStage: null, status: { notIn: ["SOLD", "WITHDRAWN"] } },
      select: { id: true, address: true, district: true },
      orderBy: { address: "asc" },
    }),
  ])

  // Filter completed showings that don't have a matching deal
  const showingsWithoutDeal: typeof completedShowings = []
  for (const showing of completedShowings) {
    const dealExists = await prisma.deal.findFirst({
      where: {
        propertyId: showing.propertyId,
        clientId: showing.clientId,
      },
    })
    if (!dealExists) {
      showingsWithoutDeal.push(showing)
    }
  }

  const categories: HealthCategory[] = []

  if (missingRenovation.length > 0) {
    categories.push({
      category: "missingRenovation",
      items: missingRenovation.map((p) => ({
        id: p.id,
        label: p.address,
        detail: `Čtvrť: ${p.district}`,
      })),
    })
  }

  if (overdueTasks.length > 0) {
    categories.push({
      category: "overdueTasks",
      items: overdueTasks.map((t) => {
        const daysOverdue = Math.ceil((now.getTime() - t.dueDate!.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: t.id,
          label: t.title,
          detail: `${daysOverdue} dní po termínu · priorita: ${t.priority}`,
        }
      }),
    })
  }

  if (stalledDeals.length > 0) {
    categories.push({
      category: "stalledDeals",
      items: stalledDeals.map((d) => {
        const daysSince = Math.ceil((now.getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: d.id,
          label: d.property.address,
          detail: `${daysSince} dní bez aktivity · ${Number(d.value).toLocaleString("cs-CZ")} Kč`,
        }
      }),
    })
  }

  if (showingsWithoutDeal.length > 0) {
    categories.push({
      category: "showingsWithoutFollowUp",
      items: showingsWithoutDeal.map((s) => ({
        id: s.id,
        label: `${s.property.address} — ${s.client.name}`,
        detail: `Prohlídka: ${s.scheduledAt.toLocaleDateString("cs-CZ")}`,
      })),
    })
  }

  if (propertiesWithoutOwner.length > 0) {
    categories.push({
      category: "propertiesWithoutOwner",
      items: propertiesWithoutOwner.map((p) => ({
        id: p.id,
        label: p.address,
        detail: `Čtvrť: ${p.district}`,
      })),
    })
  }

  if (missingLifecycle.length > 0) {
    categories.push({
      category: "missingLifecycle",
      items: missingLifecycle.map((p) => ({
        id: p.id,
        label: p.address,
        detail: `Čtvrť: ${p.district}`,
      })),
    })
  }

  return categories
}
