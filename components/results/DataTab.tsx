"use client"

import { CheckCircle2, AlertCircle, ExternalLink, MapPin, Clock } from "lucide-react"
import { formatDate, formatCZK } from "@/lib/utils"
import { STATUS_COLORS } from "@/lib/constants/labels"
import type { AgentToolResult } from "@/types/agent"

interface Props {
  result: AgentToolResult | null
  onAction?: (prompt: string) => void
}

export function DataTab({ result, onAction }: Props) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground/60 text-sm">
        Spusť dotaz pro zobrazení dat
      </div>
    )
  }

  if (result.toolName === "queryNewClients") {
    const { clients, totalClients, period } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalClients} klientů · {period}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Jméno", "Email", "Zdroj", "Segment", "Datum"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr
                  key={client.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="py-2 pr-3 text-foreground/85 font-medium">{client.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{client.email}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
                      {client.sourceLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{client.segmentLabel}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">{formatDate(client.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "queryLeadsSalesTimeline") {
    const { timeline, totalLeads, totalSold, conversionRate, monthsBack } = result

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Celkem leadů", value: totalLeads },
            { label: "Prodeje", value: totalSold },
            { label: "Konverze", value: `${conversionRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-secondary/40 border border-border/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground/60 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {label}
              </p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground/70 font-mono">
            Posledních {monthsBack} měsíců
          </p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              {["Měsíc", "Leady", "Konverze", "Prodeje"].map((h) => (
                <th
                  key={h}
                  className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeline.map((row) => (
              <tr
                key={row.month}
                className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-2 pr-3 text-foreground/85 font-mono">{row.monthLabel}</td>
                <td className="py-2 pr-3">
                  <span className="text-amber-400 font-mono font-medium">{row.leads}</span>
                </td>
                <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{row.converted}</td>
                <td className="py-2">
                  <span className="text-emerald-400 font-mono font-medium">{row.soldProperties}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (result.toolName === "scanMissingRenovationData") {
    const { properties, totalCount, byDistrict } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} nemovitostí bez dat o rekonstrukci
          </p>
          {onAction && (
            <button
              onClick={() =>
                onAction(
                  `Vytvoř úkoly pro všechny nemovitosti bez dat o rekonstrukci — celkem ${totalCount} položek. Každý úkol pojmenuj "Doplnit data o rekonstrukci: [adresa]" s prioritou MEDIUM.`
                )
              }
              className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-2 py-1"
            >
              <AlertCircle className="w-3 h-3" />
              Uložit všechny jako úkoly
            </button>
          )}
        </div>

        {/* District breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {byDistrict.slice(0, 6).map(({ district, count }) => (
            <div key={district} className="rounded-lg bg-secondary/40 border border-border/40 px-2.5 py-2">
              <p className="text-[10px] text-muted-foreground/60 truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {district}
              </p>
              <p className="text-base font-bold text-amber-400" style={{ fontFamily: "Syne, sans-serif" }}>
                {count}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Adresa", "Čtvrť", "Typ", "Plocha", "Rok výst.", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-foreground/85 font-medium max-w-[140px] truncate">{p.address}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{p.district}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 border border-border/40 text-muted-foreground/80">
                      {p.typeLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{p.areaM2} m²</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{p.yearBuilt ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="py-2">
                    {onAction && (
                      <button
                        onClick={() =>
                          onAction(
                            `Vytvoř úkol "Doplnit data o rekonstrukci: ${p.address}" s prioritou MEDIUM pro nemovitost ID ${p.id} v ${p.district}.`
                          )
                        }
                        className="text-[10px] text-muted-foreground/60 hover:text-primary/70 transition-colors font-mono"
                      >
                        + úkol
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "createAgentTask") {
    const PRIORITY_COLORS: Record<string, string> = {
      LOW: "text-muted-foreground border-border/40 bg-secondary/40",
      MEDIUM: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      HIGH: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      URGENT: "text-red-400 border-red-500/20 bg-red-500/10",
    }
    const colorClass = PRIORITY_COLORS[result.priority] ?? PRIORITY_COLORS.MEDIUM

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            Úkol uložen
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{result.taskId}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{result.title}</p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${colorClass}`}>
              {result.priorityLabel}
            </span>
            {result.dueDate && (
              <span className="text-[10px] text-muted-foreground/70 font-mono">
                do {formatDate(result.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (result.toolName === "queryWeeklyKPIs") {
    const { weeks, totals, trends, weeksBack } = result

    function trendSign(change: number): string {
      return change > 0 ? `+${change}%` : change < 0 ? `${change}%` : "0%"
    }
    function trendColor(change: number): string {
      return change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-muted-foreground/70"
    }

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground/70 font-mono">Posledních {weeksBack} týdnů</p>
        </div>

        {/* Totals + trends */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Leady celkem", value: totals.totalLeads, change: trends.leadsChange },
            { label: "Noví klienti", value: totals.totalClients, change: trends.clientsChange },
            { label: "Uzavřené obchody", value: totals.totalDeals, change: trends.dealsChange },
            {
              label: "Tržby celkem",
              value: new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(
                totals.totalRevenue
              ),
              change: trends.revenueChange,
            },
          ].map(({ label, value, change }) => (
            <div key={label} className="rounded-lg bg-secondary/40 border border-border/40 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground/60 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {label}
              </p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                {value}
              </p>
              <p className={`text-[10px] font-mono ${trendColor(change)}`}>{trendSign(change)}</p>
            </div>
          ))}
        </div>

        {/* Per-week table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Týden", "Leady", "Klienti", "Obchody", "Tržby"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekStart} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-2 pr-3 text-foreground/85 font-mono">{w.weekLabel}</td>
                  <td className="py-2 pr-3 text-amber-400 font-mono font-medium">{w.newLeads}</td>
                  <td className="py-2 pr-3 text-violet-400 font-mono font-medium">{w.newClients}</td>
                  <td className="py-2 pr-3 text-emerald-400 font-mono font-medium">{w.dealsClosed}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">
                    {new Intl.NumberFormat("cs-CZ", {
                      style: "currency",
                      currency: "CZK",
                      maximumFractionDigits: 0,
                    }).format(w.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "getCalendarAvailability") {
    const { freeSlots, totalFreeSlots, dateRangeStart, dateRangeEnd } = result

    return (
      <div className="animate-fade-in">
        <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {totalFreeSlots} volných slotů · {dateRangeStart} – {dateRangeEnd}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Den", "Od", "Do", "Délka"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {freeSlots.map((slot) => (
                <tr
                  key={`${slot.date}-${slot.start}`}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-2 pr-3 text-foreground/85 font-medium">{slot.dateLabel}</td>
                  <td className="py-2 pr-3 text-emerald-400 font-mono font-medium">{slot.start}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{slot.end}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{slot.durationMinutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "getPropertyDetails") {
    const { property } = result

    return (
      <div className="animate-fade-in space-y-4">
        <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                {property.address}
              </h3>
              <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {property.district}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
              {property.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Typ", value: property.typeLabel },
              { label: "Cena", value: formatCZK(property.price) },
              { label: "Plocha", value: `${property.areaM2} m²` },
              { label: "Rok výstavby", value: property.yearBuilt ?? "—" },
              { label: "Posl. rekonstrukce", value: property.lastRenovationYear ?? "—" },
              { label: "Poznámky k rek.", value: property.renovationNotes ?? "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {label}
                </p>
                <p className="text-sm text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {property.ownerName && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Vlastník
              </p>
              <p className="text-sm text-foreground">{property.ownerName}</p>
              {property.ownerEmail && (
                <p className="text-xs text-muted-foreground/60 font-mono">{property.ownerEmail}</p>
              )}
              {property.ownerPhone && (
                <p className="text-xs text-muted-foreground/60 font-mono">{property.ownerPhone}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "listScheduledJobs") {
    const STATUS_COLORS: Record<string, string> = {
      ACTIVE: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      PAUSED: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      ERROR: "text-red-400 border-red-500/20 bg-red-500/10",
    }

    return (
      <div className="animate-fade-in space-y-3">
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {result.totalJobs} monitorovacích jobů
        </p>
        {result.jobs.map((job) => {
          const statusKey = job.status.split(" ")[0]
          return (
            <div key={job.id} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{job.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[statusKey] ?? ""}`}>
                  {job.status}
                </span>
              </div>
              {job.description && (
                <p className="text-xs text-muted-foreground/60">{job.description}</p>
              )}
              <div className="flex gap-4 text-[10px] text-muted-foreground/70 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {job.cronExpr}
                </span>
                {job.lastRunAt && (
                  <span>Poslední běh: {formatDate(job.lastRunAt)}</span>
                )}
                <span>{job.resultsCount} výsledků</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (result.toolName === "triggerMonitoringJob") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className={`w-10 h-10 ${result.triggered ? "text-emerald-400" : "text-amber-400"}`} />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {result.jobName}
          </p>
          <p className="text-xs text-muted-foreground/60">{result.message}</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">{formatDate(result.triggeredAt)}</p>
        </div>
      </div>
    )
  }

  if (result.toolName === "getMonitoringResults") {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {result.jobName} · {result.totalResults} výsledků · {result.newResults} nových
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Název", "Zdroj", "Cena", "Dispozice", "Nalezeno"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-2 pr-3 text-foreground/85 max-w-[200px]">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span className="truncate">{r.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-40" />
                    </a>
                    {r.isNew && (
                      <span className="ml-1 px-1 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        nové
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 border border-border/40 text-muted-foreground/80">
                      {r.source}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-amber-400 font-mono font-medium">
                    {r.price ? formatCZK(r.price) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{r.disposition ?? "—"}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">{formatDate(r.foundAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ─── CRUD: List Properties ──────────────────────────────────────────────────

  if (result.toolName === "listProperties") {
    const { properties, totalCount, limit, offset, hasMore } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} nemovitostí · zobrazeno {offset + 1}–{Math.min(offset + limit, totalCount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["ID", "Adresa", "Čtvrť", "Typ", "Cena", "Status", "Plocha"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{p.id}</td>
                  <td className="py-2 pr-3 text-foreground/85 font-medium max-w-[160px] truncate">{p.address}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{p.district}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 border border-border/40 text-muted-foreground/80">
                      {p.typeLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-amber-400 font-mono font-medium">{formatCZK(p.price)}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
                      {p.statusLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{p.areaM2} m²</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && onAction && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onAction(`Zobraz další nemovitosti (stránka od ${offset + limit})`)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Další stránka →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── CRUD: List Clients ─────────────────────────────────────────────────────

  if (result.toolName === "listClients") {
    const { clients, totalCount, limit, offset, hasMore } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} klientů · zobrazeno {offset + 1}–{Math.min(offset + limit, totalCount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["ID", "Jméno", "Email", "Zdroj", "Segment", "Datum"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{c.id}</td>
                  <td className="py-2 pr-3 text-foreground/85 font-medium">{c.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{c.email}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
                      {c.sourceLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{c.segmentLabel}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && onAction && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onAction(`Zobraz další klienty (stránka od ${offset + limit})`)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Další stránka →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── CRUD: List Leads ───────────────────────────────────────────────────────

  if (result.toolName === "listLeads") {
    const { leads, totalCount, limit, offset, hasMore } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} leadů · zobrazeno {offset + 1}–{Math.min(offset + limit, totalCount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["ID", "Jméno", "Email", "Zdroj", "Status", "Zájem", "Datum"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr
                  key={l.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{l.id}</td>
                  <td className="py-2 pr-3 text-foreground/85 font-medium">{l.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{l.email}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
                      {l.sourceLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[l.status] ?? ""}`}>
                      {l.statusLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70 max-w-[100px] truncate">{l.propertyInterest ?? "—"}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && onAction && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onAction(`Zobraz další leady (stránka od ${offset + limit})`)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Další stránka →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── CRUD: List Deals ───────────────────────────────────────────────────────

  if (result.toolName === "listDeals") {
    const { deals, totalCount, limit, offset, hasMore } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} obchodů · zobrazeno {offset + 1}–{Math.min(offset + limit, totalCount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["ID", "Nemovitost", "Klient", "Status", "Hodnota", "Datum"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr
                  key={d.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{d.id}</td>
                  <td className="py-2 pr-3 text-foreground/85 font-medium max-w-[140px] truncate">{d.propertyAddress}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{d.clientName}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[d.status] ?? ""}`}>
                      {d.statusLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-amber-400 font-mono font-medium">{formatCZK(d.value)}</td>
                  <td className="py-2 text-muted-foreground/70 font-mono">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && onAction && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onAction(`Zobraz další obchody (stránka od ${offset + limit})`)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Další stránka →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── CRUD: List Showings ────────────────────────────────────────────────────

  if (result.toolName === "listShowings") {
    const { showings, totalCount, limit, offset, hasMore } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} prohlídek · zobrazeno {offset + 1}–{Math.min(offset + limit, totalCount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["ID", "Nemovitost", "Klient", "Datum", "Status", "Poznámky"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showings.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{s.id}</td>
                  <td className="py-2 pr-3 text-foreground/85 font-medium max-w-[140px] truncate">{s.propertyAddress}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{s.clientName}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{formatDate(s.scheduledAt)}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[s.status] ?? ""}`}>
                      {s.statusLabel}
                    </span>
                  </td>
                  <td className="py-2 text-muted-foreground/70 max-w-[100px] truncate">{s.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && onAction && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onAction(`Zobraz další prohlídky (stránka od ${offset + limit})`)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors border border-primary/20 hover:border-primary/40 rounded px-3 py-1.5"
            >
              Další stránka →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── CRUD: Create/Update success cards ──────────────────────────────────────

  if (result.toolName === "createProperty" || result.toolName === "updateProperty") {
    const { property } = result
    const isUpdate = result.toolName === "updateProperty"
    const updatedFields = isUpdate ? (result as { updatedFields: string[] }).updatedFields : []

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {isUpdate ? "Nemovitost aktualizována" : "Nemovitost vytvořena"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{property.id}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{property.address}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-secondary/60 border border-border/40 text-muted-foreground/80">{property.typeLabel}</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/15">{property.statusLabel}</span>
            <span className="text-amber-400 font-mono">{formatCZK(property.price)}</span>
            <span className="text-muted-foreground/60 font-mono">{property.areaM2} m²</span>
          </div>
          {isUpdate && updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "createClient" || result.toolName === "updateClient") {
    const { client } = result
    const isUpdate = result.toolName === "updateClient"
    const updatedFields = isUpdate ? (result as { updatedFields: string[] }).updatedFields : []

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {isUpdate ? "Klient aktualizován" : "Klient vytvořen"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{client.id}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{client.name}</p>
          <p className="text-xs text-muted-foreground/60 font-mono">{client.email}</p>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 border border-border/40 text-muted-foreground/80">
            {client.segmentLabel}
          </span>
          {isUpdate && updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "createLead" || result.toolName === "updateLead") {
    const { lead } = result
    const isUpdate = result.toolName === "updateLead"
    const updatedFields = isUpdate ? (result as { updatedFields: string[] }).updatedFields : []

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {isUpdate ? "Lead aktualizován" : "Lead vytvořen"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{lead.id}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{lead.name}</p>
          <p className="text-xs text-muted-foreground/60 font-mono">{lead.email}</p>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary/80 border border-primary/15">
            {lead.statusLabel}
          </span>
          {isUpdate && updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "createDeal" || result.toolName === "updateDeal") {
    const { deal } = result
    const isUpdate = result.toolName === "updateDeal"
    const updatedFields = isUpdate ? (result as { updatedFields: string[] }).updatedFields : []

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {isUpdate ? "Obchod aktualizován" : "Obchod vytvořen"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{deal.id}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{deal.propertyAddress}</p>
          <p className="text-xs text-muted-foreground/60">{deal.clientName}</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/15">{deal.statusLabel}</span>
            <span className="text-amber-400 font-mono">{formatCZK(deal.value)}</span>
          </div>
          {isUpdate && updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "createShowing" || result.toolName === "updateShowing") {
    const { showing } = result
    const isUpdate = result.toolName === "updateShowing"
    const updatedFields = isUpdate ? (result as { updatedFields: string[] }).updatedFields : []

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-4 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            {isUpdate ? "Prohlídka aktualizována" : "Prohlídka naplánována"}
          </p>
          <p className="text-xs text-muted-foreground/60 font-mono">#{showing.id}</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{showing.propertyAddress}</p>
          <p className="text-xs text-muted-foreground/60">{showing.clientName}</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/15">{showing.statusLabel}</span>
            <span className="text-muted-foreground/60 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(showing.scheduledAt)}
            </span>
          </div>
          {isUpdate && updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Calendar Events ─────────────────────────────────────────────────────

  if (result.toolName === "listCalendarEvents") {
    const { events, totalEvents, dateRangeStart, dateRangeEnd } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalEvents} událostí · {dateRangeStart} – {dateRangeEnd}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Název", "Začátek", "Konec", "Místo", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev.googleEventId}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-2 pr-3 text-foreground/85 font-medium">{ev.summary}</td>
                  <td className="py-2 pr-3 text-emerald-400 font-mono font-medium">{formatDate(ev.start)}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70 font-mono">{formatDate(ev.end)}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{ev.location ?? "—"}</td>
                  <td className="py-2">
                    {ev.htmlLink && (
                      <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "createCalendarEvent") {
    const { event, linkedShowingId } = result

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-8">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        <p className="text-sm font-medium text-foreground/85">Událost vytvořena v kalendáři</p>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{event.summary}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
            <Clock className="w-3 h-3" />
            {formatDate(event.start)} – {formatDate(event.end)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <MapPin className="w-3 h-3" />
              {event.location}
            </div>
          )}
          {linkedShowingId && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">Propojeno s prohlídkou #{linkedShowingId}</p>
          )}
          {event.htmlLink && (
            <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary">
              <ExternalLink className="w-3 h-3" /> Otevřít v kalendáři
            </a>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "updateCalendarEvent") {
    const { event, updatedFields, linkedShowingId } = result

    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-8">
        <CheckCircle2 className="w-6 h-6 text-blue-400" />
        <p className="text-sm font-medium text-foreground/85">Událost aktualizována</p>
        <div className="w-full max-w-sm rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground/85 font-medium">{event.summary}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono">
            <Clock className="w-3 h-3" />
            {formatDate(event.start)} – {formatDate(event.end)}
          </div>
          {updatedFields.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Změněno: {updatedFields.join(", ")}
            </p>
          )}
          {linkedShowingId && (
            <p className="text-[10px] text-muted-foreground/70 font-mono">Propojeno s prohlídkou #{linkedShowingId}</p>
          )}
        </div>
      </div>
    )
  }

  if (result.toolName === "deleteCalendarEvent") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center gap-3 py-8">
        <CheckCircle2 className="w-6 h-6 text-orange-400" />
        <p className="text-sm font-medium text-foreground/85">{result.message}</p>
        {result.linkedShowingId && (
          <p className="text-[10px] text-muted-foreground/70 font-mono">
            Odkaz na kalendář odstraněn z prohlídky #{result.linkedShowingId}
          </p>
        )}
      </div>
    )
  }

  // ─── Renovation Tools ────────────────────────────────────────────────────

  if (result.toolName === "getRenovationDetail") {
    const { renovation } = result
    const budgetPct = renovation.budgetPlanned && renovation.budgetActual
      ? Math.round((renovation.budgetActual / renovation.budgetPlanned) * 100)
      : null

    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground/85" style={{ fontFamily: "Syne, sans-serif" }}>
              {renovation.propertyAddress}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
              {renovation.propertyDistrict} · {renovation.daysInProgress} dní · {renovation.phaseLabel}
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[renovation.phase] ?? ""}`}>
              {renovation.phaseLabel}
            </span>
            {renovation.isDelayed && (
              <span className="px-1.5 py-0.5 rounded text-[10px] border font-mono text-red-400 border-red-500/20 bg-red-500/10">
                Zpožděno
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground/70">Vlastník:</span>{" "}
            <span className="text-foreground/70">{renovation.ownerName ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Dodavatel:</span>{" "}
            <span className="text-foreground/70">{renovation.contractorName ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Rozpočet:</span>{" "}
            <span className={`font-mono ${budgetPct && budgetPct > 100 ? "text-red-400" : "text-amber-400"}`}>
              {renovation.budgetActual ? formatCZK(renovation.budgetActual) : "—"}
              {budgetPct ? ` (${budgetPct}%)` : ""}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Úkoly:</span>{" "}
            <span className="text-foreground/70">{renovation.openTasksCount} otevřených</span>
            {renovation.overdueTasksCount > 0 && (
              <span className="text-red-400 ml-1">({renovation.overdueTasksCount} po termínu)</span>
            )}
          </div>
        </div>

        {renovation.nextStep && (
          <div className="text-xs">
            <span className="text-muted-foreground/70">Další krok:</span>{" "}
            <span className="text-foreground/70">{renovation.nextStep}</span>
          </div>
        )}
        {renovation.blockers && (
          <div className="text-xs">
            <span className="text-red-400/70">Blokátory:</span>{" "}
            <span className="text-red-400/90">{renovation.blockers}</span>
          </div>
        )}

        {renovation.tasks.length > 0 && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {["Úkol", "Status", "Priorita", "Termín"].map((h) => (
                    <th key={h} className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renovation.tasks.map((t) => (
                  <tr key={t.id} className={`border-b border-border/20 ${t.isOverdue ? "bg-red-500/8" : ""}`}>
                    <td className="py-1.5 pr-3 text-foreground/85">{t.title}</td>
                    <td className="py-1.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[t.status] ?? ""}`}>
                        {t.statusLabel}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[t.priority] ?? ""}`}>
                        {t.priorityLabel}
                      </span>
                    </td>
                    <td className={`py-1.5 font-mono text-muted-foreground/60 ${t.isOverdue ? "text-red-400" : ""}`}>
                      {t.dueDate ? formatDate(t.dueDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (result.toolName === "queryActiveRenovations") {
    const { renovations, totalCount } = result

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalCount} aktivních rekonstrukcí
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Nemovitost", "Fáze", "Zpoždění", "Další krok", "Úkoly", "Dodavatel"].map((h) => (
                  <th key={h} className="text-left pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium border-b border-border/40 pr-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renovations.map((r) => (
                <tr key={r.id} className={`border-b border-border/20 hover:bg-secondary/30 ${r.isDelayed ? "bg-red-500/8" : ""}`}>
                  <td className="py-2 pr-3">
                    <div className="text-foreground/85 font-medium">{r.propertyAddress}</div>
                    <div className="text-[10px] text-muted-foreground/70">{r.propertyDistrict}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${STATUS_COLORS[r.phase] ?? ""}`}>
                      {r.phaseLabel}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {r.isDelayed ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] border font-mono text-red-400 border-red-500/20 bg-red-500/10">Zpožděno</span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70 max-w-[150px] truncate">{r.nextStep ?? "—"}</td>
                  <td className="py-2 pr-3 font-mono">
                    {r.openTasksCount}
                    {r.overdueTasksCount > 0 && <span className="text-red-400 ml-1">({r.overdueTasksCount}!)</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{r.contractorName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (result.toolName === "scanRenovationHealth") {
    const { issues, healthScore, totalActive, totalDelayed } = result

    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {totalActive} aktivních · {totalDelayed} zpožděných · skóre {healthScore}/100
          </p>
        </div>
        {issues.map((issue) => (
          <div key={issue.category} className="rounded-lg border border-border/40 bg-secondary/10 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground">{issue.categoryLabel}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${
                issue.severity === "high" ? "text-red-400 border-red-500/20 bg-red-500/10"
                : issue.severity === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
                : "text-muted-foreground border-border/40 bg-secondary/40"
              }`}>
                {issue.count}x
              </span>
            </div>
            <div className="space-y-1">
              {issue.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <AlertCircle className={`w-3 h-3 flex-shrink-0 ${
                    issue.severity === "high" ? "text-red-400" : "text-amber-400"
                  }`} />
                  <span className="text-foreground/70">{item.propertyAddress}</span>
                  <span className="text-muted-foreground/70">— {item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
