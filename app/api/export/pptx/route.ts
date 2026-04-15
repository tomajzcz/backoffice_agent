import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { buildPptxBuffer } from "@/lib/export/pptx"
import { storePptx, getPptx } from "@/lib/export/pptx-store"
import { rateLimit } from "@/lib/security/ratelimit"

const SlideSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(500).optional(),
  metrics: z
    .array(z.object({
      label: z.string().max(200),
      value: z.union([z.string().max(200), z.number()]),
      trend: z.string().max(50).optional(),
    }))
    .max(20)
    .optional(),
  tableHeaders: z.array(z.string().max(200)).max(20).optional(),
  tableRows: z.array(z.array(z.string().max(500)).max(20)).max(200).optional(),
  bullets: z.array(z.string().max(500)).max(30).optional(),
})

const BodySchema = z.object({
  slides: z.array(SlideSchema).min(1).max(25),
  filename: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "pptx-gen", limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  try {
    const raw = await req.json()
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatné údaje pro prezentaci" }, { status: 400 })
    }

    const filename = parsed.data.filename ?? "prezentace"
    const buffer = await buildPptxBuffer(parsed.data.slides)
    const token = await storePptx(buffer)

    return NextResponse.json({ token, filename })
  } catch (err) {
    console.error("[pptx/route] POST error:", err)
    return NextResponse.json({ error: "Failed to generate presentation" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const filename = req.nextUrl.searchParams.get("filename") ?? "prezentace"

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const buffer = await getPptx(token)
  if (!buffer) {
    return NextResponse.json({ error: "Token expired or not found" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="prezentace.pptx"; filename*=UTF-8''${encodeURIComponent(filename)}.pptx`,
    },
  })
}
