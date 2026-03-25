/**
 * Server-side PDF generation using pdfkit.
 * Supports report (markdown) and table layouts.
 */
import PDFDocument from "pdfkit"
import { join } from "path"

const FONT_PATH = join(process.cwd(), "lib/export/fonts/Roboto-Regular.ttf")

const COLORS = {
  text: "#e2e8f0",
  muted: "#94a3b8",
  accent: "#f59e0b",
  border: "#334155",
}

/**
 * Build a PDF from a markdown report.
 */
export async function buildReportPdf(title: string, markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: { Title: title, Author: "Back Office Agent" },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    doc.registerFont("Roboto", FONT_PATH)
    doc.font("Roboto")

    // Title
    doc.fontSize(20).fillColor(COLORS.accent).text(title, { align: "left" })
    doc.moveDown(0.3)

    // Date
    const dateStr = new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date())
    doc.fontSize(9).fillColor(COLORS.muted).text(dateStr)
    doc.moveDown(0.5)

    // Horizontal line
    doc.strokeColor(COLORS.border).lineWidth(0.5)
      .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.8)

    // Parse markdown into lines and render
    const lines = markdown.split("\n")
    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.startsWith("### ")) {
        doc.moveDown(0.5)
        doc.fontSize(12).fillColor(COLORS.accent).text(trimmed.slice(4))
        doc.moveDown(0.3)
      } else if (trimmed.startsWith("## ")) {
        doc.moveDown(0.6)
        doc.fontSize(14).fillColor(COLORS.accent).text(trimmed.slice(3))
        doc.moveDown(0.3)
      } else if (trimmed.startsWith("# ")) {
        doc.moveDown(0.8)
        doc.fontSize(16).fillColor(COLORS.accent).text(trimmed.slice(2))
        doc.moveDown(0.4)
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        doc.fontSize(10).fillColor(COLORS.text).text(`  •  ${trimmed.slice(2)}`, { indent: 10 })
        doc.moveDown(0.15)
      } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        doc.fontSize(10).fillColor(COLORS.text).text(trimmed.replace(/\*\*/g, ""), { continued: false })
        doc.moveDown(0.15)
      } else if (trimmed === "") {
        doc.moveDown(0.3)
      } else {
        // Strip remaining bold markers inline
        const clean = trimmed.replace(/\*\*/g, "")
        doc.fontSize(10).fillColor(COLORS.text).text(clean)
        doc.moveDown(0.15)
      }

      // Check if near bottom, add new page
      if (doc.y > 750) {
        doc.addPage()
      }
    }

    // Footer
    doc.moveDown(1)
    doc.strokeColor(COLORS.border).lineWidth(0.5)
      .moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)
    doc.fontSize(8).fillColor(COLORS.muted)
      .text("Back Office Agent · Realitní firma s.r.o.", { align: "center" })

    doc.end()
  })
}

/**
 * Build a PDF from tabular data.
 */
export async function buildTablePdf(
  title: string,
  headers: string[],
  rows: string[][],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: rows[0] && rows[0].length > 5 ? "landscape" : "portrait",
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
      info: { Title: title, Author: "Back Office Agent" },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    doc.registerFont("Roboto", FONT_PATH)
    doc.font("Roboto")

    // Title
    doc.fontSize(16).fillColor(COLORS.accent).text(title)
    doc.moveDown(0.2)

    const dateStr = new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
    doc.fontSize(9).fillColor(COLORS.muted).text(`${rows.length} záznamů · ${dateStr}`)
    doc.moveDown(0.5)

    // Table layout
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const colCount = headers.length
    const colWidth = pageWidth / colCount
    const startX = doc.page.margins.left
    const fontSize = colCount > 6 ? 7 : colCount > 4 ? 8 : 9

    // Header row
    let y = doc.y
    doc.fontSize(fontSize).fillColor(COLORS.accent)
    headers.forEach((h, i) => {
      doc.text(h, startX + i * colWidth, y, { width: colWidth - 4, lineBreak: false })
    })
    y += fontSize + 8

    // Header underline
    doc.strokeColor(COLORS.accent).lineWidth(0.5)
      .moveTo(startX, y).lineTo(startX + pageWidth, y).stroke()
    y += 4

    // Data rows
    doc.fillColor(COLORS.text)
    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage()
        y = doc.page.margins.top
      }

      doc.fontSize(fontSize)
      row.forEach((cell, i) => {
        const truncated = cell.length > 40 ? cell.slice(0, 38) + "…" : cell
        doc.text(truncated, startX + i * colWidth, y, { width: colWidth - 4, lineBreak: false })
      })
      y += fontSize + 6

      // Row separator
      doc.strokeColor(COLORS.border).lineWidth(0.25)
        .moveTo(startX, y - 2).lineTo(startX + pageWidth, y - 2).stroke()
    }

    // Footer
    doc.moveDown(1)
    doc.fontSize(8).fillColor(COLORS.muted)
      .text("Back Office Agent · Realitní firma s.r.o.", startX, doc.page.height - 40, { align: "center", width: pageWidth })

    doc.end()
  })
}
