import { prisma } from "@/lib/db/prisma"

// ─── AutomationConfig ────────────────────────────────────────────────────────

export async function getAutomationConfig(key: string) {
  return prisma.automationConfig.findUnique({ where: { key } })
}

export async function upsertAutomationConfig(
  key: string,
  data: { isActive?: boolean; recipientEmail?: string; cronExpr?: string },
) {
  return prisma.automationConfig.upsert({
    where: { key },
    update: data,
    create: {
      key,
      isActive: data.isActive ?? true,
      recipientEmail: data.recipientEmail ?? "",
      cronExpr: data.cronExpr ?? "",
    },
  })
}

// ─── ExecutiveReportRun ──────────────────────────────────────────────────────

export async function createReportRun(data: {
  trigger: string
  recipientEmail: string
}) {
  return prisma.executiveReportRun.create({
    data: {
      trigger: data.trigger,
      recipientEmail: data.recipientEmail,
      status: "RUNNING",
    },
  })
}

export async function updateReportRun(
  id: number,
  data: {
    status: "SUCCESS" | "FAILED"
    slideCount?: number
    pptxToken?: string
    errorMessage?: string
    finishedAt?: Date
  },
) {
  return prisma.executiveReportRun.update({
    where: { id },
    data: {
      status: data.status,
      slideCount: data.slideCount,
      pptxToken: data.pptxToken,
      errorMessage: data.errorMessage,
      finishedAt: data.finishedAt ?? new Date(),
    },
  })
}

export async function listReportRuns(filters: { limit: number; offset: number }) {
  const [items, total] = await Promise.all([
    prisma.executiveReportRun.findMany({
      orderBy: { startedAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.executiveReportRun.count(),
  ])

  return { items, total }
}
