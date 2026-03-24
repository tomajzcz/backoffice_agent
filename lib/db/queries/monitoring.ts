import { prisma } from "@/lib/db/prisma"

export async function getScheduledJobs() {
  return prisma.scheduledJob.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { results: true } },
    },
  })
}

export async function getScheduledJobById(id: number) {
  return prisma.scheduledJob.findUnique({
    where: { id },
    include: {
      results: {
        orderBy: { foundAt: "desc" },
        take: 20,
      },
    },
  })
}

export async function getMonitoringResultsByJob(jobId: number, days: number = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.monitoringResult.findMany({
    where: {
      jobId,
      foundAt: { gte: since },
    },
    orderBy: { foundAt: "desc" },
  })
}

export async function updateJobLastRun(jobId: number) {
  return prisma.scheduledJob.update({
    where: { id: jobId },
    data: {
      lastRunAt: new Date(),
    },
  })
}

// ─── Job CRUD ──────────────────────────────────────────────────────────────

export async function createScheduledJob(data: {
  name: string
  description?: string
  cronExpr: string
  notifyEmail?: string
  configJson: unknown
}) {
  return prisma.scheduledJob.create({
    data: {
      name: data.name,
      description: data.description,
      cronExpr: data.cronExpr,
      notifyEmail: data.notifyEmail || null,
      configJson: data.configJson as object,
      status: "ACTIVE",
    },
  })
}

export async function updateScheduledJob(id: number, data: {
  name?: string
  description?: string
  cronExpr?: string
  notifyEmail?: string | null
  configJson?: unknown
  status?: string
}) {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.cronExpr !== undefined) updateData.cronExpr = data.cronExpr
  if (data.notifyEmail !== undefined) updateData.notifyEmail = data.notifyEmail
  if (data.configJson !== undefined) updateData.configJson = data.configJson as object
  if (data.status !== undefined) updateData.status = data.status

  return prisma.scheduledJob.update({
    where: { id },
    data: updateData,
  })
}

export async function deleteScheduledJob(id: number) {
  // Delete results first (cascade)
  await prisma.monitoringResult.deleteMany({ where: { jobId: id } })
  return prisma.scheduledJob.delete({ where: { id } })
}

// ─── Monitoring Results ────────────────────────────────────────────────────

export async function createMonitoringResults(
  jobId: number,
  results: Array<{
    source: string
    title: string
    url: string
    price?: number | null
    district?: string | null
    disposition?: string | null
  }>,
) {
  return prisma.monitoringResult.createMany({
    data: results.map((r) => ({
      jobId,
      source: r.source,
      title: r.title,
      url: r.url,
      price: r.price ?? null,
      district: r.district ?? null,
      disposition: r.disposition ?? null,
      isNew: true,
    })),
  })
}
