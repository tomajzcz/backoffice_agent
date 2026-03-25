"use client"

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MonitoringTab, type Job } from "./MonitoringTab"
import { ReminderCallsTab } from "./ReminderCallsTab"
import type { CallLogRow } from "../actions"

const TAB_LABELS: Record<string, string> = {
  monitoring: "Monitoring",
  calls: "Připomínkové hovory",
}

export function AutomationsClient({
  initialJobs,
  initialCallLogs,
}: {
  initialJobs: Job[]
  initialCallLogs: { items: CallLogRow[]; total: number }
}) {
  const [activeTab, setActiveTab] = useState("monitoring")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
              Automatizace
            </h1>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Monitoring, hovory, plánované úlohy
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
          >
            Zpět na chat
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 border border-border/30 h-9 mb-4">
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
            <ReminderCallsTab initialCallLogs={initialCallLogs} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
