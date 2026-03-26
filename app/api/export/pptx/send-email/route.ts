import { NextRequest, NextResponse } from "next/server"
import { getPptx } from "@/lib/export/pptx-store"
import { sendEmailWithAttachment } from "@/lib/google/gmail"

export async function POST(req: NextRequest) {
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

    const result = await sendEmailWithAttachment(
      to,
      `Prezentace: ${filename}`,
      `<p>Dobrý den,</p><p>v příloze najdete prezentaci <strong>${filename}</strong>.</p><p>S pozdravem,<br>Back Office Agent</p>`,
      {
        filename: `${filename}.pptx`,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        content: buffer,
      },
    )

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err) {
    console.error("[pptx/send-email] POST error:", err)
    const message = err instanceof Error ? err.message : "Nepodařilo se odeslat email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
