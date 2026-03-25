"use client"

import { useState } from "react"
import { Info, ChevronDown, ChevronRight, Database, Wrench, Filter, AlertTriangle } from "lucide-react"
import type { ExplainabilityData } from "@/types/agent"

interface Props {
  data: ExplainabilityData
}

export function ExplainabilitySection({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  if (!data.toolsUsed.length) return null

  return (
    <div className="mt-4 border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary/30 transition-colors"
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span style={{ fontFamily: "Syne, sans-serif" }} className="font-medium">
          Jak jsem k tomu došel
        </span>
        {isOpen ? (
          <ChevronDown className="w-3 h-3 ml-auto shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/20 pt-3 animate-fade-in">
          {/* Tools used */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wrench className="w-3 h-3 text-primary/60" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Použité nástroje
              </span>
            </div>
            <div className="space-y-1.5">
              {data.toolsUsed.map((tool, i) => (
                <div key={i} className="pl-4">
                  <span className="text-xs text-foreground/80 font-medium">{tool.toolLabel}</span>
                  {Object.keys(tool.params).length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {Object.entries(tool.params).map(([key, val]) => (
                        <span
                          key={key}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground/60 font-mono"
                        >
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data sources */}
          {data.dataSources.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Database className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Zdroje dat
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pl-4">
                {data.dataSources.map((src) => (
                  <span
                    key={src}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 border border-primary/15"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Record counts */}
          {Object.keys(data.recordCounts).length > 0 && (
            <div className="pl-4">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                Počet záznamů:{" "}
                {Object.entries(data.recordCounts)
                  .map(([, count]) => count)
                  .join(", ")}
              </span>
            </div>
          )}

          {/* Filters */}
          {Object.keys(data.filters).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Filter className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Aplikované filtry
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pl-4">
                {Object.entries(data.filters).map(([key, val]) => (
                  <span
                    key={key}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground/60"
                  >
                    {key}: {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {data.limitations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500/60" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Omezení
                </span>
              </div>
              <ul className="pl-4 space-y-0.5">
                {data.limitations.map((lim, i) => (
                  <li key={i} className="text-[11px] text-muted-foreground/60">
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
