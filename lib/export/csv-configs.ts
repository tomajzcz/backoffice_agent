/**
 * CSV export configurations per tool result type.
 * Defines headers, row mappers, and data extractors for each exportable result.
 */
import type { AgentToolResult } from "@/types/agent"

export interface CSVExportConfig {
  headers: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowMapper: (item: any) => string[]
  dataExtractor: (result: AgentToolResult) => unknown[]
  filenamePrefix: string
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

export const CSV_CONFIGS: Partial<Record<string, CSVExportConfig>> = {
  queryNewClients: {
    headers: ["Jméno", "Email", "Telefon", "Zdroj", "Segment", "Datum"],
    rowMapper: (c) => [c.name, c.email, c.phone ?? "", c.sourceLabel, c.segmentLabel, fmtDate(c.createdAt)],
    dataExtractor: (r) => r.toolName === "queryNewClients" ? r.clients : [],
    filenamePrefix: "klienti",
  },
  listClients: {
    headers: ["Jméno", "Email", "Telefon", "Zdroj", "Segment", "Datum"],
    rowMapper: (c) => [c.name, c.email, c.phone ?? "", c.sourceLabel, c.segmentLabel, fmtDate(c.createdAt)],
    dataExtractor: (r) => r.toolName === "listClients" ? r.clients : [],
    filenamePrefix: "klienti",
  },
  listProperties: {
    headers: ["Adresa", "Obvod", "Typ", "Cena", "Status", "Plocha m²", "Dispozice", "Rok výstavby", "Vlastník"],
    rowMapper: (p) => [p.address, p.district, p.typeLabel, fmtCZK(p.price), p.statusLabel, String(p.areaM2), p.disposition ?? "", p.yearBuilt ? String(p.yearBuilt) : "", p.ownerName ?? ""],
    dataExtractor: (r) => r.toolName === "listProperties" ? r.properties : [],
    filenamePrefix: "nemovitosti",
  },
  listLeads: {
    headers: ["Jméno", "Email", "Telefon", "Zdroj", "Status", "Zájem o nemovitost", "Datum", "Konverze"],
    rowMapper: (l) => [l.name, l.email, l.phone ?? "", l.sourceLabel, l.statusLabel, l.propertyInterest ?? "", fmtDate(l.createdAt), l.convertedAt ? fmtDate(l.convertedAt) : ""],
    dataExtractor: (r) => r.toolName === "listLeads" ? r.leads : [],
    filenamePrefix: "leady",
  },
  listDeals: {
    headers: ["Nemovitost", "Obvod", "Klient", "Status", "Hodnota", "Uzavřeno", "Vytvořeno"],
    rowMapper: (d) => [d.propertyAddress, d.propertyDistrict, d.clientName, d.statusLabel, fmtCZK(d.value), d.closedAt ? fmtDate(d.closedAt) : "", fmtDate(d.createdAt)],
    dataExtractor: (r) => r.toolName === "listDeals" ? r.deals : [],
    filenamePrefix: "obchody",
  },
  listShowings: {
    headers: ["Nemovitost", "Obvod", "Klient", "Termín", "Status", "Poznámky"],
    rowMapper: (s) => [s.propertyAddress, s.propertyDistrict, s.clientName, fmtDate(s.scheduledAt), s.statusLabel, s.notes ?? ""],
    dataExtractor: (r) => r.toolName === "listShowings" ? r.showings : [],
    filenamePrefix: "prohlidky",
  },
  scanMissingRenovationData: {
    headers: ["Adresa", "Obvod", "Typ", "Cena", "Status", "Plocha m²", "Rok výstavby"],
    rowMapper: (p) => [p.address, p.district, p.typeLabel, fmtCZK(p.price), p.statusLabel, String(p.areaM2), p.yearBuilt ? String(p.yearBuilt) : ""],
    dataExtractor: (r) => r.toolName === "scanMissingRenovationData" ? r.properties : [],
    filenamePrefix: "scan-renovace",
  },
  queryWeeklyKPIs: {
    headers: ["Týden", "Nové leady", "Noví klienti", "Inzerované nemovitosti", "Uzavřené obchody", "Tržby"],
    rowMapper: (w) => [w.weekLabel, String(w.newLeads), String(w.newClients), String(w.propertiesListed), String(w.dealsClosed), fmtCZK(w.revenue)],
    dataExtractor: (r) => r.toolName === "queryWeeklyKPIs" ? r.weeks : [],
    filenamePrefix: "kpi",
  },
  queryLeadsSalesTimeline: {
    headers: ["Měsíc", "Leady", "Konvertované", "Prodané nemovitosti"],
    rowMapper: (t) => [t.monthLabel, String(t.leads), String(t.converted), String(t.soldProperties)],
    dataExtractor: (r) => r.toolName === "queryLeadsSalesTimeline" ? r.timeline : [],
    filenamePrefix: "leady-prodeje",
  },
  getMonitoringResults: {
    headers: ["Zdroj", "Název", "URL", "Cena", "Obvod", "Dispozice", "Nalezeno", "Nový"],
    rowMapper: (m) => [m.source, m.title, m.url, m.price ? fmtCZK(m.price) : "", m.district ?? "", m.disposition ?? "", fmtDate(m.foundAt), m.isNew ? "Ano" : "Ne"],
    dataExtractor: (r) => r.toolName === "getMonitoringResults" ? r.results : [],
    filenamePrefix: "monitoring",
  },
  listCalendarEvents: {
    headers: ["Název", "Začátek", "Konec", "Místo", "Status"],
    rowMapper: (e) => [e.summary, fmtDate(e.start), fmtDate(e.end), e.location ?? "", e.status],
    dataExtractor: (r) => r.toolName === "listCalendarEvents" ? r.events : [],
    filenamePrefix: "kalendar",
  },
  getCalendarAvailability: {
    headers: ["Datum", "Den", "Od", "Do", "Trvání (min)"],
    rowMapper: (s) => [s.date, s.dateLabel, s.start, s.end, String(s.durationMinutes)],
    dataExtractor: (r) => r.toolName === "getCalendarAvailability" ? r.freeSlots : [],
    filenamePrefix: "volne-terminy",
  },
}

export function getCSVConfig(toolName: string): CSVExportConfig | null {
  return CSV_CONFIGS[toolName] ?? null
}
