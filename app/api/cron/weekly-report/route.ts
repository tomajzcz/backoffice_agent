import { NextRequest, NextResponse } from "next/server"
import { generateExecutiveReport } from "@/lib/executive-report/generate"
import { getAutomationConfig } from "@/lib/db/queries/executive-reports"
import { requireBearer } from "@/lib/security/require-bearer"

export const maxDuration = 120

// Runs every Monday at 7:00 UTC (= 9:00 CEST / 8:00 CET)
export async function GET(req: NextRequest) {
  const auth = requireBearer(req, "CRON_SECRET")
  if (!auth.ok) return auth.response

  const config = await getAutomationConfig("weekly_executive_report")
  if (!config || !config.isActive) {
    return NextResponse.json({ success: true, message: "Automation is paused" })
  }

  const result = await generateExecutiveReport({
    recipientEmail: config.recipientEmail,
    trigger: "cron",
    slideCount: 5,
  })

  return NextResponse.json(result)
}
