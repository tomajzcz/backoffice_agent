import { getWeeklyReports } from "@/lib/db/queries/weekly-reports"
import { getLeadsSalesTimeline } from "@/lib/db/queries/leads"
import { getMissingRenovationProperties } from "@/lib/db/queries/properties"
import {
  createReportRun,
  updateReportRun,
} from "@/lib/db/queries/executive-reports"
import { buildPptxBuffer, type SlideData } from "@/lib/export/pptx"
import { sendEmailWithAttachment } from "@/lib/google/gmail"
import { formatCZK } from "@/lib/utils"
import {
  PROPERTY_TYPE_LABELS as TYPE_LABELS,
  PROPERTY_STATUS_LABELS as STATUS_LABELS,
} from "@/lib/constants/labels"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function trendLabel(change: number): string {
  if (change > 0) return `+${change}%`
  if (change < 0) return `${change}%`
  return "0%"
}

// ─── Data Transformers ───────────────────────────────────────────────────────

interface WeekData {
  weekStart: string
  weekLabel: string
  newLeads: number
  newClients: number
  propertiesListed: number
  dealsClosed: number
  revenue: number
}

interface KpiResult {
  weeksBack: number
  weeks: WeekData[]
  trends: { leadsChange: number; clientsChange: number; revenueChange: number; dealsChange: number }
  totals: { totalLeads: number; totalClients: number; totalDeals: number; totalRevenue: number }
}

interface TimelineRow {
  monthLabel: string
  leads: number
  converted: number
  soldProperties: number
}

interface TimelineResult {
  monthsBack: number
  totalLeads: number
  totalSold: number
  conversionRate: number
  timeline: TimelineRow[]
}

interface RenoProperty {
  id: number
  address: string
  district: string
  type: string
  typeLabel: string
  price: number
  status: string
  statusLabel: string
  areaM2: number
  yearBuilt: number | null
}

interface RenoResult {
  totalCount: number
  properties: RenoProperty[]
  byDistrict: { district: string; count: number }[]
}

async function fetchKpiData(weeksBack: number): Promise<KpiResult> {
  const rows = await getWeeklyReports(weeksBack)

  const weeks: WeekData[] = rows.map((r) => {
    const { week, year } = getISOWeek(r.weekStart)
    return {
      weekStart: r.weekStart.toISOString(),
      weekLabel: `T${week} ${year}`,
      newLeads: r.newLeads,
      newClients: r.newClients,
      propertiesListed: r.propertiesListed,
      dealsClosed: r.dealsClosed,
      revenue: r.revenue,
    }
  })

  const half = Math.floor(weeks.length / 2)
  const firstHalf = weeks.slice(0, half)
  const secondHalf = weeks.slice(half)

  return {
    weeksBack,
    weeks,
    trends: {
      leadsChange: pctChange(avg(secondHalf.map((w) => w.newLeads)), avg(firstHalf.map((w) => w.newLeads))),
      clientsChange: pctChange(avg(secondHalf.map((w) => w.newClients)), avg(firstHalf.map((w) => w.newClients))),
      revenueChange: pctChange(avg(secondHalf.map((w) => w.revenue)), avg(firstHalf.map((w) => w.revenue))),
      dealsChange: pctChange(avg(secondHalf.map((w) => w.dealsClosed)), avg(firstHalf.map((w) => w.dealsClosed))),
    },
    totals: {
      totalLeads: weeks.reduce((s, w) => s + w.newLeads, 0),
      totalClients: weeks.reduce((s, w) => s + w.newClients, 0),
      totalDeals: weeks.reduce((s, w) => s + w.dealsClosed, 0),
      totalRevenue: weeks.reduce((s, w) => s + w.revenue, 0),
    },
  }
}

