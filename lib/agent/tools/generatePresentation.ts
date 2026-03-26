import { tool } from "ai"
import { z } from "zod"
import { buildPptxBuffer, type SlideData } from "@/lib/export/pptx"
import { storePptx } from "@/lib/export/pptx-store"
import { formatCZK } from "@/lib/utils"
import type {
  GeneratePresentationResult,
  QueryWeeklyKPIsResult,
  QueryLeadsSalesTimelineResult,
  ScanMissingRenovationResult,
} from "@/types/agent"

function trendLabel(change: number): string {
  if (change > 0) return `+${change}%`
  if (change < 0) return `${change}%`
  return "0%"
}

export const generatePresentationTool = tool({
  description:
    "Vygeneruje PPTX prezentaci ke stažení. " +
    "Počet slidů určuje parametr slideCount (výchozí 3, pokud uživatel nezadá jinak). " +
    "K dispozici je pool 10 slidů — vždy vygeneruj přesně tolik, kolik uživatel požaduje. " +
    "Vyžaduje data z queryWeeklyKPIs a queryLeadsSalesTimeline. " +
    "Data z scanMissingRenovationData jsou volitelná.",
  parameters: z.object({
    title: z.string().default("Back Office Report").describe("Název prezentace"),
    slideCount: z.number().int().min(1).max(10).default(3).describe("Počet slidů (výchozí 3)"),
    kpiData: z.record(z.unknown()).describe("Data z queryWeeklyKPIs"),
    timelineData: z.record(z.unknown()).describe("Data z queryLeadsSalesTimeline"),
    renovationData: z.record(z.unknown()).optional().describe("Data z scanMissingRenovationData (volitelné)"),
  }),
  execute: async ({ title, slideCount = 3, kpiData, timelineData, renovationData }): Promise<GeneratePresentationResult> => {
   try {
    const kpi = kpiData as unknown as QueryWeeklyKPIsResult
    const timeline = timelineData as unknown as QueryLeadsSalesTimelineResult
    const reno = renovationData as unknown as ScanMissingRenovationResult | undefined

    // Pool of 10 slides ordered by priority
    const slidePool: SlideData[] = []

    // Slide 1: KPI overview
    slidePool.push({
      title: title,
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

    // Slide 3: Operational findings / recommendations
    if (reno && reno.totalCount > 0) {
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

    // Slide 4: Weekly KPI detail table
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

    // Slide 6: Revenue trend (weekly)
    slidePool.push({
      title: "Vývoj tržeb",
      subtitle: `Týdenní přehled výnosů za posledních ${Math.min(kpi.weeks.length, 10)} týdnů`,
      tableHeaders: ["Týden", "Tržby", "Obchody", "Průměr/obchod"],
      tableRows: kpi.weeks.slice(-10).map((w) => {
        const avg = w.dealsClosed > 0 ? formatCZK(w.revenue / w.dealsClosed) : "—"
        return [w.weekLabel, formatCZK(w.revenue), String(w.dealsClosed), avg]
      }),
      metrics: [
        { label: "Celkové tržby", value: formatCZK(kpi.totals.totalRevenue), trend: trendLabel(kpi.trends.revenueChange) },
        {
          label: "Průměr/týden",
          value: kpi.weeks.length > 0 ? formatCZK(kpi.totals.totalRevenue / kpi.weeks.length) : "—",
        },
      ],
    })

    // Slide 7: Properties with missing data (or pipeline health)
    if (reno && reno.properties.length > 0) {
      slidePool.push({
        title: "Nemovitosti vyžadující pozornost",
        subtitle: `${reno.properties.length} nemovitostí bez dat o rekonstrukci`,
        tableHeaders: ["Adresa", "Čtvrť", "Typ", "Status", "Cena"],
        tableRows: reno.properties.slice(0, 8).map((p) => [
          p.address.substring(0, 25),
          p.district,
          p.typeLabel,
          p.statusLabel,
          formatCZK(p.price),
        ]),
      })
    } else {
      // Pipeline health from kpi data
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

    // Slide 8: Performance comparison (first vs last 30% of weeks)
    const third = Math.max(1, Math.floor(kpi.weeks.length / 3))
    const early = kpi.weeks.slice(0, third)
    const recent = kpi.weeks.slice(-third)
    const sumField = (arr: typeof kpi.weeks, field: keyof typeof kpi.weeks[0]) =>
      arr.reduce((s, w) => s + (w[field] as number), 0)
    slidePool.push({
      title: "Srovnání výkonu — začátek vs. konec období",
      subtitle: `Porovnání prvních a posledních ${third} týdnů`,
      tableHeaders: ["Metrika", `Prvních ${third} týdnů`, `Posledních ${third} týdnů`, "Změna"],
      tableRows: [
        ["Leady", String(sumField(early, "newLeads")), String(sumField(recent, "newLeads")),
          trendLabel(Math.round(((sumField(recent, "newLeads") - sumField(early, "newLeads")) / Math.max(1, sumField(early, "newLeads"))) * 100))],
        ["Klienti", String(sumField(early, "newClients")), String(sumField(recent, "newClients")),
          trendLabel(Math.round(((sumField(recent, "newClients") - sumField(early, "newClients")) / Math.max(1, sumField(early, "newClients"))) * 100))],
        ["Obchody", String(sumField(early, "dealsClosed")), String(sumField(recent, "dealsClosed")),
          trendLabel(Math.round(((sumField(recent, "dealsClosed") - sumField(early, "dealsClosed")) / Math.max(1, sumField(early, "dealsClosed"))) * 100))],
        ["Tržby", formatCZK(sumField(early, "revenue")), formatCZK(sumField(recent, "revenue")),
          trendLabel(Math.round(((sumField(recent, "revenue") - sumField(early, "revenue")) / Math.max(1, sumField(early, "revenue"))) * 100))],
      ],
    })

    // Slide 9: Monthly lead acquisition detail
    slidePool.push({
      title: "Detail akvizice leadů",
      subtitle: `Celý sledovaný horizont — ${timeline.monthsBack} měsíců`,
      tableHeaders: ["Měsíc", "Nové leady", "Z toho klienti", "Prodeje", "Míra uzavření"],
      tableRows: timeline.timeline.map((row) => {
        const closeRate = row.converted > 0 ? ((row.soldProperties / row.converted) * 100).toFixed(0) : "0"
        return [row.monthLabel, String(row.leads), String(row.converted), String(row.soldProperties), `${closeRate}%`]
      }),
    })

    // Slide 10: Action plan
    const topWeek = kpi.weeks.reduce((best, w) => w.revenue > best.revenue ? w : best, kpi.weeks[0] ?? { weekLabel: "—", revenue: 0, newLeads: 0, dealsClosed: 0, newClients: 0, propertiesListed: 0, weekStart: "" })
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
        reno && reno.totalCount > 0
          ? `Doplnit data rekonstrukcí u ${reno.totalCount} nemovitostí.`
          : "Databáze nemovitostí je v pořádku — žádná chybějící data.",
        `Nejúspěšnější týden: ${topWeek.weekLabel} (${formatCZK(topWeek.revenue)}).`,
      ],
    })

    // Take exactly the requested number of slides
    const slides: SlideData[] = slidePool.slice(0, slideCount)

    try {
      const buffer = await buildPptxBuffer(slides)
      const token = await storePptx(buffer)
      const downloadUrl = `/api/export/pptx?token=${token}&filename=${encodeURIComponent(title)}`

      return {
        toolName: "generatePresentation",
        downloadUrl,
        slideCount: slides.length,
        title,
        chartType: "none",
      }
    } catch (err) {
      console.error("[generatePresentation] buildPptxBuffer error:", err)
    }

    return {
      toolName: "generatePresentation",
      downloadUrl: "",
      slideCount: slides.length,
      title,
      chartType: "none",
    }
   } catch (err) {
    console.error("[generatePresentation] error:", err)
    return {
      toolName: "generatePresentation",
      downloadUrl: "",
      slideCount: 0,
      title,
      chartType: "none",
    }
   }
  },
})
