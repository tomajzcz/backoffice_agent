import { NextRequest, NextResponse } from "next/server"
import { generateExecutiveReport } from "@/lib/executive-report/generate"
import { getAutomationConfig } from "@/lib/db/queries/executive-reports"

export const maxDuration = 120

// Runs every Monday at 7:00 UTC (= 9:00 CEST / 8:00 CET)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
