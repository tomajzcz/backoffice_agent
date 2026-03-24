import { NextRequest, NextResponse } from "next/server"
import { buildPptxBuffer } from "@/lib/export/pptx"
import type { SlideData } from "@/lib/export/pptx"

// In-memory token store for generated presentations
// Each token is valid for 10 minutes
const pptxStore = new Map<string, { buffer: Buffer; expiresAt: number }>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slides: SlideData[] = body.slides
    const filename: string = body.filename ?? "prezentace"

    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 })
    }

    const buffer = await buildPptxBuffer(slides)

    // Store with token for GET download
    const token = crypto.randomUUID()
    pptxStore.set(token, { buffer, expiresAt: Date.now() + 10 * 60 * 1000 })

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

  const entry = pptxStore.get(token)
  if (!entry || entry.expiresAt < Date.now()) {
    pptxStore.delete(token)
    return NextResponse.json({ error: "Token expired or not found" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(entry.buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}.pptx"`,
    },
  })
}
