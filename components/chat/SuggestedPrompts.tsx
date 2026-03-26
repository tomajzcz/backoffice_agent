"use client"

import { useState } from "react"
import { Sunrise, Building2, AlertCircle, TrendingUp, User, FileSearch, BarChart2, ChevronDown, ChevronUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface PromptItem {
  icon: LucideIcon
  text: string
}

const PROMPTS: PromptItem[] = [
  { icon: Sunrise, text: "Ranní briefing — jaký je operativní stav firmy?" },
  { icon: Building2, text: "Kolik bytů je aktuálně v rekonstrukci? Jsou nějaké zaseklé?" },
  { icon: AlertCircle, text: "Jaké úkoly jsou po termínu?" },
  { icon: TrendingUp, text: "Jaká je očekávaná ziskovost našich nemovitostí?" },
  { icon: User, text: "Připrav přehled pro investora Nováka" },
  { icon: FileSearch, text: "Kde máme největší mezery v datech a dokumentaci?" },
  { icon: BarChart2, text: "Analyzuj nové nabídky z monitoringu Holešovic" },
  { icon: BarChart2, text: "Ukaž mi vývoj leadů a prodejů za posledních 6 měsíců" },
]

interface Props {
  onSelect: (prompt: string) => void
  visible: boolean
}

export function SuggestedPrompts({ onSelect, visible }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!visible) return null

  const visiblePrompts = expanded ? PROMPTS : PROMPTS.slice(0, 4)

  return (
    <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="text-[10px] uppercase tracking-widest text-muted-foreground/70"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Návrhy dotazů
        </span>
      </div>
      {visiblePrompts.map(({ icon: Icon, text }) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="w-full text-left px-3 py-2.5 rounded-xl border border-border/30 bg-card/40 hover:bg-card hover:border-border/60 transition-all duration-150 group flex items-start gap-2.5"
        >
          <Icon className="w-4 h-4 text-primary/50 group-hover:text-primary/80 mt-0.5 shrink-0 transition-colors" />
          <span className="text-xs text-muted-foreground/80 group-hover:text-foreground leading-snug transition-colors">
            {text}
          </span>
        </button>
      ))}
      {PROMPTS.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Zobrazit méně
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Zobrazit více
            </>
          )}
        </button>
      )}
    </div>
  )
}
