import type { agentTools } from "./tools"

type AgentTools = typeof agentTools
type ToolName = keyof AgentTools

const TOOL_GROUPS: Record<string, ToolName[]> = {
  CORE: ["generateReport", "createAgentTask"],
  ANALYTICS: [
    "queryNewClients", "queryLeadsSalesTimeline", "queryWeeklyKPIs",
    "queryPropertiesByLifecycle", "calculatePropertyProfitability", "getInvestorOverview",
  ],
  CALENDAR: [
    "getCalendarAvailability", "createCalendarEvent", "updateCalendarEvent",
    "deleteCalendarEvent", "listCalendarEvents",
  ],
  EMAIL_EXPORT: ["createGmailDraft", "sendPresentationEmail", "generatePresentation"],
  CRUD_PROPERTIES: [
    "listProperties", "createProperty", "updateProperty",
    "getPropertyDetails", "getPropertyDocuments",
  ],
  CRUD_CLIENTS: ["listClients", "createClient", "updateClient"],
  CRUD_LEADS: ["listLeads", "createLead", "updateLead"],
  CRUD_DEALS: ["listDeals", "createDeal", "updateDeal"],
  CRUD_SHOWINGS: ["listShowings", "createShowing", "updateShowing"],
  MONITORING: [
    "listScheduledJobs", "triggerMonitoringJob", "getMonitoringResults",
    "createMonitoringJob", "analyzeNewListings",
  ],
  RENOVATION: ["queryActiveRenovations", "getRenovationDetail", "scanRenovationHealth"],
  DATA_QUALITY: [
    "scanMissingRenovationData", "scanMissingDocuments",
    "scanOperationalHealth", "scanOverdueTasks",
  ],
}

