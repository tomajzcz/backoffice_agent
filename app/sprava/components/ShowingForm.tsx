"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SHOWING_STATUS_LABELS } from "@/lib/constants/labels"
import { AlertTriangle, Clock } from "lucide-react"
import type { FormOption } from "@/app/sprava/actions"

// Generování časových slotů v 30min intervalech (08:00 - 20:00)
const TIME_SLOTS: string[] = []
for (let h = 8; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`)
  if (h < 20) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`)
}

export interface CalendarConflictInfo {
  conflictingEvents: Array<{ summary: string; start: string; end: string }>
  suggestedSlots: Array<{ date: string; dateLabel: string; start: string; end: string }>
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  properties?: FormOption[]
  clients?: FormOption[]
  calendarConflict?: CalendarConflictInfo | null
  onClearConflict?: () => void
}

function toDateValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function formatEventTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function ShowingForm({ open, onOpenChange, editingRecord, onSave, properties = [], clients = [], calendarConflict, onClearConflict }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  const [dateVal, setDateVal] = useState("")
  const [timeVal, setTimeVal] = useState("")

  // Reset form values when dialog opens or editingRecord changes
  useEffect(() => {
    if (open) {
      setDateVal(toDateValue(editingRecord?.scheduledAt as string) || "")
      setTimeVal(toTimeValue(editingRecord?.scheduledAt as string) || (isEdit ? "" : "10:00"))
    }
  }, [open, editingRecord, isEdit])

  function handleDateChange(val: string) {
    setDateVal(val)
    onClearConflict?.()
  }

  function handleTimeChange(val: string) {
    setTimeVal(val)
    onClearConflict?.()
  }

  function applySlot(date: string, start: string) {
    setDateVal(date)
    setTimeVal(start)
    onClearConflict?.()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      propertyId: Number(fd.get("propertyId")),
      clientId: Number(fd.get("clientId")),
      scheduledAt: new Date(`${dateVal}T${timeVal}`).toISOString(),
      status: fd.get("status") as string,
      notes: (fd.get("notes") as string) || undefined,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>
            {isEdit ? "Upravit prohlídku" : "Nová prohlídka"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Nemovitost *</Label>
              <Select name="propertyId" defaultValue={editingRecord?.propertyId != null ? String(editingRecord.propertyId) : undefined} required>
                <SelectTrigger><SelectValue placeholder="Vyberte nemovitost" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Klient *</Label>
              <Select name="clientId" defaultValue={editingRecord?.clientId != null ? String(editingRecord.clientId) : undefined} required>
                <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scheduledDate">Datum *</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="date"
                  required
                  value={dateVal}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Čas *</Label>
                <Select value={timeVal} onValueChange={(val) => handleTimeChange(val)} required>
                  <SelectTrigger><SelectValue placeholder="Vyberte čas" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calendarConflict && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-2.5">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-medium">Časový konflikt v kalendáři</p>
                </div>
                <ul className="text-xs text-red-300/80 space-y-1 pl-6">
                  {calendarConflict.conflictingEvents.map((evt, i) => (
                    <li key={i}>
                      {evt.summary} ({formatEventTime(evt.start)} – {formatEventTime(evt.end)})
                    </li>
                  ))}
                </ul>
                {calendarConflict.suggestedSlots.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Navrhované volné termíny:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {calendarConflict.suggestedSlots.map((slot, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          type="button"
                          className="h-7 text-xs px-2 border-border/50 hover:border-primary/50 hover:text-primary"
                          onClick={() => applySlot(slot.date, slot.start)}
                        >
                          {slot.dateLabel ? `${slot.dateLabel} ` : ""}{slot.start} – {slot.end}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={String(editingRecord?.status ?? "SCHEDULED")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SHOWING_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={String(editingRecord?.notes ?? "")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Zrušit</Button>
            <Button type="submit" disabled={loading}>{loading ? "Ukládám..." : isEdit ? "Uložit" : "Vytvořit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
