import type { ToolCallLog, ExplainabilityData } from "@/types/agent"

// Czech labels for all tools
const TOOL_LABELS: Record<string, string> = {
  queryNewClients: "Dotaz na nové klienty",
  queryLeadsSalesTimeline: "Časová osa leadů a prodejů",
  queryWeeklyKPIs: "Týdenní KPI přehled",
  scanMissingRenovationData: "Sken chybějících dat o rekonstrukci",
  generateReport: "Generování zprávy",
  createAgentTask: "Vytvoření úkolu",
  getCalendarAvailability: "Zjištění volných termínů",
  createCalendarEvent: "Vytvoření události v kalendáři",
  updateCalendarEvent: "Aktualizace události v kalendáři",
  deleteCalendarEvent: "Smazání události z kalendáře",
  listCalendarEvents: "Seznam událostí v kalendáři",
  createGmailDraft: "Příprava e-mailového draftu",
  generatePresentation: "Generování prezentace",
  sendPresentationEmail: "Odeslání prezentace e-mailem",
  listScheduledJobs: "Seznam monitorovacích jobů",
  createMonitoringJob: "Vytvoření monitorovacího jobu",
  triggerMonitoringJob: "Spuštění monitorovacího jobu",
  getMonitoringResults: "Výsledky monitoringu",
  listProperties: "Seznam nemovitostí",
  createProperty: "Vytvoření nemovitosti",
  updateProperty: "Aktualizace nemovitosti",
  listClients: "Seznam klientů",
  createClient: "Vytvoření klienta",
  updateClient: "Aktualizace klienta",
  listLeads: "Seznam leadů",
  createLead: "Vytvoření leadu",
  updateLead: "Aktualizace leadu",
  listDeals: "Seznam obchodů",
  createDeal: "Vytvoření obchodu",
  updateDeal: "Aktualizace obchodu",
  listShowings: "Seznam prohlídek",
  createShowing: "Naplánování prohlídky",
  updateShowing: "Aktualizace prohlídky",
  getPropertyDetails: "Detail nemovitosti",
}

// Data source mapping per tool
const DATA_SOURCES: Record<string, string[]> = {
  queryNewClients: ["PostgreSQL: clients"],
  queryLeadsSalesTimeline: ["PostgreSQL: leads", "PostgreSQL: properties"],
  queryWeeklyKPIs: ["PostgreSQL: weekly_reports"],
  scanMissingRenovationData: ["PostgreSQL: properties"],
  generateReport: ["PostgreSQL: weekly_reports"],
  createAgentTask: ["PostgreSQL: agent_tasks"],
  getCalendarAvailability: ["Google Calendar API"],
  createCalendarEvent: ["Google Calendar API"],
  updateCalendarEvent: ["Google Calendar API"],
  deleteCalendarEvent: ["Google Calendar API"],
  listCalendarEvents: ["Google Calendar API"],
  createGmailDraft: ["Gmail API"],
  generatePresentation: ["Generátor PPTX"],
  sendPresentationEmail: ["Gmail API"],
  listScheduledJobs: ["PostgreSQL: scheduled_jobs"],
  createMonitoringJob: ["PostgreSQL: scheduled_jobs"],
  triggerMonitoringJob: ["n8n webhook"],
  getMonitoringResults: ["PostgreSQL: monitoring_results"],
  listProperties: ["PostgreSQL: properties"],
  createProperty: ["PostgreSQL: properties"],
  updateProperty: ["PostgreSQL: properties"],
  listClients: ["PostgreSQL: clients"],
  createClient: ["PostgreSQL: clients"],
  updateClient: ["PostgreSQL: clients"],
  listLeads: ["PostgreSQL: leads"],
  createLead: ["PostgreSQL: leads"],
  updateLead: ["PostgreSQL: leads"],
  listDeals: ["PostgreSQL: deals"],
  createDeal: ["PostgreSQL: deals"],
  updateDeal: ["PostgreSQL: deals"],
  listShowings: ["PostgreSQL: showings"],
  createShowing: ["PostgreSQL: showings", "Google Calendar API"],
  updateShowing: ["PostgreSQL: showings", "Google Calendar API"],
  getPropertyDetails: ["PostgreSQL: properties", "PostgreSQL: clients"],
}

// Sensitive param keys to exclude from explainability
const HIDDEN_PARAMS = new Set([
  "googleEventId",
  "googleCalendarEventId",
  "draftId",
  "pptxToken",
  "token",
  "secret",
])

function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (HIDDEN_PARAMS.has(key)) continue
    if (typeof value === "string" && value.length > 200) {
      clean[key] = value.slice(0, 100) + "…"
    } else {
      clean[key] = value
    }
  }
  return clean
}

function extractFilters(params: Record<string, unknown>): Record<string, string> {
  const filters: Record<string, string> = {}
  if (params.year) filters["Rok"] = String(params.year)
  if (params.quarter) filters["Kvartál"] = `Q${params.quarter}`
  if (params.monthsBack) filters["Období"] = `Posledních ${params.monthsBack} měsíců`
  if (params.weeksBack) filters["Období"] = `Posledních ${params.weeksBack} týdnů`
  if (params.district) filters["Obvod"] = String(params.district)
  if (params.status) filters["Status"] = String(params.status)
  if (params.type) filters["Typ"] = String(params.type)
  if (params.limit) filters["Limit"] = `${params.limit} záznamů`
  if (params.offset) filters["Offset"] = String(params.offset)
  if (params.dateFrom) filters["Od"] = String(params.dateFrom)
  if (params.dateTo) filters["Do"] = String(params.dateTo)
  if (params.days) filters["Období"] = `Posledních ${params.days} dní`
  if (params.source) filters["Zdroj"] = String(params.source)
  if (params.segment) filters["Segment"] = String(params.segment)
  return filters
}

export function buildExplainability(
  toolCalls: ToolCallLog[],
  recordCounts: Record<string, number> = {},
): ExplainabilityData {
  const toolsUsed = toolCalls.map((tc) => ({
    toolName: tc.toolName,
    toolLabel: TOOL_LABELS[tc.toolName] ?? tc.toolName,
    params: sanitizeParams(tc.params),
    durationMs: undefined,
  }))

  const dataSources = [
    ...new Set(toolCalls.flatMap((tc) => DATA_SOURCES[tc.toolName] ?? ["PostgreSQL"])),
  ]

  const allFilters: Record<string, string> = {}
  for (const tc of toolCalls) {
    Object.assign(allFilters, extractFilters(tc.params))
  }

  return {
    type: "explainability",
    turnId: crypto.randomUUID(),
    toolsUsed,
    dataSources,
    recordCounts,
    filters: allFilters,
    limitations: [],
    timestamp: new Date().toISOString(),
  }
}
