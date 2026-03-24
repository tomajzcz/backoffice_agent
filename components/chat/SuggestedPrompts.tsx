"use client"

import { Sparkles } from "lucide-react"

const PROMPTS = [
  "Kolik nových klientů jsme získali v Q1 2025?",
  "Ukaž mi vývoj leadů a prodejů za posledních 6 měsíců",
  "Jaký je breakdown zdrojů nových klientů za celý rok 2025?",
  "Porovnej Q3 a Q4 2024 z pohledu počtu klientů",
  "Ukaž mi trend leadů za posledních 12 měsíců",
  "Kolik klientů jsme získali v Q2 2025?",
]

interface Props {
  onSelect: (prompt: string) => void
  visible: boolean
}

export function SuggestedPrompts({ onSelect, visible }: Props) {
  if (!visible) return null

  return (
    <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3 text-primary/70" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Návrhy dotazů
        </span>
      </div>
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="w-full text-left text-xs text-muted-foreground/70 hover:text-foreground/90 py-1.5 px-2.5 rounded-md hover:bg-secondary/80 transition-all duration-150 border border-transparent hover:border-border/40 leading-snug"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
