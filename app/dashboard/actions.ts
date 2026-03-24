"use server"

import { revalidatePath } from "next/cache"
import {
  getScheduledJobs,
  getScheduledJobById,
  createScheduledJob,
  updateScheduledJob,
  deleteScheduledJob,
  updateJobLastRun,
  createMonitoringResults,
} from "@/lib/db/queries/monitoring"
import { runScraper, type JobConfig } from "@/lib/scraper"
import { filterNewListings } from "@/lib/scraper/dedup"
import { sendMonitoringEmail } from "@/lib/scraper/notify"

type ActionResult = { success: true; data?: unknown } | { success: false; error: string }

export async function listJobsAction() {
  const jobs = await getScheduledJobs()
  return jobs.map((j) => ({
    id: j.id,
    name: j.name,
    description: j.description,
    cronExpr: j.cronExpr,
    lastRunAt: j.lastRunAt?.toISOString() ?? null,
    status: j.status,
    configJson: j.configJson as unknown as JobConfig,
    notifyEmail: j.notifyEmail,
    createdAt: j.createdAt.toISOString(),
    resultsCount: j._count.results,
  }))
}

export async function createJobAction(data: {
  name: string
  description?: string
  cronExpr: string
  notifyEmail?: string
  configJson: JobConfig
}): Promise<ActionResult> {
  try {
    const job = await createScheduledJob(data)
    revalidatePath("/dashboard")
    return { success: true, data: { id: job.id } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba při vytváření" }
  }
}

export async function updateJobAction(id: number, data: {
  name?: string
  description?: string
  cronExpr?: string
  notifyEmail?: string | null
  configJson?: JobConfig
  status?: string
}): Promise<ActionResult> {
  try {
    await updateScheduledJob(id, data)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba při aktualizaci" }
  }
}

export async function deleteJobAction(id: number): Promise<ActionResult> {
  try {
    await deleteScheduledJob(id)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba při mazání" }
  }
}

export async function toggleJobStatusAction(id: number): Promise<ActionResult> {
  try {
    const job = await getScheduledJobById(id)
    if (!job) return { success: false, error: "Job nenalezen" }
    const newStatus = job.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    await updateScheduledJob(id, { status: newStatus })
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function runJobNowAction(id: number): Promise<ActionResult & { newCount?: number }> {
  try {
    const job = await getScheduledJobById(id)
    if (!job) return { success: false, error: "Job nenalezen" }

    const config = job.configJson as unknown as JobConfig
    const allListings = await runScraper(config)
    const newListings = await filterNewListings(job.id, allListings)

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

    await updateJobLastRun(job.id)

    if (job.notifyEmail && newListings.length > 0) {
      try {
        await sendMonitoringEmail(job.notifyEmail, job.name, newListings)
      } catch { /* email failed */ }
    }

    revalidatePath("/dashboard")
    return {
      success: true,
      newCount: newListings.length,
      data: { scraped: allListings.length, new: newListings.length },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba při spouštění" }
  }
}
