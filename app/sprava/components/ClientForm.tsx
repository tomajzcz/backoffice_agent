"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ACQUISITION_SOURCE_LABELS, CLIENT_SEGMENT_LABELS } from "@/lib/constants/labels"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
}

export function ClientForm({ open, onOpenChange, editingRecord, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      acquisitionSource: fd.get("acquisitionSource") as string,
      segment: fd.get("segment") as string,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>
            {isEdit ? "Upravit klienta" : "Nový klient"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Jméno *</Label>
              <Input id="name" name="name" required defaultValue={String(editingRecord?.name ?? "")} />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required defaultValue={String(editingRecord?.email ?? "")} />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={String(editingRecord?.phone ?? "")} />
            </div>
            <div>
              <Label htmlFor="acquisitionSource">Zdroj akvizice *</Label>
              <Select name="acquisitionSource" defaultValue={String(editingRecord?.acquisitionSource ?? "WEB")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACQUISITION_SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="segment">Segment *</Label>
              <Select name="segment" defaultValue={String(editingRecord?.segment ?? "INVESTOR")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_SEGMENT_LABELS).map(([k, v]) => (
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
