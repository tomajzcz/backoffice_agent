import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { buildReportPdf, buildTablePdf } from "@/lib/export/pdf"
import { buildTimestampedFilename } from "@/lib/export/filenames"
import { storeFile, getFile } from "@/lib/export/file-store"
import { rateLimit } from "@/lib/security/ratelimit"

const PREFIX = "pdf-"

const ReportBodySchema = z.object({
  type: z.literal("report"),
  title: z.string().min(1).max(300),
  markdown: z.string().min(1).max(200_000),
})

const TableBodySchema = z.object({
  type: z.literal("table"),
  title: z.string().min(1).max(300),
  headers: z.array(z.string().max(500)).min(1).max(50),
  rows: z.array(z.array(z.string().max(2000)).max(50)).max(2000),
})

const BodySchema = z.discriminatedUnion("type", [ReportBodySchema, TableBodySchema])

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "pdf-gen", limit: 30, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  try {
    const raw = await req.json()
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatné údaje pro PDF" }, { status: 400 })
    }

    const buffer = parsed.data.type === "report"
      ? await buildReportPdf(parsed.data.title, parsed.data.markdown)
      : await buildTablePdf(parsed.data.title, parsed.data.headers, parsed.data.rows)

    const token = await storeFile(buffer, PREFIX)
    const filename = buildTimestampedFilename(parsed.data.title, "pdf")

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

  const buffer = await getFile(token, PREFIX)
  if (!buffer) {
    return NextResponse.json({ error: "Token expired or not found" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="export.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