async function fetchTimelineData(months: number): Promise<TimelineResult> {
  const timeline = await getLeadsSalesTimeline(months)
  const totalLeads = timeline.reduce((sum, m) => sum + m.leads, 0)
  const totalConverted = timeline.reduce((sum, m) => sum + m.converted, 0)
  const totalSold = timeline.reduce((sum, m) => sum + m.soldProperties, 0)
  const conversionRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0

  return { monthsBack: months, totalLeads, totalSold, conversionRate, timeline }
}

async function fetchRenoData(): Promise<RenoResult> {
  const rows = await getMissingRenovationProperties()

  const districtCounts: Record<string, number> = {}
  for (const p of rows) {
    districtCounts[p.district] = (districtCounts[p.district] ?? 0) + 1
  }
  const byDistrict = Object.entries(districtCounts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalCount: rows.length,
    properties: rows.map((p) => ({
      id: p.id,
      address: p.address,
      district: p.district,
      type: p.type,
      typeLabel: (TYPE_LABELS as Record<string, string>)[p.type] ?? p.type,
      price: p.price,
      status: p.status,
      statusLabel: (STATUS_LABELS as Record<string, string>)[p.status] ?? p.status,
      areaM2: p.areaM2,
      yearBuilt: p.yearBuilt,
    })),
    byDistrict,
  }
}

// ─── Slide Builder ───────────────────────────────────────────────────────────

