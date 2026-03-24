"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DEAL_STATUS_LABELS } from "@/lib/constants/labels"
import type { FormOption } from "@/app/sprava/actions"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  properties?: FormOption[]
  clients?: FormOption[]
}

export function DealForm({ open, onOpenChange, editingRecord, onSave, properties = [], clients = [] }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      propertyId: Number(fd.get("propertyId")),
      clientId: Number(fd.get("clientId")),
      value: Number(fd.get("value")),
      status: fd.get("status") as string,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>
            {isEdit ? "Upravit obchod" : "Nový obchod"}
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
            <div>
              <Label htmlFor="value">Hodnota (CZK) *</Label>
              <Input id="value" name="value" type="number" required defaultValue={editingRecord?.value != null ? String(editingRecord.value) : ""} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={String(editingRecord?.status ?? "IN_PROGRESS")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEAL_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
