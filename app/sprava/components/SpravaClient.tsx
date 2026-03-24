"use client"

import { useState, useTransition, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { EntityTable, type Column } from "./EntityTable"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { PropertyForm } from "./PropertyForm"
import { ClientForm } from "./ClientForm"
import { LeadForm } from "./LeadForm"
import { DealForm } from "./DealForm"
import { ShowingForm, type CalendarConflictInfo } from "./ShowingForm"
import {
  PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS,
  ACQUISITION_SOURCE_LABELS, CLIENT_SEGMENT_LABELS,
  LEAD_STATUS_LABELS, DEAL_STATUS_LABELS, SHOWING_STATUS_LABELS,
} from "@/lib/constants/labels"
import {
  listPropertiesAction, createPropertyAction, updatePropertyAction, deletePropertyAction,
  listClientsAction, createClientAction, updateClientAction, deleteClientAction,
  listLeadsAction, createLeadAction, updateLeadAction, deleteLeadAction,
  listDealsAction, createDealAction, updateDealAction, deleteDealAction,
  listShowingsAction, createShowingAction, updateShowingAction, deleteShowingAction,
  type ShowingActionResult,
  getFormOptionsAction,
  type FormOption,
} from "../actions"

const PAGE_SIZE = 20

// ─── Column definitions ───────────────────────────────────────────────────────

const PROPERTY_COLUMNS: Column[] = [
  { key: "id", label: "ID", sortable: true, type: "id" },
  { key: "address", label: "Adresa", sortable: true, className: "text-foreground/85 font-medium" },
  { key: "district", label: "Čtvrť", sortable: true },
  { key: "type", label: "Typ", type: "badge", labelMap: PROPERTY_TYPE_LABELS },
  { key: "price", label: "Cena", sortable: true, type: "currency" },
  { key: "areaM2", label: "Plocha", sortable: true, type: "number" },
  { key: "status", label: "Status", type: "badge", labelMap: PROPERTY_STATUS_LABELS },
  { key: "disposition", label: "Dispozice" },
]

const CLIENT_COLUMNS: Column[] = [
  { key: "id", label: "ID", sortable: true, type: "id" },
  { key: "name", label: "Jméno", sortable: true, className: "text-foreground/85 font-medium" },
  { key: "email", label: "Email", className: "font-mono text-muted-foreground/70" },
  { key: "phone", label: "Telefon" },
  { key: "acquisitionSource", label: "Zdroj", type: "badge", labelMap: ACQUISITION_SOURCE_LABELS },
  { key: "segment", label: "Segment", type: "badge", labelMap: CLIENT_SEGMENT_LABELS },
  { key: "createdAt", label: "Datum", sortable: true, type: "date" },
]

const LEAD_COLUMNS: Column[] = [
  { key: "id", label: "ID", sortable: true, type: "id" },
  { key: "name", label: "Jméno", sortable: true, className: "text-foreground/85 font-medium" },
  { key: "email", label: "Email", className: "font-mono text-muted-foreground/70" },
  { key: "source", label: "Zdroj", type: "badge", labelMap: ACQUISITION_SOURCE_LABELS },
  { key: "status", label: "Status", sortable: true, type: "badge", labelMap: LEAD_STATUS_LABELS },
  { key: "propertyInterest", label: "Zájem" },
  { key: "createdAt", label: "Datum", sortable: true, type: "date" },
]

const DEAL_COLUMNS: Column[] = [
  { key: "id", label: "ID", sortable: true, type: "id" },
  { key: "propertyAddress", label: "Nemovitost", className: "text-foreground/85 font-medium" },
  { key: "clientName", label: "Klient" },
  { key: "status", label: "Status", type: "badge", labelMap: DEAL_STATUS_LABELS },
  { key: "value", label: "Hodnota", sortable: true, type: "currency" },
  { key: "closedAt", label: "Uzavřeno", type: "date" },
  { key: "createdAt", label: "Vytvořeno", sortable: true, type: "date" },
]

const SHOWING_COLUMNS: Column[] = [
  { key: "id", label: "ID", sortable: true, type: "id" },
  { key: "propertyAddress", label: "Nemovitost", className: "text-foreground/85 font-medium" },
  { key: "clientName", label: "Klient" },
  { key: "scheduledAt", label: "Datum", sortable: true, type: "date" },
  { key: "status", label: "Status", type: "badge", labelMap: SHOWING_STATUS_LABELS },
  { key: "notes", label: "Poznámky" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityTab = "properties" | "clients" | "leads" | "deals" | "showings"

interface TabState {
  items: Record<string, unknown>[]
  total: number
  page: number
  sortBy: string
  sortOrder: "asc" | "desc"
  search: string
  loaded: boolean
}

function defaultState(sortBy: string): TabState {
  return { items: [], total: 0, page: 1, sortBy, sortOrder: "desc", search: "", loaded: false }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialProperties: { items: Record<string, unknown>[]; total: number }
}

export function SpravaClient({ initialProperties }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<EntityTab>("properties")
  const [error, setError] = useState<string | null>(null)

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null)

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<Record<string, unknown> | null>(null)

  // Calendar conflict state (showings only)
  const [calendarConflict, setCalendarConflict] = useState<CalendarConflictInfo | null>(null)

  // Form options (properties/clients lists for dropdowns)
  const [formOptions, setFormOptions] = useState<{ properties: FormOption[]; clients: FormOption[] } | null>(null)

  // Per-tab state
  const [tabStates, setTabStates] = useState<Record<EntityTab, TabState>>({
    properties: { ...defaultState("createdAt"), items: initialProperties.items, total: initialProperties.total, loaded: true },
    clients: defaultState("createdAt"),
    leads: defaultState("createdAt"),
    deals: defaultState("createdAt"),
    showings: defaultState("scheduledAt"),
  })

  const currentState = tabStates[activeTab]
  const totalPages = Math.ceil(currentState.total / PAGE_SIZE)

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const loadData = useCallback((tab: EntityTab, state: TabState) => {
    startTransition(async () => {
      setError(null)
      const filters = {
        limit: PAGE_SIZE,
        offset: (state.page - 1) * PAGE_SIZE,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder as "asc" | "desc",
        search: state.search || undefined,
      }

      let result: { items: Record<string, unknown>[]; total: number }

      switch (tab) {
        case "properties":
          result = await listPropertiesAction(filters)
          break
        case "clients":
          result = await listClientsAction(filters)
          break
        case "leads":
          result = await listLeadsAction(filters)
          break
        case "deals":
          result = await listDealsAction(filters)
          break
        case "showings":
          result = await listShowingsAction(filters)
          break
      }

      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...state, items: result.items, total: result.total, loaded: true },
      }))
    })
  }, [startTransition])

  function handleTabChange(tab: string) {
    const t = tab as EntityTab
    setActiveTab(t)
    if (!tabStates[t].loaded) {
      loadData(t, tabStates[t])
    }
  }

  function handleSort(key: string) {
    const state = tabStates[activeTab]
    const newOrder = state.sortBy === key && state.sortOrder === "asc" ? "desc" : "asc"
    const newState = { ...state, sortBy: key, sortOrder: newOrder as "asc" | "desc", page: 1 }
    setTabStates((prev) => ({ ...prev, [activeTab]: newState }))
    loadData(activeTab, newState)
  }

  function handlePageChange(page: number) {
    const newState = { ...tabStates[activeTab], page }
    setTabStates((prev) => ({ ...prev, [activeTab]: newState }))
    loadData(activeTab, newState)
  }

  function handleSearch(value: string) {
    const newState = { ...tabStates[activeTab], search: value, page: 1 }
    setTabStates((prev) => ({ ...prev, [activeTab]: newState }))
    // Debounce: load after a short delay
    loadData(activeTab, newState)
  }

  // ─── CRUD handlers ─────────────────────────────────────────────────────────

  async function loadFormOptions() {
    const needsOptions = activeTab === "properties" || activeTab === "deals" || activeTab === "showings"
    if (needsOptions) {
      const opts = await getFormOptionsAction()
      setFormOptions(opts)
    }
  }

  function handleEdit(row: Record<string, unknown>) {
    setEditingRecord(row)
    setFormOpen(true)
    loadFormOptions()
  }

  function handleDelete(row: Record<string, unknown>) {
    setDeletingRecord(row)
    setDeleteOpen(true)
  }

  function handleAddNew() {
    setEditingRecord(null)
    setCalendarConflict(null)
    setFormOpen(true)
    loadFormOptions()
  }

  async function handleFormSave(data: Record<string, unknown>) {
    setError(null)
    setCalendarConflict(null)
    const isEdit = !!editingRecord

    let result: { success: boolean; error?: string; calendarConflict?: CalendarConflictInfo }

    if (isEdit) {
      const id = editingRecord!.id as number
      switch (activeTab) {
        case "properties": result = await updatePropertyAction(id, data); break
        case "clients": result = await updateClientAction(id, data); break
        case "leads": result = await updateLeadAction(id, data); break
        case "deals": result = await updateDealAction(id, data); break
        case "showings": result = await updateShowingAction(id, data); break
      }
    } else {
      switch (activeTab) {
        case "properties": result = await createPropertyAction(data as Parameters<typeof createPropertyAction>[0]); break
        case "clients": result = await createClientAction(data as Parameters<typeof createClientAction>[0]); break
        case "leads": result = await createLeadAction(data as Parameters<typeof createLeadAction>[0]); break
        case "deals": result = await createDealAction(data as Parameters<typeof createDealAction>[0]); break
        case "showings": {
          const showingResult = await createShowingAction(data as Parameters<typeof createShowingAction>[0]) as ShowingActionResult
          if (!showingResult.success && showingResult.calendarConflict) {
            setCalendarConflict(showingResult.calendarConflict)
          }
          result = showingResult
          break
        }
      }
    }

    if (result!.success) {
      setFormOpen(false)
      setEditingRecord(null)
      setCalendarConflict(null)
      loadData(activeTab, tabStates[activeTab])
    } else if (!(result as { calendarConflict?: unknown }).calendarConflict) {
      // Show generic error only if it's not a calendar conflict (conflict is shown in the form)
      setError(result!.error ?? "Chyba při ukládání")
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingRecord) return
    setError(null)
    const id = deletingRecord.id as number

    let result: { success: boolean; error?: string }

    switch (activeTab) {
      case "properties": result = await deletePropertyAction(id); break
      case "clients": result = await deleteClientAction(id); break
      case "leads": result = await deleteLeadAction(id); break
      case "deals": result = await deleteDealAction(id); break
      case "showings": result = await deleteShowingAction(id); break
    }

    if (result!.success) {
      setDeleteOpen(false)
      setDeletingRecord(null)
      loadData(activeTab, tabStates[activeTab])
    } else {
      setDeleteOpen(false)
      setError(result!.error ?? "Chyba při mazání")
    }
  }

  // ─── Column map ─────────────────────────────────────────────────────────────

  const COLUMNS_MAP: Record<EntityTab, Column[]> = {
    properties: PROPERTY_COLUMNS,
    clients: CLIENT_COLUMNS,
    leads: LEAD_COLUMNS,
    deals: DEAL_COLUMNS,
    showings: SHOWING_COLUMNS,
  }

  const TAB_LABELS: Record<EntityTab, string> = {
    properties: "Nemovitosti",
    clients: "Klienti",
    leads: "Leady",
    deals: "Obchody",
    showings: "Prohlídky",
  }

  // ─── Form components map ────────────────────────────────────────────────────

  function renderForm() {
    const props = { open: formOpen, onOpenChange: setFormOpen, editingRecord, onSave: handleFormSave }
    switch (activeTab) {
      case "properties": return <PropertyForm {...props} clients={formOptions?.clients ?? []} />
      case "clients": return <ClientForm {...props} />
      case "leads": return <LeadForm {...props} />
      case "deals": return <DealForm {...props} properties={formOptions?.properties ?? []} clients={formOptions?.clients ?? []} />
      case "showings": return <ShowingForm {...props} properties={formOptions?.properties ?? []} clients={formOptions?.clients ?? []} calendarConflict={calendarConflict} onClearConflict={() => setCalendarConflict(null)} />
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400/60 hover:text-red-400">✕</button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="bg-secondary/50 border border-border/30 h-9">
            {Object.entries(TAB_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <Input
                placeholder="Hledat..."
                className="h-8 w-48 pl-8 text-xs"
                value={currentState.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={handleAddNew}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Přidat
            </Button>
          </div>
        </div>

        {Object.keys(TAB_LABELS).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isPending && !tabStates[tab as EntityTab].loaded ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground/40 text-sm">
                Načítám data...
              </div>
            ) : (
              <EntityTable
                columns={COLUMNS_MAP[tab as EntityTab]}
                data={tabStates[tab as EntityTab].items}
                sortBy={tabStates[tab as EntityTab].sortBy}
                sortOrder={tabStates[tab as EntityTab].sortOrder}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
                page={tabStates[tab as EntityTab].page}
                totalPages={Math.ceil(tabStates[tab as EntityTab].total / PAGE_SIZE)}
                totalCount={tabStates[tab as EntityTab].total}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {renderForm()}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        loading={isPending}
      />
    </div>
  )
}
