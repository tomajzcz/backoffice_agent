import { prisma } from "@/lib/db/prisma"
import type { CallStatus } from "@prisma/client"

/**
 * Get today's SCHEDULED showings with client and property data.
 */
export async function getTodaysScheduledShowings(today: Date) {
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  return prisma.showing.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      client: { select: { id: true, name: true, phone: true, email: true } },
      property: { select: { id: true, address: true, district: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

/**
 * Check which showings already have a call log for the given date.
 * Returns a Set of showingIds that have already been processed.
 */
export async function getExistingCallLogsForDate(
  showingIds: number[],
  callDate: Date,
): Promise<Set<number>> {
  const dateOnly = new Date(callDate)
  dateOnly.setHours(0, 0, 0, 0)

  const existing = await prisma.callLog.findMany({
    where: {
      showingId: { in: showingIds },
      callDate: dateOnly,
    },
    select: { showingId: true },
  })

  return new Set(existing.map((r) => r.showingId))
}

/**
 * Create a call log entry.
 */
export async function createCallLog(data: {
  showingId: number
  clientId: number
  phoneNormalized: string | null
  status: CallStatus
  elevenLabsCallId?: string
  errorMessage?: string
  callDate: Date
}) {
  const dateOnly = new Date(data.callDate)
  dateOnly.setHours(0, 0, 0, 0)

  return prisma.callLog.create({
    data: {
      showingId: data.showingId,
      clientId: data.clientId,
      phoneNormalized: data.phoneNormalized,
      status: data.status,
      elevenLabsCallId: data.elevenLabsCallId ?? null,
      errorMessage: data.errorMessage ?? null,
      callDate: dateOnly,
    },
  })
}

/**
 * List call logs with pagination, including client and property data.
 */
export async function listCallLogs(filters: {
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}) {
  const orderBy = { [filters.sortBy]: filters.sortOrder }

  const [items, total] = await Promise.all([
    prisma.callLog.findMany({
      take: filters.limit,
      skip: filters.offset,
      orderBy,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        showing: {
          include: {
            property: { select: { id: true, address: true, district: true } },
          },
        },
      },
    }),
    prisma.callLog.count(),
  ])

  return { items, total }
}

/**
 * Update call log status after ElevenLabs API response.
 */
export async function updateCallLogStatus(
  id: number,
  data: {
    status: CallStatus
    elevenLabsCallId?: string
    errorMessage?: string
  },
) {
  return prisma.callLog.update({
    where: { id },
    data: {
      status: data.status,
      elevenLabsCallId: data.elevenLabsCallId,
      errorMessage: data.errorMessage,
    },
  })
}
