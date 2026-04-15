import { NextRequest, NextResponse } from "next/server"
import {
  getTodaysScheduledShowings,
  getExistingCallLogsForDate,
  createCallLog,
  updateCallLogStatus,
} from "@/lib/db/queries/call-logs"
import { initiateOutboundCall } from "@/lib/integrations/elevenlabs"
import { normalizePhoneE164 } from "@/lib/utils/phone"
import { requireBearer } from "@/lib/security/require-bearer"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = requireBearer(req, "CRON_SECRET")
  if (!auth.ok) return auth.response

  const agentId = process.env.ELEVENLABS_AGENT_ID
  if (!agentId) {
    console.error("[reminder-calls] ELEVENLABS_AGENT_ID is not configured")
    return NextResponse.json(
      { error: "ELEVENLABS_AGENT_ID is not configured" },
      { status: 500 },
    )
  }

  const today = new Date()
  console.log(`[reminder-calls] Starting daily reminder calls for ${today.toISOString().slice(0, 10)}`)

  // Step 1: Fetch today's scheduled showings
  const showings = await getTodaysScheduledShowings(today)
  console.log(`[reminder-calls] Found ${showings.length} scheduled showings for today`)

  if (showings.length === 0) {
    return NextResponse.json({
      success: true,
      message: "Žádné naplánované prohlídky pro dnešek",
      totalShowings: 0,
      callsInitiated: 0,
      callsSkipped: 0,
      callsFailed: 0,
      details: [],
    })
  }

  // Step 2: Deduplication — check which showings already have call logs today
  const showingIds = showings.map((s) => s.id)
  const alreadyCalled = await getExistingCallLogsForDate(showingIds, today)

  let callsInitiated = 0
  let callsSkipped = 0
  let callsFailed = 0
  const details: Array<{
    showingId: number
    clientName: string
    phone: string | null
    status: string
    error?: string
  }> = []

  for (const showing of showings) {
    // Skip if already processed today (idempotency)
    if (alreadyCalled.has(showing.id)) {
      callsSkipped++
      details.push({
        showingId: showing.id,
        clientName: showing.client.name,
        phone: showing.client.phone,
        status: "SKIPPED",
      })
      console.log(`[reminder-calls] Skipping showing ${showing.id} (${showing.client.name}) — already called today`)
      continue
    }

    const normalizedPhone = normalizePhoneE164(showing.client.phone)

    // Skip if no valid phone number
    if (!normalizedPhone) {
      const reason = showing.client.phone
        ? `Nelze normalizovat: ${showing.client.phone}`
        : "Klient nemá telefon"

      try {
        await createCallLog({
          showingId: showing.id,
          clientId: showing.client.id,
          phoneNormalized: null,
          status: "NO_PHONE",
          errorMessage: reason,
          callDate: today,
        })
      } catch (err) {
        // Unique constraint violation means already logged — safe to ignore
        console.warn(`[reminder-calls] CallLog already exists for showing ${showing.id}:`, err)
      }

      callsSkipped++
      details.push({
        showingId: showing.id,
        clientName: showing.client.name,
        phone: showing.client.phone,
        status: "NO_PHONE",
      })
      console.log(`[reminder-calls] Skipping showing ${showing.id} (${showing.client.name}) — ${reason}`)
      continue
    }

    // Step 3: Create PENDING call log before API call (crash-safe audit trail)
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
    } catch (err) {
      // Unique constraint violation — already processed
      callsSkipped++
      details.push({
        showingId: showing.id,
        clientName: showing.client.name,
        phone: normalizedPhone,
        status: "SKIPPED",
      })
      console.log(`[reminder-calls] Skipping showing ${showing.id} — duplicate call log`)
      continue
    }

    // Format showing time in Prague timezone
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

    // Step 4: Call ElevenLabs API
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

      callsInitiated++
      details.push({
        showingId: showing.id,
        clientName: showing.client.name,
        phone: normalizedPhone,
        status: "INITIATED",
      })
      console.log(`[reminder-calls] Call initiated for showing ${showing.id} (${showing.client.name}) → ${normalizedPhone}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[reminder-calls] Call failed for showing ${showing.id} (${showing.client.name}):`, errorMsg)

      await updateCallLogStatus(callLogId, {
        status: "FAILED",
        errorMessage: errorMsg.slice(0, 500),
      })

      callsFailed++
      details.push({
        showingId: showing.id,
        clientName: showing.client.name,
        phone: normalizedPhone,
        status: "FAILED",
        error: errorMsg.slice(0, 200),
      })
    }
  }

  const summary = `Zpracováno ${showings.length} prohlídek: ${callsInitiated} hovorů zahájeno, ${callsSkipped} přeskočeno, ${callsFailed} selhalo`
  console.log(`[reminder-calls] ${summary}`)

  return NextResponse.json({
    success: true,
    message: summary,
    totalShowings: showings.length,
    callsInitiated,
    callsSkipped,
    callsFailed,
    details,
  })
}
