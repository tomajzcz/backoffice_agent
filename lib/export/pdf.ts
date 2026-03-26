/**
 * Server-side PDF generation using pdfkit.
 * Premium design matching the app's dark navy UI — adapted for light PDF background.
 * Supports report (markdown) and table layouts.
 */
import PDFDocument from "pdfkit"
import { join } from "path"

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
const FONTS_DIR = join(process.cwd(), "lib/export/fonts")

function registerFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont("Syne-Bold", join(FONTS_DIR, "Syne-Bold.ttf"))
  doc.registerFont("Outfit", join(FONTS_DIR, "Outfit-Regular.ttf"))
  doc.registerFont("Outfit-Medium", join(FONTS_DIR, "Outfit-Medium.ttf"))
  doc.registerFont("Outfit-Light", join(FONTS_DIR, "Outfit-Light.ttf"))
}

// ---------------------------------------------------------------------------
// Color palette — light background adaptation of the app's dark navy theme
// ---------------------------------------------------------------------------
const C = {
  heading: "#0B0F14",
  body: "#1F2937",
  muted: "#6B7280",
  light: "#9CA3AF",

  amber: "#f59e0b",
  amberDark: "#d97706",
  amberLight: "#FEF3C7",

  tableHeaderBg: "#0F1419",
  tableHeaderText: "#F8FAFC",
  tableRowAlt: "#F9FAFB",
  tableBorder: "#E5E7EB",

  border: "#D1D5DB",
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const MARGIN = { top: 60, bottom: 60, left: 50, right: 50 }
const STRIPE_H = 4

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right
}

function safeBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - doc.page.margins.bottom - 20
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
function addPageHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  isFirst: boolean,
) {
  const left = doc.page.margins.left
  const w = contentWidth(doc)

  // Amber accent stripe at very top
  doc.save()
  doc.rect(0, 0, doc.page.width, STRIPE_H).fill(C.amber)
  doc.restore()

  if (isFirst) {
    doc.y = STRIPE_H + 24

    // Title
    doc.font("Syne-Bold").fontSize(22).fillColor(C.heading)
      .text(title, left, doc.y, { width: w })
    doc.moveDown(0.3)

    // Date
    const dateStr = new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date())
    doc.font("Outfit-Light").fontSize(9).fillColor(C.muted).text(dateStr)
    doc.moveDown(0.5)

    // Separator
    doc.strokeColor(C.border).lineWidth(0.5)
      .moveTo(left, doc.y).lineTo(left + w, doc.y).stroke()
    doc.moveDown(0.8)
  } else {
    // Compact continuation header
    doc.font("Outfit-Light").fontSize(8).fillColor(C.light)
      .text(title, left, STRIPE_H + 10, { width: w, align: "right" })
    doc.y = doc.page.margins.top
  }
}

// ---------------------------------------------------------------------------
// Page footers — added post-render via switchToPage
// ---------------------------------------------------------------------------
function addPageFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange()
  const total = range.count

  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i)
    const left = doc.page.margins.left
    const w = contentWidth(doc)
    const fy = doc.page.height - 35

    doc.strokeColor(C.border).lineWidth(0.25)
      .moveTo(left, fy - 6).lineTo(left + w, fy - 6).stroke()

    doc.font("Outfit-Light").fontSize(7).fillColor(C.light)
      .text("Back Office Agent · Realitní firma s.r.o.", left, fy, {
        width: w / 2, align: "left", lineBreak: false,
      })

    doc.font("Outfit-Light").fontSize(7).fillColor(C.light)
      .text(`${i + 1} / ${total}`, left + w / 2, fy, {
        width: w / 2, align: "right", lineBreak: false,
      })
  }
}

// ---------------------------------------------------------------------------
// Markdown parser — block-level
// ---------------------------------------------------------------------------
type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "numbered"; text: string; num: number; indent: number }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "blockquote"; text: string }
  | { type: "hr" }
  | { type: "blank" }

