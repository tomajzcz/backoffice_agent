"use client"

import { ClientSourcesBarChart } from "@/components/charts/ClientSourcesBarChart"
import { LeadsSalesLineChart } from "@/components/charts/LeadsSalesLineChart"
import { WeeklyKPIsBarChart } from "@/components/charts/WeeklyKPIsBarChart"
import { EmptyState } from "./EmptyState"
import { BarChart2 } from "lucide-react"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult | null
}

export function ChartTab({ result }: Props) {
  if (!result) {
    return <EmptyState icon={BarChart2} title="Spusť dotaz pro zobrazení grafu" description="Data budou vizualizována automaticky" />
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

  // ─── New operational tools ──────────────────────────────────────────────────

  if (result.toolName === "queryPropertiesByLifecycle") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Pipeline nemovitostí podle fáze"
        />
        <div className="space-y-1.5">
          {result.byStage.map((s) => {
            const pct = result.totalCount > 0 ? Math.round((s.count / result.totalCount) * 100) : 0
            return (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/70 w-36 shrink-0">{s.stageLabel}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground/60 w-8 text-right">{pct}%</span>
                <span className="text-xs font-mono text-foreground/60 w-4 text-right">{s.count}</span>
              </div>
            )
          })}
        </div>
        {result.stalledProperties.length > 0 && (
          <div className="mt-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <p className="text-xs font-medium text-amber-400 mb-2">
              Zaseklé nemovitosti ({result.stalledProperties.length})
            </p>
            {result.stalledProperties.map((p) => (
              <div key={p.id} className="text-xs text-muted-foreground/70 py-0.5">
                #{p.id} {p.address} — {p.lifecycleStageLabel} ({p.daysInStage} dní)
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (result.toolName === "scanOverdueTasks") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Prošlé úkoly podle priority"
        />
        <div className="space-y-1.5">
          {result.byPriority.map((p) => {
            const pct = result.totalOverdue > 0 ? Math.round((p.count / result.totalOverdue) * 100) : 0
            return (
              <div key={p.priority} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/70 w-20 shrink-0">{p.priorityLabel}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500/70 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-foreground/60 w-4 text-right">{p.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (result.toolName === "scanOperationalHealth") {
    const scoreColor = result.overallScore >= 70 ? "text-emerald-400" : result.overallScore >= 40 ? "text-amber-400" : "text-red-400"
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{result.overallScore}/100</span>
          <span className="text-xs text-muted-foreground/60">Operativní skóre</span>
        </div>
        <ClientSourcesBarChart
          data={result.chartData}
          title="Problémy podle kategorie"
        />
        <div className="space-y-1.5">
          {result.categories.map((c) => {
            const severityColor = c.severity === "high" ? "bg-red-500/70" : c.severity === "medium" ? "bg-amber-500/70" : "bg-blue-500/70"
            return (
              <div key={c.category} className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${severityColor} shrink-0`} />
                <span className="text-xs text-muted-foreground/70 w-44 shrink-0">{c.categoryLabel}</span>
                <span className="text-xs font-mono text-foreground/60 w-4 text-right">{c.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (result.toolName === "calculatePropertyProfitability") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Potenciální zisk (mil. Kč)"
        />
        <div className="flex gap-6 pt-1">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{result.averageROI}%</div>
            <div className="text-[10px] text-muted-foreground/70">Ø ROI</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{result.totalProperties}</div>
            <div className="text-[10px] text-muted-foreground/70">Nemovitostí</div>
          </div>
        </div>
      </div>
    )
  }

  if (result.toolName === "getInvestorOverview") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Portfolio investorů (mil. Kč)"
        />
      </div>
    )
  }

  if (result.toolName === "scanMissingDocuments") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Nemovitosti s chybějícími dokumenty"
        />
      </div>
    )
  }

  if (result.toolName === "analyzeNewListings") {
    return (
      <div className="animate-fade-in space-y-4">
        <ClientSourcesBarChart
          data={result.chartData}
          title="Průměrná cena podle dispozice (tis. Kč)"
        />
        <div className="flex gap-6 pt-1">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{result.totalResults}</div>
            <div className="text-[10px] text-muted-foreground/70">Nabídek</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {result.marketStats.avgPricePerM2.toLocaleString("cs-CZ")} Kč
            </div>
            <div className="text-[10px] text-muted-foreground/70">Ø cena/m²</div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
