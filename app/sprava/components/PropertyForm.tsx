"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/lib/constants/labels"
import type { FormOption } from "@/app/sprava/actions"

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  clients?: FormOption[]
}

export function PropertyForm({ open, onOpenChange, editingRecord, onSave, clients = [] }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      address: fd.get("address") as string,
      district: fd.get("district") as string,
      type: fd.get("type") as string,
      price: Number(fd.get("price")),
      areaM2: Number(fd.get("areaM2")),
      status: fd.get("status") as string || undefined,
      disposition: (fd.get("disposition") as string) || undefined,
      yearBuilt: fd.get("yearBuilt") ? Number(fd.get("yearBuilt")) : undefined,
      lastRenovationYear: fd.get("lastRenovationYear") ? Number(fd.get("lastRenovationYear")) : undefined,
      renovationNotes: (fd.get("renovationNotes") as string) || undefined,
      ownerId: fd.get("ownerId") ? Number(fd.get("ownerId")) : undefined,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>
            {isEdit ? "Upravit nemovitost" : "Nová nemovitost"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="address">Adresa *</Label>
              <Input id="address" name="address" required defaultValue={String(editingRecord?.address ?? "")} />
            </div>
            <div>
              <Label htmlFor="district">Čtvrť *</Label>
              <Input id="district" name="district" required defaultValue={String(editingRecord?.district ?? "")} />
            </div>
            <div>
              <Label htmlFor="type">Typ *</Label>
              <Select name="type" defaultValue={String(editingRecord?.type ?? "BYT")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Cena (CZK) *</Label>
              <Input id="price" name="price" type="number" required defaultValue={String(editingRecord?.price ?? "")} />
            </div>
            <div>
              <Label htmlFor="areaM2">Plocha (m²) *</Label>
              <Input id="areaM2" name="areaM2" type="number" step="0.01" required defaultValue={String(editingRecord?.areaM2 ?? "")} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={String(editingRecord?.status ?? "AVAILABLE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="disposition">Dispozice</Label>
              <Input id="disposition" name="disposition" placeholder="např. 3+kk" defaultValue={String(editingRecord?.disposition ?? "")} />
            </div>
            <div>
              <Label>Rok výstavby</Label>
              <Select name="yearBuilt" defaultValue={editingRecord?.yearBuilt != null ? String(editingRecord.yearBuilt) : undefined}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rok rekonstrukce</Label>
              <Select name="lastRenovationYear" defaultValue={editingRecord?.lastRenovationYear != null ? String(editingRecord.lastRenovationYear) : undefined}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vlastník</Label>
              <Select name="ownerId" defaultValue={editingRecord?.ownerId != null ? String(editingRecord.ownerId) : undefined}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="renovationNotes">Poznámky k rekonstrukci</Label>
              <Textarea id="renovationNotes" name="renovationNotes" rows={2} defaultValue={String(editingRecord?.renovationNotes ?? "")} />
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
