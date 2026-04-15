import { NextRequest, NextResponse } from "next/server"
import { saveDraft } from "@/lib/google/gmail"
import { rateLimit } from "@/lib/security/ratelimit"
import { z } from "zod"

const approveSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1).max(100_000),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "email-approve", limit: 20, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  try {
    const body = await req.json()
    const parsed = approveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné údaje e-mailu" },
        { status: 400 },
      )
    }

    const { to, subject, bodyHtml } = parsed.data
    const result = await saveDraft(to, subject, bodyHtml)

    return NextResponse.json({
      draftId: result.draftId,
      savedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[email/approve] error:", err)
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit draft" },
      { status: 500 },
    )
  }
}
