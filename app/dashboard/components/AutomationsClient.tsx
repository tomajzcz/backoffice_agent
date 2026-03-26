"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MonitoringTab, type Job } from "./MonitoringTab"
import { ReminderCallsTab } from "./ReminderCallsTab"
import { OtherAutomationsTab } from "./OtherAutomationsTab"
import { AppLayout } from "@/components/layout/AppLayout"
import { LayoutDashboard } from "lucide-react"
import type { CallLogRow, ReportRunRow, AutomationConfigRow } from "../actions"

const TAB_LABELS: Record<string, string> = {
  monitoring: "Monitoring",
  calls: "Připomínkové hovory",
  automations: "Ostatní automatizace",
}

export function AutomationsClient({
  initialJobs,
  initialCallLogs,
  initialCallsConfig,
  initialReportRuns,
  initialReportConfig,
}: {
  initialJobs: Job[]
  initialCallLogs: { items: CallLogRow[]; total: number }
  initialCallsConfig: AutomationConfigRow | null
  initialReportRuns: { items: ReportRunRow[]; total: number }
  initialReportConfig: AutomationConfigRow | null
}) {
  const [activeTab, setActiveTab] = useState("monitoring")

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <header className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
                Automatizace
              </h1>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Monitoring, hovory, plánované úlohy
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {Object.entries(TAB_LABELS).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="monitoring">
              <MonitoringTab initialJobs={initialJobs} />
            </TabsContent>

            <TabsContent value="calls">
              <ReminderCallsTab initialCallLogs={initialCallLogs} initialConfig={initialCallsConfig} />
            </TabsContent>

            <TabsContent value="automations">
              <OtherAutomationsTab
                initialReportRuns={initialReportRuns}
                initialConfig={initialReportConfig}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  )
}
