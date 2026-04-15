import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { runScraper, type JobConfig } from "@/lib/scraper"
import { filterNewListings } from "@/lib/scraper/dedup"
import { sendMonitoringEmail } from "@/lib/scraper/notify"
import { createMonitoringResults, updateJobLastRun } from "@/lib/db/queries/monitoring"
import { requireBearer } from "@/lib/security/require-bearer"

export const maxDuration = 60 // Vercel function timeout

export async function GET(req: NextRequest) {
  const auth = requireBearer(req, "CRON_SECRET")
  if (!auth.ok) return auth.response

  const jobs = await prisma.scheduledJob.findMany({
    where: { status: "ACTIVE" },
  })

  let totalNew = 0
  const jobResults: Array<{ jobId: number; name: string; scraped: number; new: number }> = []

  for (const job of jobs) {
    try {
      const config = job.configJson as unknown as JobConfig

      // Run scraper
      const allListings = await runScraper(config)

      // Filter to only new ones
      const newListings = await filterNewListings(job.id, allListings)

      // Save to DB
      if (newListings.length > 0) {
        await createMonitoringResults(job.id, newListings.map((l) => ({
          source: l.source,
          title: l.title,
          url: l.url,
          price: l.price,
          district: l.district,
          disposition: l.disposition,
          areaM2: l.areaM2,
        })))
      }

      // Update last run
      await updateJobLastRun(job.id)

      // Send email notification
      if (job.notifyEmail && newListings.length > 0) {
        try {
          await sendMonitoringEmail(job.notifyEmail, job.name, newListings)
        } catch (emailErr) {
          console.error(`[cron] Email failed for job ${job.id}:`, emailErr)
        }
      }

      totalNew += newListings.length
      jobResults.push({
        jobId: job.id,
        name: job.name,
        scraped: allListings.length,
        new: newListings.length,
      })
    } catch (err) {
      console.error(`[cron] Job ${job.id} (${job.name}) failed:`, err)
      jobResults.push({ jobId: job.id, name: job.name, scraped: 0, new: 0 })
    }
  }

  return NextResponse.json({
    success: true,
    jobsRun: jobs.length,
    totalNew,
    details: jobResults,
  })
}
