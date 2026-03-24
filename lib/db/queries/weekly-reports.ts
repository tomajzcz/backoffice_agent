import { prisma } from "@/lib/db/prisma"

export interface WeeklyReportRow {
  id: number
  weekStart: Date
  newLeads: number
  newClients: number
  propertiesListed: number
  dealsClosed: number
  revenue: number
}

export async function getWeeklyReports(weeksBack: number): Promise<WeeklyReportRow[]> {
  const rows = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: "desc" },
    take: weeksBack,
  })

  // Return in chronological order (oldest first)
  return rows.reverse().map((r) => ({
    id: r.id,
    weekStart: r.weekStart,
    newLeads: r.newLeads,
    newClients: r.newClients,
    propertiesListed: r.propertiesListed,
    dealsClosed: r.dealsClosed,
    revenue: Number(r.revenue),
  }))
}
