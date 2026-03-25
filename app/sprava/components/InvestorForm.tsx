"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRecord: Record<string, unknown> | null
  onSave: (data: Record<string, unknown>) => Promise<void>
}

export function InvestorForm({ open, onOpenChange, editingRecord, onSave }: Props) {
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
      company: (fd.get("company") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    }
    await onSave(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upravit investora" : "Nový investor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Jméno *</label>
            <Input name="name" required defaultValue={(editingRecord?.name as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email *</label>
            <Input name="email" type="email" required defaultValue={(editingRecord?.email as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Telefon</label>
            <Input name="phone" defaultValue={(editingRecord?.phone as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Společnost</label>
            <Input name="company" defaultValue={(editingRecord?.company as string) ?? ""} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Poznámky</label>
            <Textarea name="notes" rows={3} defaultValue={(editingRecord?.notes as string) ?? ""} />
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
