import { tool } from "ai"
import { z } from "zod"
import { formatCZK } from "@/lib/utils"
import type { GenerateReportResult, QueryWeeklyKPIsResult, ScanMissingRenovationResult } from "@/types/agent"

function trendArrow(change: number): string {
  if (change > 0) return `↑ +${change}%`
  if (change < 0) return `↓ ${change}%`
  return "→ 0%"
}

function buildWeeklySummary(data: QueryWeeklyKPIsResult): string {
  const { totals, trends, weeks, weeksBack } = data
  const firstWeek = weeks[0]?.weekLabel ?? ""
  const lastWeek = weeks[weeks.length - 1]?.weekLabel ?? ""

  const lines = [
    `# Týdenní report: ${firstWeek} – ${lastWeek}`,
    "",
    `*Vygenerováno: ${new Date().toLocaleDateString("cs-CZ")}*`,
    "",
    "## Souhrn za období",
    "",
    `| Metrika | Celkem | Trend |`,
    `|---------|--------|-------|`,
    `| Nové leady | ${totals.totalLeads} | ${trendArrow(trends.leadsChange)} |`,
    `| Noví klienti | ${totals.totalClients} | ${trendArrow(trends.clientsChange)} |`,
    `| Uzavřené obchody | ${totals.totalDeals} | ${trendArrow(trends.dealsChange)} |`,
    `| Tržby | ${formatCZK(totals.totalRevenue)} | ${trendArrow(trends.revenueChange)} |`,
    "",
    "## Týdenní přehled",
    "",
    `| Týden | Leady | Klienti | Obchody | Tržby |`,
    `|-------|-------|---------|---------|-------|`,
    ...weeks.map((w) =>
      `| ${w.weekLabel} | ${w.newLeads} | ${w.newClients} | ${w.dealsClosed} | ${formatCZK(w.revenue)} |`
    ),
    "",
    "## Klíčová zjištění",
    "",
    trends.leadsChange > 10
      ? `- **Leady rostou** — průměrný týdenní počet leadů vzrostl o ${trends.leadsChange}% oproti první polovině období.`
      : trends.leadsChange < -10
      ? `- **Pozor: leady klesají** — průměr o ${Math.abs(trends.leadsChange)}% níže než v první polovině období.`
      : `- Počet leadů je **stabilní** (změna ${trendArrow(trends.leadsChange)}).`,
    trends.revenueChange > 5
      ? `- Tržby v **rostoucím trendu** (${trendArrow(trends.revenueChange)} vs. předchozí polovina).`
      : trends.revenueChange < -5
      ? `- Tržby **klesají** (${trendArrow(trends.revenueChange)}) — doporučuji prověřit příčiny.`
      : `- Tržby jsou **stabilní** (${trendArrow(trends.revenueChange)}).`,
    "",
    `*Report pokrývá posledních ${weeksBack} týdnů. Data pochází z interní databáze.*`,
  ]

  return lines.join("\n")
}

function buildRenovationScan(data: ScanMissingRenovationResult): string {
  const { totalCount, byDistrict, properties } = data

  const lines = [
    `# Scan: Nemovitosti s chybějícími daty o rekonstrukci`,
    "",
    `*Vygenerováno: ${new Date().toLocaleDateString("cs-CZ")}*`,
    "",
    `## Souhrn`,
    "",
    `Celkem **${totalCount} nemovitostí** nemá vyplněný rok poslední rekonstrukce ani poznámky.`,
    "",
    "## Přehled podle čtvrti",
    "",
    `| Čtvrť | Počet |`,
    `|-------|-------|`,
    ...byDistrict.map((d) => `| ${d.district} | ${d.count} |`),
    "",
    "## Seznam nemovitostí",
    "",
    `| Adresa | Čtvrť | Typ | Plocha | Rok výstavby | Status |`,
    `|--------|-------|-----|--------|-------------|--------|`,
    ...properties.slice(0, 30).map((p) =>
      `| ${p.address} | ${p.district} | ${p.typeLabel} | ${p.areaM2} m² | ${p.yearBuilt ?? "—"} | ${p.statusLabel} |`
    ),
    properties.length > 30 ? `\n*... a dalších ${properties.length - 30} nemovitostí*` : "",
    "",
    "## Doporučení",
    "",
    "- Kontaktovat správce každé nemovitosti a doplnit rok rekonstrukce.",
    "- Priority: nemovitosti ve statusu **K dispozici** nebo **Rezervováno** — ovlivňují prezentaci klientům.",
    "- Zvážit vytvoření úkolů pro každou nemovitost přes funkci `createAgentTask`.",
  ]

  return lines.join("\n")
}

export const generateReportTool = tool({
  description:
    "Vygeneruje strukturovaný Markdown report z dat jiného toolu. " +
    "Pro weekly_summary potřebuje data z queryWeeklyKPIs. " +
    "Pro renovation_scan potřebuje data z scanMissingRenovationData. " +
    "Report se zobrazí v záložce Zpráva v UI.",
  parameters: z.object({
    reportType: z
      .enum(["weekly_summary", "renovation_scan"])
      .describe("Typ reportu: weekly_summary nebo renovation_scan"),
    data: z
      .record(z.unknown())
      .describe("Data z příslušného toolu (queryWeeklyKPIs nebo scanMissingRenovationData)"),
  }),
  execute: async ({ reportType, data }): Promise<GenerateReportResult> => {
    let markdown = ""
    let title = ""

    if (reportType === "weekly_summary") {
      const kpiData = data as unknown as QueryWeeklyKPIsResult
      title = `Týdenní report`
      markdown = buildWeeklySummary(kpiData)
    } else if (reportType === "renovation_scan") {
      const scanData = data as unknown as ScanMissingRenovationResult
      title = `Scan rekonstrukcí — ${scanData.totalCount} nemovitostí`
      markdown = buildRenovationScan(scanData)
    }

    return {
      toolName: "generateReport",
      reportType,
      title,
      markdown,
      generatedAt: new Date().toISOString(),
      chartType: "none",
    }
  },
})
