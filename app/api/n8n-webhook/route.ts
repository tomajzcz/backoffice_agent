import { NextRequest, NextResponse } from "next/server"
import { createMonitoringResults, updateJobLastRun } from "@/lib/db/queries/monitoring"

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (secret) {
    const headerSecret = req.headers.get("x-webhook-secret")
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const body = await req.json()
  const { jobId, results } = body as {
    jobId: number
    results: Array<{
      source: string
      title: string
      url: string
      price?: number | null
      district?: string | null
      disposition?: string | null
    }>
  }

  if (!jobId || !Array.isArray(results)) {
    return NextResponse.json(
      { error: "Missing required fields: jobId, results[]" },
      { status: 400 },
    )
  }

  const created = await createMonitoringResults(jobId, results)
  await updateJobLastRun(jobId)

  return NextResponse.json({
    success: true,
    inserted: created.count,
    jobId,
  })
}
