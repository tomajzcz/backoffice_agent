import { Loader2, Wrench } from "lucide-react"

const TOOL_LABELS: Record<string, string> = {
  queryNewClients: "Načítám klienty z databáze…",
  queryLeadsSalesTimeline: "Analyzuji leady a prodeje…",
}

interface Props {
  toolName: string
  isLoading: boolean
}

export function ToolCallIndicator({ toolName, isLoading }: Props) {
  const label = TOOL_LABELS[toolName] ?? `Spouštím: ${toolName}…`

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/15 text-xs">
      {isLoading ? (
        <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
      ) : (
        <Wrench className="w-3 h-3 text-primary/60 shrink-0" />
      )}
      <span
        className={isLoading ? "text-primary/80" : "text-muted-foreground"}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {isLoading ? label : `✓ ${TOOL_LABELS[toolName]?.replace("…", "") ?? toolName}`}
      </span>
    </div>
  )
}
