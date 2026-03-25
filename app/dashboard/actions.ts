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
import { listCallLogs } from "@/lib/db/queries/call-logs"

type CallLogItem = Awaited<ReturnType<typeof listCallLogs>>["items"][number]
import {
  getTodaysScheduledShowings,
  getExistingCallLogsForDate,
  createCallLog,
  updateCallLogStatus,
} from "@/lib/db/queries/call-logs"
import { initiateOutboundCall } from "@/lib/integrations/elevenlabs"
import { normalizePhoneE164 } from "@/lib/utils/phone"

type ActionResult = { success: true; data?: unknown } | { success: false; error: string }

export interface CallLogRow {
  id: number
  callDate: string
  clientName: string
  clientPhone: string | null
  phoneNormalized: string | null
  propertyAddress: string
  showingTime: string
  status: string
  errorMessage: string | null
  createdAt: string
}

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

// ─── Reminder Calls Actions ─────────────────────────────────────────────────

export async function listCallLogsAction(filters: {
  limit: number
  offset: number
  sortBy: string
  sortOrder: "asc" | "desc"
}): Promise<{ items: CallLogRow[]; total: number }> {
  const { items, total } = await listCallLogs(filters)

  return {
    items: items.map((c: CallLogItem) => ({
      id: c.id,
      callDate: c.callDate.toISOString().slice(0, 10),
      clientName: c.client.name,
      clientPhone: c.client.phone,
      phoneNormalized: c.phoneNormalized,
      propertyAddress: c.showing.property.address,
      showingTime: c.showing.scheduledAt.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Prague",
      }),
      status: c.status,
      errorMessage: c.errorMessage,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
  }
}

export async function triggerReminderCallsAction(): Promise<ActionResult> {
  try {
    const agentId = process.env.ELEVENLABS_AGENT_ID
    if (!agentId) {
      return { success: false, error: "ELEVENLABS_AGENT_ID není nakonfigurováno" }
    }

    const today = new Date()
    const showings = await getTodaysScheduledShowings(today)

    if (showings.length === 0) {
      return { success: true, data: { message: "Žádné prohlídky pro dnešek", initiated: 0, skipped: 0, failed: 0 } }
    }

    const showingIds = showings.map((s) => s.id)
    const alreadyCalled = await getExistingCallLogsForDate(showingIds, today)

    let initiated = 0
    let skipped = 0
    let failed = 0

    for (const showing of showings) {
      if (alreadyCalled.has(showing.id)) {
        skipped++
        continue
      }

      const normalizedPhone = normalizePhoneE164(showing.client.phone)

      if (!normalizedPhone) {
        try {
          await createCallLog({
            showingId: showing.id,
            clientId: showing.client.id,
            phoneNormalized: null,
            status: "NO_PHONE",
            errorMessage: showing.client.phone
              ? `Nelze normalizovat: ${showing.client.phone}`
              : "Klient nemá telefon",
            callDate: today,
          })
        } catch { /* duplicate */ }
        skipped++
        continue
      }

      let callLogId: number
      try {
        const callLog = await createCallLog({
          showingId: showing.id,
          clientId: showing.client.id,
          phoneNormalized: normalizedPhone,
          status: "PENDING",
          callDate: today,
        })
        callLogId = callLog.id
      } catch {
        skipped++
        continue
      }

      const showingTime = showing.scheduledAt.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Prague",
      })
      const showingDate = showing.scheduledAt.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Prague",
      })

      try {
        const result = await initiateOutboundCall({
          phoneNumber: normalizedPhone,
          agentId,
          dynamicVariables: {
            customer_name: showing.client.name,
            customer_email: showing.client.email,
            customer_phone: normalizedPhone,
            property_address: showing.property.address,
            showing_time: showingTime,
            showing_date: showingDate,
            system_time: new Date().toISOString(),
          },
        })

        await updateCallLogStatus(callLogId, {
          status: "INITIATED",
          elevenLabsCallId: result.callId,
        })
        initiated++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        await updateCallLogStatus(callLogId, {
          status: "FAILED",
          errorMessage: errorMsg.slice(0, 500),
        })
        failed++
      }
    }

    revalidatePath("/dashboard")
    return {
      success: true,
      data: {
        message: `Zpracováno ${showings.length} prohlídek: ${initiated} hovorů, ${skipped} přeskočeno, ${failed} selhalo`,
        initiated,
        skipped,
        failed,
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Chyba při spouštění hovorů" }
  }
}
