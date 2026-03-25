"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants/labels"

type FormOption = { id: number; label: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  properties?: FormOption[]
  deals?: FormOption[]
}

export function TaskForm({ open, onOpenChange, editingRecord, onSave, properties, deals }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingRecord

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      priority: fd.get("priority") as string,
      status: fd.get("status") as string,
      dueDate: (fd.get("dueDate") as string) || undefined,
      assignee: (fd.get("assignee") as string) || undefined,
      propertyId: fd.get("propertyId") ? Number(fd.get("propertyId")) : undefined,
      dealId: fd.get("dealId") ? Number(fd.get("dealId")) : undefined,
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
          <DialogTitle>{isEdit ? "Upravit úkol" : "Nový úkol"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Název *</label>
            <Input name="title" required defaultValue={(editingRecord?.title as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Popis</label>
            <Textarea name="description" rows={3} defaultValue={(editingRecord?.description as string) ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Priorita *</label>
              <select name="priority" required defaultValue={(editingRecord?.priority as string) ?? "MEDIUM"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {Object.entries(TASK_PRIORITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select name="status" defaultValue={(editingRecord?.status as string) ?? "OPEN"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Termín</label>
              <Input name="dueDate" type="date" defaultValue={toDateValue(editingRecord?.dueDate as string)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Zodpovědná osoba</label>
              <Input name="assignee" placeholder="např. Pepa" defaultValue={(editingRecord?.assignee as string) ?? ""} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nemovitost</label>
            <select name="propertyId" defaultValue={(editingRecord?.propertyId as number)?.toString() ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">— žádná —</option>
              {properties?.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Obchod</label>
            <select name="dealId" defaultValue={(editingRecord?.dealId as number)?.toString() ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
              <option value="">— žádný —</option>
              {deals?.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
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
