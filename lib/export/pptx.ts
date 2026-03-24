// Server-only module — never import from client components
import PptxGenJS from "pptxgenjs"

export interface SlideMetric {
  label: string
  value: string | number
  trend?: string // e.g. "+12%" or "-5%"
}

export interface SlideData {
  title: string
  subtitle?: string
  metrics?: SlideMetric[]
  tableHeaders?: string[]
  tableRows?: string[][]
  bullets?: string[]
}

const COLORS = {
  bg: "1a1a2e",
  accent: "f59e0b",        // amber-500
  text: "e2e8f0",
  muted: "94a3b8",
  positive: "34d399",      // emerald-400
  negative: "f87171",      // red-400
  tableBorder: "334155",
  tableHeader: "0f172a",
}

export async function buildPptxBuffer(slides: SlideData[]): Promise<Buffer> {
  const pptx = new PptxGenJS()

  pptx.layout = "LAYOUT_WIDE"
  pptx.author = "Back Office Agent"
  pptx.company = "Realitní firma s.r.o."

  for (const slide of slides) {
    const s = pptx.addSlide()

    // Background
    s.background = { color: COLORS.bg }

    // Accent bar top
    s.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: "100%", h: 0.08,
      fill: { color: COLORS.accent },
      line: { color: COLORS.accent },
    })

    // Title
    s.addText(slide.title, {
      x: 0.5, y: 0.25, w: "90%", h: 0.7,
      fontSize: 28,
      bold: true,
      color: COLORS.text,
      fontFace: "Arial",
    })

    // Subtitle
    if (slide.subtitle) {
      s.addText(slide.subtitle, {
        x: 0.5, y: 0.9, w: "90%", h: 0.4,
        fontSize: 14,
        color: COLORS.muted,
        fontFace: "Arial",
      })
    }

    let currentY = slide.subtitle ? 1.45 : 1.25

    // Metrics grid
    if (slide.metrics && slide.metrics.length > 0) {
      const cols = Math.min(slide.metrics.length, 4)
      const colW = 12.5 / cols
      slide.metrics.forEach((m, i) => {
        const x = 0.5 + (i % cols) * colW
        const y = currentY + Math.floor(i / cols) * 1.4

        // Card bg
        s.addShape(pptx.ShapeType.rect, {
          x, y, w: colW - 0.15, h: 1.25,
          fill: { color: "0f172a" },
          line: { color: COLORS.tableBorder },
          rectRadius: 0.08,
        })

        // Label
        s.addText(m.label, {
          x: x + 0.15, y: y + 0.1, w: colW - 0.3, h: 0.3,
          fontSize: 9,
          color: COLORS.muted,
          fontFace: "Arial",
        })

        // Value
        s.addText(String(m.value), {
          x: x + 0.15, y: y + 0.35, w: colW - 0.3, h: 0.55,
          fontSize: 22,
          bold: true,
          color: COLORS.text,
          fontFace: "Arial",
        })

        // Trend
        if (m.trend) {
          const isPositive = m.trend.startsWith("+")
          s.addText(m.trend, {
            x: x + 0.15, y: y + 0.9, w: colW - 0.3, h: 0.25,
            fontSize: 9,
            color: isPositive ? COLORS.positive : COLORS.negative,
            fontFace: "Arial",
          })
        }
      })

      const metricRows = Math.ceil(slide.metrics.length / 4)
      currentY += metricRows * 1.4 + 0.2
    }

    // Table
    if (slide.tableHeaders && slide.tableRows && slide.tableRows.length > 0) {
      const tableData = [
        slide.tableHeaders.map((h) => ({
          text: h,
          options: {
            bold: true,
            color: COLORS.text,
            fill: { color: COLORS.tableHeader },
            fontSize: 10,
            fontFace: "Arial",
          },
        })),
        ...slide.tableRows.map((row) =>
          row.map((cell) => ({
            text: cell,
            options: {
              color: COLORS.muted,
              fill: { color: COLORS.bg },
              fontSize: 9,
              fontFace: "Arial",
            },
          }))
        ),
      ]

      s.addTable(tableData, {
        x: 0.5,
        y: currentY,
        w: 12.5,
        border: { type: "solid", color: COLORS.tableBorder, pt: 0.5 },
        rowH: 0.3,
      })

      currentY += (slide.tableRows.length + 1) * 0.32 + 0.3
    }

    // Bullets
    if (slide.bullets && slide.bullets.length > 0) {
      slide.bullets.forEach((bullet, i) => {
        s.addText(`• ${bullet}`, {
          x: 0.5,
          y: currentY + i * 0.4,
          w: "90%",
          h: 0.35,
          fontSize: 11,
          color: COLORS.text,
          fontFace: "Arial",
        })
      })
    }

    // Footer
    s.addText("Back Office Agent · Realitní firma s.r.o.", {
      x: 0.5, y: 6.9, w: "90%", h: 0.25,
      fontSize: 8,
      color: COLORS.muted,
      fontFace: "Arial",
      align: "center",
    })
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" })
  return buffer as Buffer
}
