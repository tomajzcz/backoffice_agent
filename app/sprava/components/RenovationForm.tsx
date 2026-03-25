"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RENOVATION_PHASE_LABELS, RENOVATION_STATUS_LABELS } from "@/lib/constants/labels"

type FormOption = { id: number; label: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  properties?: FormOption[]
}

export function RenovationForm({ open, onOpenChange, editingRecord, onSave, properties }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      propertyId: fd.get("propertyId") ? Number(fd.get("propertyId")) : undefined,
      phase: fd.get("phase") as string,
      status: fd.get("status") as string,
      plannedEndAt: (fd.get("plannedEndAt") as string) || undefined,
      nextStep: (fd.get("nextStep") as string) || undefined,
      blockers: (fd.get("blockers") as string) || undefined,
      ownerName: (fd.get("ownerName") as string) || undefined,
      contractorName: (fd.get("contractorName") as string) || undefined,
      budgetPlanned: fd.get("budgetPlanned") ? Number(fd.get("budgetPlanned")) : undefined,
      budgetActual: fd.get("budgetActual") ? Number(fd.get("budgetActual")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    }
    await onSave(data)
    setLoading(false)
  }

  function toDateValue(iso: string | null | undefined): string {
    if (!iso) return ""
    return new Date(iso).toISOString().slice(0, 10)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upravit rekonstrukci" : "Nová rekonstrukce"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Nemovitost {!isEdit ? "*" : ""}</label>
            <select name="propertyId" required={!isEdit}
              defaultValue={(editingRecord?.propertyId as number | undefined)?.toString() ?? ""}
              disabled={isEdit}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50">
              <option value="">— vyberte —</option>
              {properties?.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Fáze *</label>
              <select name="phase" required
                defaultValue={(editingRecord?.phase as string) ?? "PLANNING"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {Object.entries(RENOVATION_PHASE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select name="status"
                defaultValue={(editingRecord?.status as string) ?? "ACTIVE"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {Object.entries(RENOVATION_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Plánované dokončení</label>
              <Input name="plannedEndAt" type="date" defaultValue={toDateValue(editingRecord?.plannedEndAt as string)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Vlastník</label>
              <Input name="ownerName" placeholder="Jméno" defaultValue={(editingRecord?.ownerName as string) ?? ""} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Dodavatel</label>
            <Input name="contractorName" placeholder="Název firmy" defaultValue={(editingRecord?.contractorName as string) ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Rozpočet plán (CZK)</label>
              <Input name="budgetPlanned" type="number" min={0} defaultValue={(editingRecord?.budgetPlanned as number)?.toString() ?? ""} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Rozpočet skutečnost (CZK)</label>
              <Input name="budgetActual" type="number" min={0} defaultValue={(editingRecord?.budgetActual as number)?.toString() ?? ""} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Další krok</label>
            <Textarea name="nextStep" rows={2} defaultValue={(editingRecord?.nextStep as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Blokátory</label>
            <Textarea name="blockers" rows={2} defaultValue={(editingRecord?.blockers as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Poznámky</label>
            <Textarea name="notes" rows={2} defaultValue={(editingRecord?.notes as string) ?? ""} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Zrušit</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ukládám..." : isEdit ? "Uložit" : "Vytvořit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