function buildSlidePool(kpi: KpiResult, timeline: TimelineResult, reno: RenoResult): SlideData[] {
  const slidePool: SlideData[] = []

  // Slide 1: KPI overview
  slidePool.push({
    title: "Executive Report",
    subtitle: `Týdenní přehled · posledních ${kpi.weeksBack} týdnů`,
    metrics: [
      { label: "Celkem leadů", value: kpi.totals.totalLeads, trend: trendLabel(kpi.trends.leadsChange) },
      { label: "Noví klienti", value: kpi.totals.totalClients, trend: trendLabel(kpi.trends.clientsChange) },
      { label: "Uzavřené obchody", value: kpi.totals.totalDeals, trend: trendLabel(kpi.trends.dealsChange) },
      { label: "Celkové tržby", value: formatCZK(kpi.totals.totalRevenue), trend: trendLabel(kpi.trends.revenueChange) },
    ],
  })

  // Slide 2: Leads vs Sales timeline
  slidePool.push({
    title: "Vývoj leadů a prodejů",
    subtitle: `Posledních ${timeline.monthsBack} měsíců · Konverze: ${timeline.conversionRate}%`,
    tableHeaders: ["Měsíc", "Leady", "Konverze", "Prodeje"],
    tableRows: timeline.timeline.slice(-10).map((row) => [
      row.monthLabel, String(row.leads), String(row.converted), String(row.soldProperties),
    ]),
    metrics: [
      { label: "Celkem leadů", value: timeline.totalLeads },
      { label: "Celkem prodejů", value: timeline.totalSold },
      { label: "Konverzní poměr", value: `${timeline.conversionRate}%` },
    ],
  })

  // Slide 3: Findings / recommendations
  if (reno.totalCount > 0) {
    slidePool.push({
      title: "Operativní nálezy",
      subtitle: `Datová kvalita: ${reno.totalCount} nemovitostí bez dat o rekonstrukci`,
      bullets: [
        `Celkem ${reno.totalCount} nemovitostí postrádá rok rekonstrukce nebo poznámky.`,
        ...reno.byDistrict.slice(0, 5).map((d) => `${d.district}: ${d.count} nemovitostí bez dat`),
        "Doporučení: doplnit data před prezentací klientům.",
        "Prioritizovat nemovitosti se statusem K dispozici nebo Rezervováno.",
      ],
    })
  } else {
    const lastWeek = kpi.weeks[kpi.weeks.length - 1]
    slidePool.push({
      title: "Klíčová doporučení",
      subtitle: `Na základě analýzy posledních ${kpi.weeksBack} týdnů`,
      bullets: [
        kpi.trends.leadsChange > 5
          ? `Leady rostou (+${kpi.trends.leadsChange}%) — udržovat akviziční kanály.`
          : kpi.trends.leadsChange < -5
          ? `Leady klesají (${kpi.trends.leadsChange}%) — přezkoumat akviziční strategii.`
          : "Počet leadů je stabilní — sledovat konverze.",
        kpi.trends.revenueChange > 0
          ? `Tržby v rostoucím trendu (+${kpi.trends.revenueChange}%).`
          : `Tržby mírně klesají (${kpi.trends.revenueChange}%) — zaměřit se na uzavírání obchodů.`,
        lastWeek ? `Poslední týden (${lastWeek.weekLabel}): ${lastWeek.newLeads} leadů, ${lastWeek.dealsClosed} obchodů.` : "",
        `Konverze leadů: ${timeline.conversionRate}% — průměr oboru je 15–20%.`,
      ].filter(Boolean),
    })
  }

  // Slide 4: Weekly KPI detail
  slidePool.push({
    title: "Detail týdenního vývoje",
    subtitle: `Posledních ${Math.min(kpi.weeks.length, 8)} týdnů`,
    tableHeaders: ["Týden", "Leady", "Klienti", "Obchody", "Tržby"],
    tableRows: kpi.weeks.slice(-8).map((w) => [
      w.weekLabel, String(w.newLeads), String(w.newClients), String(w.dealsClosed), formatCZK(w.revenue),
    ]),
  })

  // Slide 5: Conversion analysis
  slidePool.push({
    title: "Analýza konverzí",
    subtitle: "Detailní pohled na efektivitu prodejního procesu",
    tableHeaders: ["Měsíc", "Leady", "Konvertováno", "Konverze %", "Prodeje"],
    tableRows: timeline.timeline.slice(-6).map((row) => {
      const convRate = row.leads > 0 ? ((row.converted / row.leads) * 100).toFixed(1) : "0"
      return [row.monthLabel, String(row.leads), String(row.converted), `${convRate}%`, String(row.soldProperties)]
    }),
    metrics: [
      { label: "Průměr oboru", value: "15–20%" },
      { label: "Naše konverze", value: `${timeline.conversionRate}%` },
      {
        label: "Rozdíl vs. obor",
        value: `${(timeline.conversionRate - 17.5).toFixed(1)}%`,
        trend: timeline.conversionRate >= 17.5
          ? `+${(timeline.conversionRate - 17.5).toFixed(1)}%`
          : `${(timeline.conversionRate - 17.5).toFixed(1)}%`,
      },
    ],
  })

  // Slide 6: Revenue trend
  slidePool.push({
    title: "Vývoj tržeb",
    subtitle: `Týdenní přehled výnosů za posledních ${Math.min(kpi.weeks.length, 10)} týdnů`,
    tableHeaders: ["Týden", "Tržby", "Obchody", "Průměr/obchod"],
    tableRows: kpi.weeks.slice(-10).map((w) => {
      const a = w.dealsClosed > 0 ? formatCZK(w.revenue / w.dealsClosed) : "—"
      return [w.weekLabel, formatCZK(w.revenue), String(w.dealsClosed), a]
    }),
    metrics: [
      { label: "Celkové tržby", value: formatCZK(kpi.totals.totalRevenue), trend: trendLabel(kpi.trends.revenueChange) },
      {
        label: "Průměr/týden",
        value: kpi.weeks.length > 0 ? formatCZK(kpi.totals.totalRevenue / kpi.weeks.length) : "—",
      },
    ],
  })

  // Slide 7: Pipeline health
  if (reno.properties.length > 0) {
    slidePool.push({
      title: "Nemovitosti vyžadující pozornost",
      subtitle: `${reno.properties.length} nemovitostí bez dat o rekonstrukci`,
      tableHeaders: ["Adresa", "Čtvrť", "Typ", "Status", "Cena"],
      tableRows: reno.properties.slice(0, 8).map((p) => [
        p.address.substring(0, 25), p.district, p.typeLabel, p.statusLabel, formatCZK(p.price),
      ]),
    })
  } else {
    const half = Math.floor(kpi.weeks.length / 2)
    const firstHalf = kpi.weeks.slice(0, half)
    const secondHalf = kpi.weeks.slice(half)
    const avgLeads1 = firstHalf.length > 0 ? (firstHalf.reduce((s, w) => s + w.newLeads, 0) / firstHalf.length).toFixed(1) : "0"
    const avgLeads2 = secondHalf.length > 0 ? (secondHalf.reduce((s, w) => s + w.newLeads, 0) / secondHalf.length).toFixed(1) : "0"
    slidePool.push({
      title: "Zdraví pipeline",
      subtitle: "Srovnání první a druhé poloviny sledovaného období",
      metrics: [
        { label: "Průměr leadů/týden (1. pol.)", value: avgLeads1 },
        { label: "Průměr leadů/týden (2. pol.)", value: avgLeads2 },
        { label: "Celkem klientů", value: kpi.totals.totalClients, trend: trendLabel(kpi.trends.clientsChange) },
        { label: "Celkem obchodů", value: kpi.totals.totalDeals, trend: trendLabel(kpi.trends.dealsChange) },
      ],
      bullets: [
        parseFloat(avgLeads2) > parseFloat(avgLeads1)
          ? "Pipeline se zlepšuje — průměrný počet leadů v druhé polovině roste."
          : "Pipeline vykazuje pokles — doporučeno prověřit akviziční aktivity.",
        `Konverze: ${timeline.conversionRate}% (cíl: 15–20%)`,
      ],
    })
  }

  // Slide 8: Action plan
  const topWeek = kpi.weeks.length > 0
    ? kpi.weeks.reduce((best, w) => w.revenue > best.revenue ? w : best, kpi.weeks[0])
    : null
  slidePool.push({
    title: "Akční plán",
    subtitle: "Prioritní kroky na základě dat",
    bullets: [
      kpi.trends.leadsChange < 0
        ? `Leady klesají (${kpi.trends.leadsChange}%) — aktivovat nové akviziční kanály.`
        : `Leady rostou (+${kpi.trends.leadsChange}%) — udržovat aktuální akviziční aktivity.`,
      timeline.conversionRate < 15
        ? `Konverze ${timeline.conversionRate}% pod průměrem oboru — přezkoumat kvalifikaci leadů.`
        : `Konverze ${timeline.conversionRate}% odpovídá průměru oboru — zaměřit se na growth.`,
      kpi.trends.revenueChange < 0
        ? `Tržby klesají (${kpi.trends.revenueChange}%) — prioritizovat uzavírání otevřených obchodů.`
        : `Tržby v rostoucím trendu (+${kpi.trends.revenueChange}%) — škálovat prodejní aktivity.`,
      reno.totalCount > 0
        ? `Doplnit data rekonstrukcí u ${reno.totalCount} nemovitostí.`
        : "Databáze nemovitostí je v pořádku — žádná chybějící data.",
      topWeek ? `Nejúspěšnější týden: ${topWeek.weekLabel} (${formatCZK(topWeek.revenue)}).` : "",
    ].filter(Boolean),
  })

  return slidePool
}

