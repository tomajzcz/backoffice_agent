"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { AutomationConfigRow } from "../actions"

const CRON_PRESETS = [
  { label: "Pracovní dny 5:00 UTC (7:00 Praha)", value: "0 5 * * 1-5" },
  { label: "Pracovní dny 7:00 UTC (9:00 Praha)", value: "0 7 * * 1-5" },
  { label: "Každý den 5:00 UTC (7:00 Praha)", value: "0 5 * * *" },
  { label: "Každý den 7:00 UTC (9:00 Praha)", value: "0 7 * * *" },
  { label: "Každý den 8:00 UTC (10:00 Praha)", value: "0 8 * * *" },
  { label: "Pondělí 7:00 UTC (9:00 Praha)", value: "0 7 * * 1" },
  { label: "Pondělí 5:00 UTC (7:00 Praha)", value: "0 5 * * 1" },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AutomationConfigRow
  title: string
  showEmail?: boolean
  onSave: (data: {
    isActive: boolean
    cronExpr: string
    recipientEmail: string
  }) => Promise<void>
}

export function AutomationSettingsDialog({
  open,
  onOpenChange,
  config,
  title,
  showEmail = true,
  onSave,
}: Props) {
  const [isActive, setIsActive] = useState(config.isActive)
  const [cronExpr, setCronExpr] = useState(config.cronExpr)
  const [recipientEmail, setRecipientEmail] = useState(config.recipientEmail)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIsActive(config.isActive)
    setCronExpr(config.cronExpr)
    setRecipientEmail(config.recipientEmail)
  }, [config, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ isActive, cronExpr, recipientEmail })
    setSaving(false)
    onOpenChange(false)
  }

  const cronMatch = CRON_PRESETS.find((p) => p.value === cronExpr)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-base"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/70">
            Upravte nastavení automatizace
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs">Stav</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-secondary/20 text-muted-foreground border-border/40 hover:bg-secondary/40"
                }`}
              >
                Aktivní
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !isActive
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-secondary/20 text-muted-foreground border-border/40 hover:bg-secondary/40"
                }`}
              >
                Pozastaveno
              </button>
            </div>
          </div>

          {/* Cron schedule */}
          <div className="space-y-1.5">
            <Label className="text-xs">Plán spouštění</Label>
            <Select value={cronMatch ? cronExpr : "__custom"} onValueChange={(v) => {
              if (v !== "__custom") setCronExpr(v)
            }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Vyberte plán" />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
                {!cronMatch && (
                  <SelectItem value="__custom" className="text-xs">
                    Vlastní: {cronExpr}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={cronExpr}
                onChange={(e) => setCronExpr(e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="0 7 * * 1"
              />
              <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                cron (UTC)
              </span>
            </div>
          </div>

          {/* Email */}
          {showEmail && (
            <div className="space-y-1.5">
              <Label className="text-xs">Email příjemce</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="h-9 text-xs"
                placeholder="management@company.cz"
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs"
            >
              Zrušit
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs gap-1.5">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Uložit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