function parseMarkdown(md: string): Block[] {
  const lines = md.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (trimmed === "") { blocks.push({ type: "blank" }); i++; continue }

    // Horizontal rule
    if (/^-{3,}$|^\*{3,}$|^_{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" }); i++; continue
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,3})\s+(.*)/)
    if (hMatch) {
      blocks.push({ type: "heading", level: hMatch[1].length as 1 | 2 | 3, text: hMatch[2] })
      i++; continue
    }

    // Table — consecutive pipe-delimited lines
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = []
      while (i < lines.length) {
        const tl = lines[i].trim()
        if (tl.startsWith("|") && tl.endsWith("|")) { tableLines.push(tl); i++ }
        else break
      }
      if (tableLines.length >= 2) {
        const parseRow = (l: string) => l.split("|").slice(1, -1).map(c => c.trim())
        const headers = parseRow(tableLines[0])
        const sepIdx = tableLines.findIndex(l => /^\|[\s\-:|]+\|$/.test(l))
        const dataLines = sepIdx >= 0
          ? tableLines.filter((_, idx) => idx !== 0 && idx !== sepIdx)
          : tableLines.slice(1)
        blocks.push({ type: "table", headers, rows: dataLines.map(parseRow) })
      }
      continue
    }

    // Bullet
    if (/^[-*]\s/.test(trimmed)) {
      const indent = raw.length - raw.trimStart().length
      blocks.push({ type: "bullet", text: trimmed.slice(2), indent: Math.floor(indent / 2) })
      i++; continue
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      const indent = raw.length - raw.trimStart().length
      blocks.push({ type: "numbered", text: numMatch[2], num: parseInt(numMatch[1]), indent: Math.floor(indent / 2) })
      i++; continue
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", text: trimmed.slice(2) })
      i++; continue
    }

    // Default paragraph
    blocks.push({ type: "paragraph", text: trimmed })
    i++
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Inline formatting parser
// ---------------------------------------------------------------------------
interface Segment { text: string; bold?: boolean; italic?: boolean }

function parseInline(text: string): Segment[] {
  const segs: Segment[] = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index) })
    if (m[2]) segs.push({ text: m[2], bold: true })
    else if (m[3]) segs.push({ text: m[3], italic: true })
    last = re.lastIndex
  }
  if (last < text.length) segs.push({ text: text.slice(last) })
  return segs.length > 0 ? segs : [{ text }]
}

function renderRichText(
  doc: PDFKit.PDFDocument,
  text: string,
  fontSize: number,
  color: string,
  opts?: { width?: number },
) {
  const segs = parseInline(text)
  const w = opts?.width ?? contentWidth(doc)

  segs.forEach((seg, idx) => {
    const isLast = idx === segs.length - 1

    if (seg.bold) {
      doc.font("Outfit-Medium").fontSize(fontSize).fillColor(color)
    } else if (seg.italic) {
      doc.font("Outfit-Light").fontSize(fontSize).fillColor(C.muted)
    } else {
      doc.font("Outfit").fontSize(fontSize).fillColor(color)
    }

    doc.text(seg.text, { continued: !isLast, width: isLast ? w : undefined })
  })
}

// ---------------------------------------------------------------------------
// Smart column width calculation
// ---------------------------------------------------------------------------
function calcColWidths(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  total: number,
  fontSize: number,
): number[] {
  const pad = 12
  doc.font("Outfit").fontSize(fontSize)

  const maxW = headers.map((h, ci) => {
    let mx = doc.widthOfString(h) + pad
    for (let ri = 0; ri < Math.min(rows.length, 20); ri++) {
      const cell = (rows[ri]?.[ci] ?? "").replace(/\*\*/g, "")
      const w = doc.widthOfString(cell.slice(0, 50)) + pad
      if (w > mx) mx = w
    }
    return mx
  })

  const natural = maxW.reduce((a, b) => a + b, 0)
  if (natural <= total) {
    const rem = total - natural
    return maxW.map(w => w + (rem * w) / natural)
  }
  return maxW.map(w => (w / natural) * total)
}

