"use client"

import { useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { downloadCSV } from "@/lib/export/csv"
import { getCSVConfig } from "@/lib/export/csv-configs"
import { buildTimestampedFilename } from "@/lib/export/filenames"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult
}

export function ExportButtons({ result }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)

  const csvConfig = getCSVConfig(result.toolName)
  const showPdf = result.toolName === "generateReport"

  if (!csvConfig && !showPdf) return null

  function handleCSV() {
    if (!csvConfig) return
    const data = csvConfig.dataExtractor(result)
    if (!data.length) return
    const rows = data.map(csvConfig.rowMapper)
    const filename = buildTimestampedFilename(csvConfig.filenamePrefix, "csv")
    downloadCSV(csvConfig.headers, rows, filename)
  }

  async function handlePDF() {
    if (result.toolName !== "generateReport") return
    setPdfLoading(true)

    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "report",
          title: result.title,
          markdown: result.markdown,
        }),
      })

      if (!res.ok) throw new Error("PDF generation failed")

      const { token, filename } = await res.json()
      const downloadUrl = `/api/export/pdf?token=${token}&filename=${encodeURIComponent(filename)}`
      window.open(downloadUrl, "_blank")
    } catch (err) {
      console.error("[ExportButtons] PDF error:", err)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {csvConfig && (
        <button
          onClick={handleCSV}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <Download className="w-3 h-3" />
          CSV
        </button>
      )}
      {showPdf && (
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
        >
          {pdfLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <FileText className="w-3 h-3" />
          )}
          PDF
        </button>
      )}
    </div>
  )
}
