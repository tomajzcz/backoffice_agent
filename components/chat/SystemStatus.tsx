import { Database, Mail, Calendar, Cpu } from "lucide-react"

interface StatusItem {
  icon: React.ElementType
  label: string
  status: "active" | "pending" | "error"
}

const ITEMS: StatusItem[] = [
  { icon: Database, label: "PostgreSQL", status: "active" },
  { icon: Mail, label: "Gmail", status: "pending" },
  { icon: Calendar, label: "Google Kalendář", status: "pending" },
  { icon: Cpu, label: "Automatizace (n8n)", status: "pending" },
]

const STATUS_STYLES = {
  active: {
    dot: "bg-emerald-500",
    text: "text-emerald-400",
    label: "Aktivní",
  },
  pending: {
    dot: "bg-amber-500/60",
    text: "text-amber-500/70",
    label: "Čeká",
  },
  error: {
    dot: "bg-red-500",
    text: "text-red-400",
    label: "Chyba",
  },
}

export function SystemStatus() {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-2"
         style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Propojené systémy
      </p>
      {ITEMS.map(({ icon: Icon, label, status }) => {
        const style = STATUS_STYLES[status]
        return (
          <div key={label} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/80">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] ${style.text}`}>{style.label}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${style.dot} ${
                  status === "active" ? "animate-pulse" : ""
                }`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
