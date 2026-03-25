"use client"

import { Mic, MicOff } from "lucide-react"
import type { SpeechStatus } from "@/hooks/useSpeechRecognition"

interface MicButtonProps {
  status: SpeechStatus
  onClick: () => void
  disabled?: boolean
}

const statusConfig: Record<
  Exclude<SpeechStatus, "unsupported">,
  { icon: typeof Mic; title: string; className: string }
> = {
  idle: {
    icon: Mic,
    title: "Klikněte pro hlasový vstup",
    className:
      "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground",
  },
  listening: {
    icon: Mic,
    title: "Nahrávání… klikněte pro zastavení",
    className:
      "bg-primary/20 text-primary border border-primary/40 animate-pulse-mic",
  },
  "permission-denied": {
    icon: MicOff,
    title: "Mikrofon je zablokován — povolte přístup v nastavení prohlížeče",
    className: "bg-destructive/10 text-destructive/60 cursor-not-allowed",
  },
  error: {
    icon: MicOff,
    title: "Chyba rozpoznávání — klikněte pro opakování",
    className:
      "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground",
  },
}

export function MicButton({ status, onClick, disabled }: MicButtonProps) {
  if (status === "unsupported") return null

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === "permission-denied"}
      title={config.title}
      aria-label={config.title}
      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}
