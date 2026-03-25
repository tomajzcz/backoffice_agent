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
      toolName === "listCalendarEvents"
    ) {
      setActiveTab("data")
    } else {
      // Tools with charts: queryNewClients, queryLeadsSalesTimeline, scan, weeklyKPIs, getCalendarAvailability
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
      <div className="px-4 py-3.5 border-b border-border/40 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            Výsledky
          </h2>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            {latestToolResult
              ? latestToolResult.toolName === "queryNewClients"
                ? `${latestToolResult.totalClients} klientů · ${latestToolResult.period}`
                : latestToolResult.toolName === "queryLeadsSalesTimeline"
                ? `${latestToolResult.totalLeads} leadů · ${latestToolResult.monthsBack} měsíců`
                : latestToolResult.toolName === "scanMissingRenovationData"
                ? `${latestToolResult.totalCount} nemovitostí bez dat o rekonstrukci`
                : latestToolResult.toolName === "createAgentTask"
                ? `Úkol #${latestToolResult.taskId} uložen`
                : latestToolResult.toolName === "queryWeeklyKPIs"
                ? `${latestToolResult.weeksBack} týdnů · ${latestToolResult.totals.totalLeads} leadů celkem`
                : latestToolResult.toolName === "generateReport"
                ? latestToolResult.title
                : latestToolResult.toolName === "generatePresentation"
                ? `${latestToolResult.slideCount} slidů · ${latestToolResult.title}`
                : latestToolResult.toolName === "getCalendarAvailability"
                ? `${latestToolResult.totalFreeSlots} volných slotů · ${latestToolResult.dateRangeStart} – ${latestToolResult.dateRangeEnd}`
                : latestToolResult.toolName === "getPropertyDetails"
                ? `${latestToolResult.property.address} · ${latestToolResult.property.district}`
                : latestToolResult.toolName === "prepareEmailDraft"
                ? `Návrh: ${latestToolResult.subject}`
                : latestToolResult.toolName === "createGmailDraft"
                ? `Draft: ${latestToolResult.subject}`
                : latestToolResult.toolName === "sendPresentationEmail"
                ? `Email s prezentací odeslán na ${latestToolResult.to}`
                : latestToolResult.toolName === "listScheduledJobs"
                ? `${latestToolResult.totalJobs} monitorovacích jobů`
                : latestToolResult.toolName === "triggerMonitoringJob"
                ? `${latestToolResult.jobName} · ${latestToolResult.triggered ? "spuštěno" : "chyba"}`
                : latestToolResult.toolName === "getMonitoringResults"
                ? `${latestToolResult.totalResults} výsledků · ${latestToolResult.newResults} nových`
                : latestToolResult.toolName === "listProperties"
                ? `${latestToolResult.totalCount} nemovitostí`
                : latestToolResult.toolName === "listClients"
                ? `${latestToolResult.totalCount} klientů`
                : latestToolResult.toolName === "listLeads"
                ? `${latestToolResult.totalCount} leadů`
                : latestToolResult.toolName === "listDeals"
                ? `${latestToolResult.totalCount} obchodů`
                : latestToolResult.toolName === "listShowings"
                ? `${latestToolResult.totalCount} prohlídek`
                : latestToolResult.toolName === "createProperty"
                ? `Nemovitost #${latestToolResult.property.id} vytvořena`
                : latestToolResult.toolName === "updateProperty"
                ? `Nemovitost #${latestToolResult.property.id} aktualizována`
                : latestToolResult.toolName === "createClient"
                ? `Klient #${latestToolResult.client.id} vytvořen`
                : latestToolResult.toolName === "updateClient"
                ? `Klient #${latestToolResult.client.id} aktualizován`
                : latestToolResult.toolName === "createLead"
                ? `Lead #${latestToolResult.lead.id} vytvořen`
                : latestToolResult.toolName === "updateLead"
                ? `Lead #${latestToolResult.lead.id} aktualizován`
                : latestToolResult.toolName === "createDeal"
                ? `Obchod #${latestToolResult.deal.id} vytvořen`
                : latestToolResult.toolName === "updateDeal"
                ? `Obchod #${latestToolResult.deal.id} aktualizován`
                : latestToolResult.toolName === "createShowing"
                ? `Prohlídka #${latestToolResult.showing.id} naplánována`
                : latestToolResult.toolName === "updateShowing"
                ? `Prohlídka #${latestToolResult.showing.id} aktualizována`
                : latestToolResult.toolName === "createCalendarEvent"
                ? `Událost vytvořena · ${latestToolResult.event.summary}`
                : latestToolResult.toolName === "updateCalendarEvent"
                ? `Událost aktualizována · ${latestToolResult.event.summary}`
                : latestToolResult.toolName === "deleteCalendarEvent"
                ? `Událost smazána z kalendáře`
                : latestToolResult.toolName === "listCalendarEvents"
                ? `${latestToolResult.totalEvents} událostí v kalendáři`
                : latestToolResult.toolName === "queryPropertiesByLifecycle"
                ? `${latestToolResult.totalCount} nemovitostí v pipeline`
                : latestToolResult.toolName === "scanOverdueTasks"
                ? `${latestToolResult.totalOverdue} po termínu · ${latestToolResult.totalDueSoon} blížících se`
                : latestToolResult.toolName === "scanOperationalHealth"
                ? `Zdraví: ${latestToolResult.overallScore}/100 · ${latestToolResult.totalIssues} problémů`
                : latestToolResult.toolName === "calculatePropertyProfitability"
                ? `${latestToolResult.totalProperties} nemovitostí · ROI Ø ${latestToolResult.averageROI}%`
                : latestToolResult.toolName === "getInvestorOverview"
                ? `${latestToolResult.totalInvestors} investorů`
                : latestToolResult.toolName === "getPropertyDocuments"
                ? `${latestToolResult.totalDocuments} dokumentů · ${latestToolResult.propertyAddress}`
                : latestToolResult.toolName === "scanMissingDocuments"
                ? `${latestToolResult.totalWithMissingDocs} nemovitostí s chybějícími dokumenty`
                : latestToolResult.toolName === "analyzeNewListings"
                ? `${latestToolResult.totalResults} nabídek · ${latestToolResult.jobName}`
                : ""
              : "Čeká na dotaz"}
          </p>
        </div>
        {latestToolResult && (
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 text-primary/70 border border-primary/15">
            {latestToolResult.toolName}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 border border-border/30 h-8">
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
                <div className="flex items-center justify-center h-40 text-muted-foreground/40 text-sm">
                  Žádný email draft k zobrazení
                </div>
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
