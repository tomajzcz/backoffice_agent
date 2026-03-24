import { prisma } from "@/lib/db/prisma"
import type { ScrapedListing } from "./types"

/**
 * Filter out listings that already exist in monitoring_results for this job.
 * Compares by URL to avoid duplicates.
 */
export async function filterNewListings(
  jobId: number,
  listings: ScrapedListing[],
): Promise<ScrapedListing[]> {
  if (listings.length === 0) return []

  const urls = listings.map((l) => l.url)

  const existing = await prisma.monitoringResult.findMany({
    where: {
      jobId,
      url: { in: urls },
    },
    select: { url: true },
  })

  const existingUrls = new Set(existing.map((r) => r.url))

  return listings.filter((l) => !existingUrls.has(l.url))
}
