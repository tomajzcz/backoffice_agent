"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnswerTab } from "./AnswerTab"
import { DataTab } from "./DataTab"
import { ChartTab } from "./ChartTab"
import { LogsTab } from "./LogsTab"
import { ReportTab } from "./ReportTab"
import { EmailDraftTab } from "./EmailDraftTab"
import { EmptyState } from "./EmptyState"
import { ExportButtons } from "./ExportButtons"
import { MessageSquare, Table2, BarChart2, Activity, FileText, Mail } from "lucide-react"
import type { Message } from "ai/react"
import type { AgentToolResult, ExplainabilityData } from "@/types/agent"

interface Props {
  messages: Message[]
  latestToolResult: AgentToolResult | null
  latestExplainability?: ExplainabilityData | null
  onAction?: (prompt: string) => void
  isLoading?: boolean
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function getResultSubtitle(r: AgentToolResult): string {
  const t = r as any
  switch (r.toolName) {
    case "queryNewClients": return `${t.totalClients} klientů · ${t.period}`
    case "queryLeadsSalesTimeline": return `${t.totalLeads} leadů · ${t.monthsBack} měsíců`
    case "scanMissingRenovationData": return `${t.totalCount} nemovitostí bez dat o rekonstrukci`
    case "createAgentTask": return `Úkol #${t.taskId} uložen`
    case "queryWeeklyKPIs": return `${t.weeksBack} týdnů · ${t.totals.totalLeads} leadů celkem`
    case "generateReport": return t.title
    case "generatePresentation": return `${t.slideCount} slidů · ${t.title}`
    case "getCalendarAvailability": return `${t.totalFreeSlots} volných slotů · ${t.dateRangeStart} – ${t.dateRangeEnd}`
    case "getPropertyDetails": return `${t.property.address} · ${t.property.district}`
    case "prepareEmailDraft": return `Návrh: ${t.subject}`
    case "createGmailDraft": return `Draft: ${t.subject}`
    case "sendPresentationEmail": return `Email s prezentací odeslán na ${t.to}`
    case "listScheduledJobs": return `${t.totalJobs} monitorovacích jobů`
    case "triggerMonitoringJob": return `${t.jobName} · ${t.triggered ? "spuštěno" : "chyba"}`
    case "getMonitoringResults": return `${t.totalResults} výsledků · ${t.newResults} nových`
    case "listProperties": return `${t.totalCount} nemovitostí`
    case "listClients": return `${t.totalCount} klientů`
    case "listLeads": return `${t.totalCount} leadů`
    case "listDeals": return `${t.totalCount} obchodů`
    case "listShowings": return `${t.totalCount} prohlídek`
    case "createProperty": return `Nemovitost #${t.property.id} vytvořena`
    case "updateProperty": return `Nemovitost #${t.property.id} aktualizována`
    case "createClient": return `Klient #${t.client.id} vytvořen`
    case "updateClient": return `Klient #${t.client.id} aktualizován`
    case "createLead": return `Lead #${t.lead.id} vytvořen`
    case "updateLead": return `Lead #${t.lead.id} aktualizován`
    case "createDeal": return `Obchod #${t.deal.id} vytvořen`
    case "updateDeal": return `Obchod #${t.deal.id} aktualizován`
    case "createShowing": return `Prohlídka #${t.showing.id} naplánována`
    case "updateShowing": return `Prohlídka #${t.showing.id} aktualizována`
    case "createCalendarEvent": return `Událost vytvořena · ${t.event.summary}`
    case "updateCalendarEvent": return `Událost aktualizována · ${t.event.summary}`
    case "deleteCalendarEvent": return "Událost smazána z kalendáře"
    case "listCalendarEvents": return `${t.totalEvents} událostí v kalendáři`
    case "queryPropertiesByLifecycle": return `${t.totalCount} nemovitostí v pipeline`
    case "scanOverdueTasks": return `${t.totalOverdue} po termínu · ${t.totalDueSoon} blížících se`
    case "scanOperationalHealth": return `Zdraví: ${t.overallScore}/100 · ${t.totalIssues} problémů`
    case "calculatePropertyProfitability": return `${t.totalProperties} nemovitostí · ROI Ø ${t.averageROI}%`
    case "getInvestorOverview": return `${t.totalInvestors} investorů`
    case "getPropertyDocuments": return `${t.totalDocuments} dokumentů · ${t.propertyAddress}`
    case "scanMissingDocuments": return `${t.totalWithMissingDocs} nemovitostí s chybějícími dokumenty`
    case "analyzeNewListings": return `${t.totalResults} nabídek · ${t.jobName}`
    case "queryActiveRenovations": return `${t.totalCount} aktivních rekonstrukcí`
    case "getRenovationDetail": return `Rekonstrukce #${t.renovation.id} · ${t.renovation.propertyAddress}`
    case "scanRenovationHealth": return `Zdraví rekonstrukcí: ${t.healthScore}/100 · ${t.totalDelayed} zpožděných`
    default: return ""
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ResultsPanel({ messages, latestToolResult, latestExplainability, onAction, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState("odpoved")

  // Auto-switch tab when new tool result arrives
  useEffect(() => {
    if (!latestToolResult) return
    const { toolName } = latestToolResult
    if (toolName === "generateReport" || toolName === "generatePresentation") {
      setActiveTab("zprava")
    } else if (toolName === "createGmailDraft" || toolName === "prepareEmailDraft" || toolName === "sendPresentationEmail") {
      setActiveTab("email")
    } else if (
      toolName === "createAgentTask" ||
      toolName === "getPropertyDetails" ||
      toolName === "getPropertyDocuments" ||
      toolName === "listScheduledJobs" ||
      toolName === "getMonitoringResults" ||
      toolName === "triggerMonitoringJob" ||
      toolName === "listProperties" ||
      toolName === "createProperty" ||
      toolName === "updateProperty" ||
      toolName === "listClients" ||
      toolName === "createClient" ||
      toolName === "updateClient" ||
      toolName === "listLeads" ||
      toolName === "createLead" ||
      toolName === "updateLead" ||
      toolName === "listDeals" ||
      toolName === "createDeal" ||
      toolName === "updateDeal" ||
      toolName === "listShowings" ||
      toolName === "createShowing" ||
      toolName === "updateShowing" ||
      toolName === "createCalendarEvent" ||
      toolName === "updateCalendarEvent" ||
      toolName === "deleteCalendarEvent" ||
      toolName === "listCalendarEvents" ||
      toolName === "getRenovationDetail"
    ) {
      setActiveTab("data")
    } else {
      setActiveTab("graf")
    }
  }, [latestToolResult])

  // Switch to "odpoved" when a new assistant text appears with no tool result
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
  const hasAnswer = !!lastAssistant && (
    typeof lastAssistant.content === "string"
      ? lastAssistant.content.length > 0
      : Array.isArray(lastAssistant.content) &&
        (lastAssistant.content as unknown as { type: string; text?: string }[]).some((p) => p.type === "text" && p.text)
  )

  return (
    <div className="flex flex-col h-full bg-background/40">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/30 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            Výsledky
          </h2>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {latestToolResult ? getResultSubtitle(latestToolResult) : "Čeká na dotaz"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestToolResult && <ExportButtons result={latestToolResult} />}
          {latestToolResult && (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary/70 border border-primary/15">
              {latestToolResult.toolName}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="odpoved">
              <MessageSquare className="w-3 h-3" />
              Odpověď
            </TabsTrigger>
            <TabsTrigger value="data">
              <Table2 className="w-3 h-3" />
              Data
            </TabsTrigger>
            <TabsTrigger value="graf">
              <BarChart2 className="w-3 h-3" />
              Graf
            </TabsTrigger>
            <TabsTrigger value="zprava">
              <FileText className="w-3 h-3" />
              Zpráva
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-3 h-3" />
              Email
            </TabsTrigger>
            <TabsTrigger value="logy">
              <Activity className="w-3 h-3" />
              Logy
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
        <ScrollArea className="flex-1 h-[calc(100vh-11rem)]">
          <div className="px-4 py-4">
            <TabsContent value="odpoved">
              <AnswerTab messages={messages} explainability={latestExplainability} />
            </TabsContent>
            <TabsContent value="data">
              <DataTab result={latestToolResult} onAction={onAction} />
            </TabsContent>
            <TabsContent value="graf">
              <ChartTab result={latestToolResult} />
            </TabsContent>
            <TabsContent value="zprava">
              <ReportTab result={latestToolResult} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="email">
              {latestToolResult?.toolName === "prepareEmailDraft" || latestToolResult?.toolName === "createGmailDraft" ? (
                <EmailDraftTab result={latestToolResult} />
              ) : (
                <EmptyState icon={Mail} title="Žádný email draft k zobrazení" />
              )}
            </TabsContent>
            <TabsContent value="logy">
              <LogsTab />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
