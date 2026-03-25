"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants/labels"

type FormOption = { id: number; label: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  properties?: FormOption[]
}

export function DocumentForm({ open, onOpenChange, editingRecord, onSave, properties }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      propertyId: Number(fd.get("propertyId")),
      type: fd.get("type") as string,
      name: fd.get("name") as string,
      url: (fd.get("url") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upravit dokument" : "Nový dokument"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Nemovitost *</label>
            <select name="propertyId" required defaultValue={(editingRecord?.propertyId as number)?.toString() ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">— vyberte —</option>
              {properties?.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Typ dokumentu *</label>
            <select name="type" required defaultValue={(editingRecord?.type as string) ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">— vyberte —</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Název *</label>
            <Input name="name" required defaultValue={(editingRecord?.name as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL (odkaz na dokument)</label>
            <Input name="url" type="url" placeholder="https://drive.google.com/..." defaultValue={(editingRecord?.url as string) ?? ""} />
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
