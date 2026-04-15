import { NextRequest, NextResponse } from "next/server"
import { getPptx } from "@/lib/export/pptx-store"
import { saveDraftWithAttachment } from "@/lib/google/gmail"
import { rateLimit } from "@/lib/security/ratelimit"

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "pptx-send", limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  try {
    const { to, token, filename = "prezentace" } = await req.json()

    if (!to || !token) {
      return NextResponse.json({ error: "Chybí email nebo token" }, { status: 400 })
    }

    const buffer = await getPptx(token)
    if (!buffer) {
      return NextResponse.json(
        { error: "Prezentace vypršela nebo nebyla nalezena. Vygeneruj ji znovu." },
        { status: 404 },
      )
    }

    const result = await saveDraftWithAttachment(
      to,
      `Prezentace: ${filename}`,
      `<p>Dobrý den,</p><p>v příloze najdete prezentaci <strong>${filename}</strong>.</p><p>S pozdravem,<br>Back Office Agent</p>`,
      {
        filename: `${filename}.pptx`,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        content: buffer,
      },
    )

    return NextResponse.json({ success: true, draftId: result.draftId })
  } catch (err) {
    console.error("[pptx/send-email] POST error:", err)
    return NextResponse.json(
      { error: "Nepodařilo se uložit draft prezentace" },
      { status: 500 },
    )
  }
}