// ---------------------------------------------------------------------------
// Table renderer (used in both report and table PDF)
// ---------------------------------------------------------------------------
function renderTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  title: string,
) {
  const left = doc.page.margins.left
  const w = contentWidth(doc)
  const cols = headers.length
  const fs = cols > 6 ? 7.5 : cols > 4 ? 8 : 9
  const headerH = 20
  const rowH = 17
  const cellPad = 5

  const colW = calcColWidths(doc, headers, rows, w, fs)

  const drawHeader = (y: number) => {
    // Dark header background
    doc.rect(left, y, w, headerH).fill(C.tableHeaderBg)
    doc.font("Outfit-Medium").fontSize(fs).fillColor(C.tableHeaderText)
    let x = left
    for (let ci = 0; ci < cols; ci++) {
      doc.text(headers[ci], x + cellPad, y + 5, {
        width: colW[ci] - cellPad * 2, lineBreak: false,
      })
      x += colW[ci]
    }
    return y + headerH
  }

  // Check if there's enough room for header + at least 2 data rows
  if (doc.y + headerH + rowH * 2 > safeBottom(doc)) {
    doc.addPage({ size: "A4", margins: doc.page.margins })
    addPageHeader(doc, title, false)
  }

  let y = drawHeader(doc.y)

  for (let ri = 0; ri < rows.length; ri++) {
    if (y + rowH > safeBottom(doc)) {
      doc.addPage({ size: "A4", margins: doc.page.margins })
      addPageHeader(doc, title, false)
      y = drawHeader(doc.y)
    }

    // Alternating row background
    if (ri % 2 === 1) {
      doc.rect(left, y, w, rowH).fill(C.tableRowAlt)
    }

    // Cell text
    let x = left
    for (let ci = 0; ci < cols; ci++) {
      const raw = rows[ri]?.[ci] ?? ""
      const isBold = raw.startsWith("**") && raw.endsWith("**")
      const clean = raw.replace(/\*\*/g, "")
      const truncated = clean.length > 50 ? clean.slice(0, 48) + "…" : clean
      doc.font(isBold ? "Outfit-Medium" : "Outfit").fontSize(fs).fillColor(C.body)
      doc.text(truncated, x + cellPad, y + 4, {
        width: colW[ci] - cellPad * 2, lineBreak: false,
      })
      x += colW[ci]
    }
    y += rowH

    // Row bottom border
    doc.strokeColor(C.tableBorder).lineWidth(0.25)
      .moveTo(left, y).lineTo(left + w, y).stroke()
  }

  doc.y = y + 8
}

