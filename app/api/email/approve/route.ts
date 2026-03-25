import { NextRequest, NextResponse } from "next/server"
import { saveDraft } from "@/lib/google/gmail"
import { z } from "zod"

const approveSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = approveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné údaje e-mailu", details: parsed.error.flatten() },
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
    const message = err instanceof Error ? err.message : "Nepodařilo se vytvořit draft"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
