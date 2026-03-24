"use client"

import { ClientSourcesBarChart } from "@/components/charts/ClientSourcesBarChart"
import { LeadsSalesLineChart } from "@/components/charts/LeadsSalesLineChart"
import { WeeklyKPIsBarChart } from "@/components/charts/WeeklyKPIsBarChart"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult | null
}

export function ChartTab({ result }: Props) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground/40 text-sm">
        Spusť dotaz pro zobrazení grafu
      </div>
    )
  }

  if (result.toolName === "queryNewClients") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title={`Noví klienti podle zdroje — ${result.period}`}
        />
        {/* Source breakdown */}
        <div className="space-y-1.5">
          {result.bySource.map((s) => (
            <div key={s.source} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/70 w-28 shrink-0">{s.sourceLabel}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all duration-700"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground/60 w-8 text-right">{s.percentage}%</span>
              <span className="text-xs font-mono text-foreground/60 w-4 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (result.toolName === "queryLeadsSalesTimeline") {
    return (
      <div className="animate-fade-in space-y-3">
        <LeadsSalesLineChart
          data={result.chartData}
          title={`Vývoj leadů vs. prodejů — posledních ${result.monthsBack} měsíců`}
        />
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-500 inline-block rounded" />
            <span className="text-xs text-muted-foreground/70">Leady (celkem {result.totalLeads})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
            <span className="text-xs text-muted-foreground/70">Prodeje (celkem {result.totalSold})</span>
          </div>
        </div>
      </div>
    )
  }

  if (result.toolName === "scanMissingRenovationData") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Nemovitosti bez dat o rekonstrukci — podle čtvrti"
        />
        <div className="space-y-1.5">
          {result.byDistrict.map((d) => {
            const pct = result.totalCount > 0 ? Math.round((d.count / result.totalCount) * 100) : 0
            return (
              <div key={d.district} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/70 w-32 shrink-0 truncate">{d.district}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500/70 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground/60 w-8 text-right">{pct}%</span>
                <span className="text-xs font-mono text-foreground/60 w-4 text-right">{d.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (result.toolName === "queryWeeklyKPIs") {
    return (
      <div className="animate-fade-in space-y-3">
        <WeeklyKPIsBarChart
          data={result.chartData}
          title={`Týdenní KPI — posledních ${result.weeksBack} týdnů`}
        />
        <div className="flex gap-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-2.5 bg-amber-500 inline-block rounded-sm" />
            <span className="text-xs text-muted-foreground/70">Leady</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2.5 inline-block rounded-sm" style={{ background: "hsl(258,90%,66%)" }} />
            <span className="text-xs text-muted-foreground/70">Klienti</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-2.5 bg-emerald-600 inline-block rounded-sm" />
            <span className="text-xs text-muted-foreground/70">Obchody</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
