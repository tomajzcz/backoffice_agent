import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createMonitoringResults, updateJobLastRun } from "@/lib/db/queries/monitoring"
import { requireBearer } from "@/lib/security/require-bearer"

const bodySchema = z.object({
  jobId: z.number().int().positive(),
  results: z
    .array(
      z.object({
        source: z.string().min(1).max(100),
        title: z.string().min(1).max(500),
        url: z.string().url().max(2000),
        price: z.number().int().nullable().optional(),
        district: z.string().max(200).nullable().optional(),
        disposition: z.string().max(100).nullable().optional(),
      }),
    )
    .max(500),
})

export async function POST(req: NextRequest) {
  const auth = requireBearer(req, "N8N_WEBHOOK_SECRET", {
    header: "x-webhook-secret",
    bearerPrefix: false,
  })
  if (!auth.ok) return auth.response

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { jobId, results } = parsed.data
  const created = await createMonitoringResults(jobId, results)
  await updateJobLastRun(jobId)

  return NextResponse.json({
    success: true,
    inserted: created.count,
    jobId,
  })
}
