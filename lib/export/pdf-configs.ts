/**
 * PDF export configurations per tool result type.
 * Reuses CSV configs where available, adds standalone configs for remaining tools.
 */
import { getCSVConfig, type CSVExportConfig } from "./csv-configs"
import type { AgentToolResult } from "@/types/agent"

export interface PDFTableConfig extends CSVExportConfig {
  title: string
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(iso))
  } catch {
    return iso
  }
}

function fmtCZK(n: number): string {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(n)
}

const PDF_TITLES: Record<string, string> = {
  queryNewClients: "Noví klienti",
  listClients: "Seznam klientů",
  listProperties: "Seznam nemovitostí",
  listLeads: "Seznam leadů",
  listDeals: "Obchody",
  listShowings: "Prohlídky",
  scanMissingRenovationData: "Scan renovací — chybějící data",
  queryWeeklyKPIs: "Týdenní KPI",
  queryLeadsSalesTimeline: "Leady a prodeje — časová osa",
  getMonitoringResults: "Výsledky monitoringu",
  listCalendarEvents: "Události v kalendáři",
  getCalendarAvailability: "Volné termíny",
}

/**
 * Standalone PDF configs for tools that don't have CSV configs.
 */
const PDF_ONLY_CONFIGS: Record<string, PDFTableConfig> = {
  getInvestorOverview: {
    title: "Přehled investorů",
    headers: ["Jméno", "Email", "Firma", "Nemovitostí", "Investováno", "Aktuální hodnota"],
    rowMapper: (inv) => [inv.name, inv.email, inv.company ?? "", String(inv.propertyCount), fmtCZK(inv.totalInvested), fmtCZK(inv.totalCurrentValue)],
    dataExtractor: (r) => r.toolName === "getInvestorOverview" ? r.investors : [],
    filenamePrefix: "investori",
  },
  calculatePropertyProfitability: {
    title: "Ziskovost nemovitostí",
    headers: ["Adresa", "Obvod", "Typ", "Nákup", "Renovace", "Oček. prodej", "Zisk", "ROI %"],
    rowMapper: (p) => [p.address, p.district, p.typeLabel, fmtCZK(p.purchasePrice), fmtCZK(p.renovationCost), fmtCZK(p.expectedSalePrice), fmtCZK(p.potentialProfit), `${p.roi.toFixed(1)} %`],
    dataExtractor: (r) => r.toolName === "calculatePropertyProfitability" ? r.properties : [],
    filenamePrefix: "ziskovost",
  },
  queryPropertiesByLifecycle: {
    title: "Nemovitosti dle fáze životního cyklu",
    headers: ["Adresa", "Obvod", "Typ", "Cena", "Fáze", "Dní ve fázi", "Vlastník"],
    rowMapper: (p) => [p.address, p.district, p.typeLabel, fmtCZK(p.price), p.lifecycleStageLabel, String(p.daysInStage), p.ownerName ?? ""],
    dataExtractor: (r) => r.toolName === "queryPropertiesByLifecycle" ? r.properties : [],
    filenamePrefix: "lifecycle",
  },
  scanOverdueTasks: {
    title: "Prošlé úkoly",
    headers: ["Úkol", "Priorita", "Termín", "Dní po termínu", "Status", "Přiřazeno", "Nemovitost"],
    rowMapper: (t) => [t.title, t.priorityLabel, fmtDate(t.dueDate), String(t.daysOverdue), t.statusLabel, t.assignee ?? "", t.propertyAddress ?? ""],
    dataExtractor: (r) => r.toolName === "scanOverdueTasks" ? r.overdueTasks : [],
    filenamePrefix: "prosle-ukoly",
  },
  scanMissingDocuments: {
    title: "Chybějící dokumenty",
    headers: ["Adresa", "Obvod", "Status", "Fáze", "Chybějící dokumenty", "Kompletnost"],
    rowMapper: (p) => [p.address, p.district, p.statusLabel, p.lifecycleStageLabel ?? "", p.missingDocLabels.join(", "), `${p.completeness} %`],
    dataExtractor: (r) => r.toolName === "scanMissingDocuments" ? r.properties : [],
    filenamePrefix: "chybejici-dokumenty",
  },
  analyzeNewListings: {
    title: "Analýza nových nabídek",
    headers: ["Zdroj", "Název", "Cena", "Kč/m²", "Obvod", "Dispozice", "Skóre", "Nalezeno"],
    rowMapper: (l) => [l.source, l.title, l.price ? fmtCZK(l.price) : "", l.pricePerM2 ? fmtCZK(l.pricePerM2) : "", l.district ?? "", l.disposition ?? "", String(l.score), fmtDate(l.foundAt)],
    dataExtractor: (r) => r.toolName === "analyzeNewListings" ? r.topListings : [],
    filenamePrefix: "nove-nabidky",
  },
  queryActiveRenovations: {
    title: "Aktivní rekonstrukce",
    headers: ["Nemovitost", "Obvod", "Fáze", "Status", "Zahájení", "Plánovaný konec", "Zpožděno", "Dodavatel"],
    rowMapper: (r) => [r.propertyAddress, r.propertyDistrict, r.phaseLabel, r.statusLabel, fmtDate(r.startedAt), r.plannedEndAt ? fmtDate(r.plannedEndAt) : "", r.isDelayed ? "Ano" : "Ne", r.contractorName ?? ""],
    dataExtractor: (r) => r.toolName === "queryActiveRenovations" ? r.renovations : [],
    filenamePrefix: "rekonstrukce",
  },
  getPropertyDocuments: {
    title: "Dokumenty nemovitosti",
    headers: ["Typ", "Název", "Nahráno", "Poznámky"],
    rowMapper: (d) => [d.typeLabel, d.name, fmtDate(d.uploadedAt), d.notes ?? ""],
    dataExtractor: (r) => r.toolName === "getPropertyDocuments" ? r.documents : [],
    filenamePrefix: "dokumenty",
  },
  listScheduledJobs: {
    title: "Monitorovací joby",
    headers: ["Název", "Popis", "CRON", "Status", "Poslední běh", "Další běh", "Výsledků"],
    rowMapper: (j) => [j.name, j.description ?? "", j.cronExpr, j.status, j.lastRunAt ? fmtDate(j.lastRunAt) : "", j.nextRunAt ? fmtDate(j.nextRunAt) : "", String(j.resultsCount)],
    dataExtractor: (r) => r.toolName === "listScheduledJobs" ? r.jobs : [],
    filenamePrefix: "monitoring-joby",
  },
}

export function getPDFTableConfig(toolName: string): PDFTableConfig | null {
  // Check standalone PDF configs first
  if (PDF_ONLY_CONFIGS[toolName]) {
    return PDF_ONLY_CONFIGS[toolName]
  }
  // Fall back to CSV config with a title
  const csv = getCSVConfig(toolName)
  if (!csv) return null
  return { ...csv, title: PDF_TITLES[toolName] ?? toolName }
}
