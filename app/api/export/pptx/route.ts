import { NextRequest, NextResponse } from "next/server"
import { buildPptxBuffer } from "@/lib/export/pptx"
import type { SlideData } from "@/lib/export/pptx"
import { storePptx, getPptx } from "@/lib/export/pptx-store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slides: SlideData[] = body.slides
    const filename: string = body.filename ?? "prezentace"

    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 })
    }

    const buffer = await buildPptxBuffer(slides)
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