const KEYWORD_GROUPS: [string, string[]][] = [
  // Clients
  ["klient", ["CRUD_CLIENTS", "ANALYTICS"]],
  ["klienty", ["CRUD_CLIENTS", "ANALYTICS"]],
  ["klientů", ["CRUD_CLIENTS", "ANALYTICS"]],
  // Leads
  ["lead", ["CRUD_LEADS", "ANALYTICS"]],
  ["leady", ["CRUD_LEADS", "ANALYTICS"]],
  ["leadů", ["CRUD_LEADS", "ANALYTICS"]],
  // Properties
  ["nemovitost", ["CRUD_PROPERTIES", "ANALYTICS"]],
  ["nemovitosti", ["CRUD_PROPERTIES", "ANALYTICS"]],
  ["byt", ["CRUD_PROPERTIES"]],
  ["bytů", ["CRUD_PROPERTIES"]],
  ["adres", ["CRUD_PROPERTIES"]],
  // Deals
  ["obchod", ["CRUD_DEALS"]],
  ["dealů", ["CRUD_DEALS"]],
  ["deal", ["CRUD_DEALS"]],
  ["prodej", ["CRUD_DEALS", "ANALYTICS"]],
  ["tržb", ["CRUD_DEALS", "ANALYTICS"]],
  // Showings / SMS
  ["prohlíd", ["CRUD_SHOWINGS", "CALENDAR"]],
  ["prohlíž", ["CRUD_SHOWINGS", "CALENDAR"]],
  ["prohlidk", ["CRUD_SHOWINGS", "CALENDAR"]],
  ["sms", ["CRUD_SHOWINGS", "CALENDAR"]],
  // Calendar
  ["kalendář", ["CALENDAR"]],
  ["kalendar", ["CALENDAR"]],
  ["termín", ["CALENDAR"]],
  ["schůzk", ["CALENDAR"]],
  ["událost", ["CALENDAR"]],
  // Email / Export
  ["email", ["EMAIL_EXPORT", "CRUD_PROPERTIES"]],
  ["mail", ["EMAIL_EXPORT"]],
  ["draft", ["EMAIL_EXPORT"]],
  ["prezentac", ["EMAIL_EXPORT", "ANALYTICS"]],
  ["pptx", ["EMAIL_EXPORT", "ANALYTICS"]],
  // Reports
  ["report", ["CORE", "ANALYTICS"]],
  ["zpráv", ["CORE", "ANALYTICS"]],
  ["přehled", ["ANALYTICS"]],
  ["pdf", ["CORE", "ANALYTICS"]],
  // Monitoring
  ["monitoring", ["MONITORING"]],
  ["nabíd", ["MONITORING"]],
  ["sreality", ["MONITORING"]],
  ["bezrealitky", ["MONITORING"]],
  ["inzerát", ["MONITORING"]],
  // Renovation
  ["rekonstrukc", ["RENOVATION"]],
  ["renovac", ["RENOVATION"]],
  ["oprav", ["RENOVATION"]],
  ["stavb", ["RENOVATION"]],
  ["dodavatel", ["RENOVATION"]],
  // Data quality / Briefing
  ["briefing", ["DATA_QUALITY", "RENOVATION", "ANALYTICS"]],
  ["ranní", ["DATA_QUALITY", "RENOVATION", "ANALYTICS"]],
  ["stav", ["DATA_QUALITY", "ANALYTICS"]],
  ["zdraví", ["DATA_QUALITY", "RENOVATION"]],
  ["audit", ["DATA_QUALITY", "RENOVATION"]],
  ["problém", ["DATA_QUALITY"]],
  // Tasks
  ["úkol", ["CORE", "DATA_QUALITY"]],
  ["task", ["CORE", "DATA_QUALITY"]],
  ["prošl", ["DATA_QUALITY"]],
  // Documents
  ["dokument", ["CRUD_PROPERTIES", "DATA_QUALITY"]],
  ["chybějíc", ["DATA_QUALITY"]],
  // Investor
  ["investor", ["ANALYTICS", "CRUD_PROPERTIES"]],
  ["portfolio", ["ANALYTICS"]],
  ["roi", ["ANALYTICS"]],
  ["zisk", ["ANALYTICS"]],
  ["výnos", ["ANALYTICS"]],
  // KPIs
  ["kpi", ["ANALYTICS"]],
  ["týden", ["ANALYTICS"]],
  ["měsíc", ["ANALYTICS"]],
  ["kvartál", ["ANALYTICS"]],
  ["pipeline", ["ANALYTICS", "DATA_QUALITY"]],
  // CRUD verbs (broad — include all CRUD groups)
  ["vytvoř", ["CRUD_PROPERTIES", "CRUD_CLIENTS", "CRUD_LEADS", "CRUD_DEALS", "CRUD_SHOWINGS"]],
  ["přidej", ["CRUD_PROPERTIES", "CRUD_CLIENTS", "CRUD_LEADS", "CRUD_DEALS", "CRUD_SHOWINGS"]],
  ["uprav", ["CRUD_PROPERTIES", "CRUD_CLIENTS", "CRUD_LEADS", "CRUD_DEALS", "CRUD_SHOWINGS"]],
  ["aktualizuj", ["CRUD_PROPERTIES", "CRUD_CLIENTS", "CRUD_LEADS", "CRUD_DEALS", "CRUD_SHOWINGS"]],
  ["smaž", ["CALENDAR"]],
  ["zruš", ["CRUD_SHOWINGS", "CALENDAR"]],
]

/**
 * Select only relevant tools based on keyword analysis of the user's message.
 * Falls back to all tools if no keywords match.
 */
export function selectTools(userMessage: string, allTools: AgentTools): Partial<AgentTools> {
  const lower = userMessage.toLowerCase()
  const matchedGroups = new Set<string>(["CORE"])

  for (const [keyword, groups] of KEYWORD_GROUPS) {
    if (lower.includes(keyword)) {
      for (const group of groups) {
        matchedGroups.add(group)
      }
    }
  }

  // Fallback: if only CORE matched, send all tools (unclear intent)
  if (matchedGroups.size <= 1) {
    return allTools
  }

  const selectedNames = new Set<ToolName>()
  for (const groupName of matchedGroups) {
    const tools = TOOL_GROUPS[groupName]
    if (tools) {
      for (const name of tools) {
        selectedNames.add(name)
      }
    }
  }

  const filtered: Partial<AgentTools> = {}
  for (const name of selectedNames) {
    if (name in allTools) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(filtered as any)[name] = allTools[name]
    }
  }

  return filtered
}