// ---------------------------------------------------------------------------
// Block renderer (for report PDFs)
// ---------------------------------------------------------------------------
function renderBlocks(
  doc: PDFKit.PDFDocument,
  blocks: Block[],
  title: string,
) {
  const left = doc.page.margins.left
  const w = contentWidth(doc)

  for (const block of blocks) {
    // Page break check (tables handle it internally)
    if (block.type !== "table" && doc.y > safeBottom(doc)) {
      doc.addPage({ size: "A4", margins: doc.page.margins })
      addPageHeader(doc, title, false)
    }

    switch (block.type) {
      case "heading": {
        if (block.level === 1) {
          doc.moveDown(0.6)
          doc.font("Syne-Bold").fontSize(16).fillColor(C.heading).text(block.text)
          doc.moveDown(0.3)
        } else if (block.level === 2) {
          doc.moveDown(0.5)
          const h2y = doc.y
          // Amber accent bar
          doc.rect(left, h2y + 2, 3, 13).fill(C.amber)
          doc.font("Syne-Bold").fontSize(13).fillColor(C.heading)
            .text(block.text, left + 12, h2y, { width: w - 12 })
          doc.moveDown(0.3)
        } else {
          doc.moveDown(0.4)
          doc.font("Outfit-Medium").fontSize(10).fillColor(C.amberDark)
            .text(block.text.toUpperCase(), { characterSpacing: 0.5 })
          doc.moveDown(0.2)
        }
        break
      }

      case "paragraph":
        renderRichText(doc, block.text, 9.5, C.body)
        doc.moveDown(0.2)
        break

      case "bullet": {
        const bi = 12 + block.indent * 14
        const bulletY = doc.y
        doc.font("Outfit").fontSize(9.5).fillColor(C.amber)
          .text("•", left + bi - 10, bulletY, { lineBreak: false })
        doc.y = bulletY
        renderRichText(doc, block.text, 9.5, C.body, { width: w - bi })
        doc.x = left
        doc.moveDown(0.15)
        break
      }

      case "numbered": {
        const ni = 12 + block.indent * 14
        const numY = doc.y
        doc.font("Outfit-Medium").fontSize(9.5).fillColor(C.muted)
          .text(`${block.num}.`, left + ni - 18, numY, {
            width: 16, align: "right", lineBreak: false,
          })
        doc.y = numY
        doc.x = left + ni + 2
        renderRichText(doc, block.text, 9.5, C.body, { width: w - ni - 2 })
        doc.x = left
        doc.moveDown(0.15)
        break
      }

      case "blockquote": {
        const bqy = doc.y
        doc.font("Outfit").fontSize(9).fillColor(C.muted)
          .text(block.text, left + 14, bqy, { width: w - 14 })
        const bqh = doc.y - bqy
        doc.rect(left + 4, bqy - 1, 2, bqh + 2).fill(C.amber)
        doc.moveDown(0.2)
        break
      }

      case "table":
        doc.moveDown(0.2)
        renderTable(doc, block.headers, block.rows, title)
        doc.moveDown(0.2)
        break

      case "hr":
        doc.moveDown(0.3)
        doc.strokeColor(C.border).lineWidth(0.5)
          .moveTo(left, doc.y).lineTo(left + w, doc.y).stroke()
        doc.moveDown(0.3)
        break

      case "blank":
        doc.moveDown(0.25)
        break
    }
  }
}

// ---------------------------------------------------------------------------
// Public: Build a PDF from a markdown report
// ---------------------------------------------------------------------------
export async function buildReportPdf(title: string, markdown: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: false,
      bufferPages: true,
      info: { Title: title, Author: "Back Office Agent" },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    registerFonts(doc)

    doc.addPage({ size: "A4", margins: MARGIN })
    addPageHeader(doc, title, true)

    const blocks = parseMarkdown(markdown)
    renderBlocks(doc, blocks, title)

    addPageFooters(doc)
    doc.end()
  })
}

// ---------------------------------------------------------------------------
// Public: Build a PDF from tabular data
// ---------------------------------------------------------------------------
export async function buildTablePdf(
  title: string,
  headers: string[],
  rows: string[][],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const layout = rows[0] && rows[0].length > 5 ? ("landscape" as const) : ("portrait" as const)
    const margins = { top: 50, bottom: 50, left: 40, right: 40 }

    const doc = new PDFDocument({
      autoFirstPage: false,
      bufferPages: true,
      info: { Title: title, Author: "Back Office Agent" },
    })

    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    registerFonts(doc)

    doc.addPage({ size: "A4", layout, margins })
    addPageHeader(doc, title, true)

    // Record count + date
    const dateStr = new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date())
    doc.font("Outfit-Light").fontSize(9).fillColor(C.muted)
      .text(`${rows.length} záznamů · ${dateStr}`)
    doc.moveDown(0.5)

    // Render the data table
    renderTable(doc, headers, rows, title)

    addPageFooters(doc)
    doc.end()
  })
}
