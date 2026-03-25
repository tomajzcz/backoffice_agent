import { NextRequest, NextResponse } from "next/server"
import { buildReportPdf, buildTablePdf } from "@/lib/export/pdf"
import { buildTimestampedFilename } from "@/lib/export/filenames"
import { storeFile, getFile } from "@/lib/export/file-store"

const PREFIX = "pdf-"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, title, markdown, headers, rows } = body as {
      type: "report" | "table"
      title: string
      markdown?: string
      headers?: string[]
      rows?: string[][]
    }

    if (!title || !type) {
      return NextResponse.json({ error: "Missing title or type" }, { status: 400 })
    }

    let buffer: Buffer

    if (type === "report") {
      if (!markdown) {
        return NextResponse.json({ error: "Missing markdown for report PDF" }, { status: 400 })
      }
      buffer = await buildReportPdf(title, markdown)
    } else if (type === "table") {
      if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) {
        return NextResponse.json({ error: "Missing headers/rows for table PDF" }, { status: 400 })
      }
      buffer = await buildTablePdf(title, headers, rows)
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const token = storeFile(buffer, PREFIX)
    const filename = buildTimestampedFilename(title, "pdf")

    return NextResponse.json({ token, filename })
  } catch (err) {
    console.error("[pdf/route] POST error:", err)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  const filename = req.nextUrl.searchParams.get("filename") ?? "export.pdf"

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  const buffer = getFile(token, PREFIX)
  if (!buffer) {
    return NextResponse.json({ error: "Token expired or not found" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
