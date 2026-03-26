"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { JobConfig } from "@/lib/scraper/types"
import { SUGGESTED_LOCALITIES } from "@/lib/scraper/localities"

interface JobData {
  id?: number
  name: string
  description: string | null
  cronExpr: string
  notifyEmail: string | null
  configJson: JobConfig
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingJob: JobData | null
  onSave: (data: {
    name: string
    description?: string
    cronExpr: string
    notifyEmail?: string
    configJson: JobConfig
  }) => Promise<void>
}

const CRON_PRESETS = [
  { label: "Pracovní dny 7:00", value: "0 7 * * 1-5" },
  { label: "Pracovní dny 8:00", value: "0 8 * * 1-5" },
  { label: "Každý den 7:00", value: "0 7 * * *" },
  { label: "Každý den 8:00", value: "0 8 * * *" },
  { label: "Každý den 12:00", value: "0 12 * * *" },
  { label: "Pondělí 7:00", value: "0 7 * * 1" },
]

const SOURCES = ["sreality", "bezrealitky"]
const PROPERTY_TYPES = [
  { value: "BYT", label: "Byt" },
  { value: "DUM", label: "Dům" },
  { value: "KOMERCNI", label: "Komerční" },
]
const DISPOSITIONS = ["1+kk", "1+1", "2+kk", "2+1", "3+kk", "3+1", "4+kk", "4+1", "5+kk", "5+1"]

export function JobForm({ open, onOpenChange, editingJob, onSave }: Props) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!editingJob

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locality, setLocality] = useState("")
  const [cronExpr, setCronExpr] = useState("0 7 * * 1-5")
  const [notifyEmail, setNotifyEmail] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>(["sreality", "bezrealitky"])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["BYT"])
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minArea, setMinArea] = useState("")
  const [maxArea, setMaxArea] = useState("")

  useEffect(() => {
    if (open && editingJob) {
      setName(editingJob.name)
      setDescription(editingJob.description ?? "")
      setLocality(editingJob.configJson.locality ?? "")
      setCronExpr(editingJob.cronExpr)
      setNotifyEmail(editingJob.notifyEmail ?? "")
      setSelectedSources(editingJob.configJson.sources ?? ["sreality", "bezrealitky"])
      setSelectedTypes(editingJob.configJson.filters?.types ?? ["BYT"])
      setSelectedDispositions(editingJob.configJson.filters?.dispositions ?? [])
      setMinPrice(editingJob.configJson.filters?.minPrice ? String(editingJob.configJson.filters.minPrice) : "")
      setMaxPrice(editingJob.configJson.filters?.maxPrice ? String(editingJob.configJson.filters.maxPrice) : "")
      setMinArea(editingJob.configJson.filters?.minAreaM2 ? String(editingJob.configJson.filters.minAreaM2) : "")
      setMaxArea(editingJob.configJson.filters?.maxAreaM2 ? String(editingJob.configJson.filters.maxAreaM2) : "")
    } else if (open) {
      setName("")
      setDescription("")
      setLocality("")
      setCronExpr("0 7 * * 1-5")
      setNotifyEmail("")
      setSelectedSources(["sreality", "bezrealitky"])
      setSelectedTypes(["BYT"])
      setSelectedDispositions([])
      setMinPrice("")
      setMaxPrice("")
      setMinArea("")
      setMaxArea("")
    }
  }, [open, editingJob])

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const configJson: JobConfig = {
      locality,
      sources: selectedSources,
      filters: {
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minAreaM2: minArea ? Number(minArea) : undefined,
        maxAreaM2: maxArea ? Number(maxArea) : undefined,
      },
    }

    await onSave({
      name,
      description: description || undefined,
      cronExpr,
      notifyEmail: notifyEmail || undefined,
      configJson,
    })

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "Syne, sans-serif" }}>
            {isEdit ? "Upravit monitoring" : "Nový monitoring"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Název *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Monitor Praha Holešovice" />
            </div>
            <div>
              <Label>Popis</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Hledá nové byty k prodeji..." />
            </div>
            <div>
              <Label>Lokalita *</Label>
              <Input value={locality} onChange={(e) => setLocality(e.target.value)} required placeholder="Praha, Brno, Plzeň, Ostrava..." list="locality-suggestions" />
              <datalist id="locality-suggestions">
                {SUGGESTED_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Podporované lokality: kraje, města i pražské městské části</p>
            </div>

            {/* Sources */}
            <div>
              <Label className="mb-1.5 block">Zdroje *</Label>
              <div className="flex gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSources(toggleItem(selectedSources, s))}
                    className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                      selectedSources.includes(s)
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-secondary/30 border-border/30 text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Property types */}
            <div>
              <Label className="mb-1.5 block">Typ nemovitosti</Label>
              <div className="flex gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedTypes(toggleItem(selectedTypes, t.value))}
                    className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                      selectedTypes.includes(t.value)
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-secondary/30 border-border/30 text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dispositions */}
            <div>
              <Label className="mb-1.5 block">Dispozice</Label>
              <div className="flex flex-wrap gap-1.5">
                {DISPOSITIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDispositions(toggleItem(selectedDispositions, d))}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                      selectedDispositions.includes(d)
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-secondary/30 border-border/30 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Nevybráno = všechny</p>
            </div>

            {/* Price range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cena od (CZK)</Label>
                <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Cena do (CZK)</Label>
                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="12 000 000" />
              </div>
            </div>

            {/* Area range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plocha od (m²)</Label>
                <Input type="number" value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Plocha do (m²)</Label>
                <Input type="number" value={maxArea} onChange={(e) => setMaxArea(e.target.value)} placeholder="200" />
              </div>
            </div>

            {/* Schedule */}
            <div>
              <Label>Rozvrh *</Label>
              <Select value={cronExpr} onValueChange={setCronExpr}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div>
              <Label>Email pro notifikace</Label>
              <Input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="pepa@firma.cz" />
              <p className="text-[10px] text-muted-foreground/70 mt-1">Nové nabídky se odešlou na tento email</p>
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