// ─── Email Body ──────────────────────────────────────────────────────────────

function buildEmailHtml(kpi: KpiResult, timeline: TimelineResult): string {
  function arrow(change: number): string {
    if (change > 0) return `<span style="color:#22c55e">&#9650; +${change}%</span>`
    if (change < 0) return `<span style="color:#ef4444">&#9660; ${change}%</span>`
    return `<span style="color:#94a3b8">&#9654; 0%</span>`
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#e2e8f0;background:#1a1a2e;padding:32px;border-radius:12px;">
      <h1 style="color:#f59e0b;font-size:20px;margin:0 0 4px;">Týdenní Executive Report</h1>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 24px;">
        ${new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:12px;background:#0f1419;border-radius:8px 0 0 8px;text-align:center;">
            <div style="color:#94a3b8;font-size:11px;">Leady</div>
            <div style="color:#f8fafc;font-size:20px;font-weight:bold;">${kpi.totals.totalLeads}</div>
            <div style="font-size:11px;">${arrow(kpi.trends.leadsChange)}</div>
          </td>
          <td style="padding:12px;background:#0f1419;text-align:center;">
            <div style="color:#94a3b8;font-size:11px;">Klienti</div>
            <div style="color:#f8fafc;font-size:20px;font-weight:bold;">${kpi.totals.totalClients}</div>
            <div style="font-size:11px;">${arrow(kpi.trends.clientsChange)}</div>
          </td>
          <td style="padding:12px;background:#0f1419;text-align:center;">
            <div style="color:#94a3b8;font-size:11px;">Obchody</div>
            <div style="color:#f8fafc;font-size:20px;font-weight:bold;">${kpi.totals.totalDeals}</div>
            <div style="font-size:11px;">${arrow(kpi.trends.dealsChange)}</div>
          </td>
          <td style="padding:12px;background:#0f1419;border-radius:0 8px 8px 0;text-align:center;">
            <div style="color:#94a3b8;font-size:11px;">Tržby</div>
            <div style="color:#f8fafc;font-size:20px;font-weight:bold;">${formatCZK(kpi.totals.totalRevenue)}</div>
            <div style="font-size:11px;">${arrow(kpi.trends.revenueChange)}</div>
          </td>
        </tr>
      </table>

      <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">
        Konverze leadů: <strong style="color:#f8fafc">${timeline.conversionRate}%</strong> ·
        Celkem prodejů: <strong style="color:#f8fafc">${timeline.totalSold}</strong>
      </p>

      <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">
        Prezentace PPTX je v příloze tohoto emailu.
      </p>

      <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;" />
      <p style="color:#64748b;font-size:10px;margin:0;">
        Automaticky vygenerováno · Back Office Agent · Prague Properties
      </p>
    </div>
  `
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function generateExecutiveReport(options: {
  recipientEmail: string
  trigger: "cron" | "manual"
  slideCount?: number
}): Promise<{ runId: number; success: boolean; error?: string }> {
  const slideCount = options.slideCount ?? 5

  const run = await createReportRun({
    trigger: options.trigger,
    recipientEmail: options.recipientEmail,
  })

  try {
    // Fetch all data in parallel
    const [kpi, timeline, reno] = await Promise.all([
      fetchKpiData(8),
      fetchTimelineData(6),
      fetchRenoData(),
    ])

    // Build slides and PPTX
    const slidePool = buildSlidePool(kpi, timeline, reno)
    const slides = slidePool.slice(0, slideCount)
    const pptxBuffer = await buildPptxBuffer(slides)

    // Build email
    const dateLabel = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })
    const subject = `Týdenní executive report — ${dateLabel}`
    const htmlBody = buildEmailHtml(kpi, timeline)

    // Send email with PPTX attachment
    await sendEmailWithAttachment(
      options.recipientEmail,
      subject,
      htmlBody,
      {
        filename: `executive-report-${new Date().toISOString().slice(0, 10)}.pptx`,
        mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        content: pptxBuffer,
      },
    )

    // Mark success
    await updateReportRun(run.id, {
      status: "SUCCESS",
      slideCount: slides.length,
      finishedAt: new Date(),
    })

    return { runId: run.id, success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[executive-report] error:", err)

    await updateReportRun(run.id, {
      status: "FAILED",
      errorMessage: errorMessage.slice(0, 500),
      finishedAt: new Date(),
    })

    return { runId: run.id, success: false, error: errorMessage }
  }
}
