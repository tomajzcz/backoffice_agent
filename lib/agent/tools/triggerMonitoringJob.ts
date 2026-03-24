import { tool } from "ai"
import { z } from "zod"
import { getScheduledJobById, updateJobLastRun, createMonitoringResults } from "@/lib/db/queries/monitoring"
import { runScraper, type JobConfig } from "@/lib/scraper"
import { filterNewListings } from "@/lib/scraper/dedup"
import { sendMonitoringEmail } from "@/lib/scraper/notify"
import type { TriggerMonitoringJobResult } from "@/types/agent"

export const triggerMonitoringJobTool = tool({
  description:
    "Spustí monitorovací job okamžitě (mimo naplánovaný cron). " +
    "Provede scraping realitních serverů a uloží nové výsledky. " +
    "Pokud je nastaven email, odešle notifikaci s novými nabídkami.",
  parameters: z.object({
    jobId: z.number().describe("ID monitorovacího jobu ke spuštění"),
  }),
  execute: async ({ jobId }): Promise<TriggerMonitoringJobResult> => {
    const job = await getScheduledJobById(jobId)

    if (!job) {
      throw new Error(`Monitorovací job s ID ${jobId} nebyl nalezen`)
    }

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
      })))
    }

    // Update last run
    await updateJobLastRun(jobId)

    // Send email if configured
    if (job.notifyEmail && newListings.length > 0) {
      try {
        await sendMonitoringEmail(job.notifyEmail, job.name, newListings)
      } catch {
        // Email failed, but scraping succeeded
      }
    }

    const message = newListings.length > 0
      ? `Nalezeno ${newListings.length} nových nabídek (z celkem ${allListings.length} scrapovaných).${job.notifyEmail ? ` Email odeslán na ${job.notifyEmail}.` : ""}`
      : `Žádné nové nabídky (scrapováno ${allListings.length} inzerátů, všechny již známé).`

    return {
      toolName: "triggerMonitoringJob",
      jobId: job.id,
      jobName: job.name,
      triggered: true,
      message,
      triggeredAt: new Date().toISOString(),
      chartType: "none",
    }
  },
})
