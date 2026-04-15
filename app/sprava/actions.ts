"use server"

import { revalidatePath } from "next/cache"
import { listPropertiesQuery, createPropertyQuery, updatePropertyQuery, deletePropertyQuery } from "@/lib/db/queries/properties"
import { listRenovationsQuery, createRenovationQuery, updateRenovationQuery, deleteRenovationQuery, getRenovationByIdQuery } from "@/lib/db/queries/renovations"
import { listClientsQuery, createClientQuery, updateClientQuery, deleteClientQuery } from "@/lib/db/queries/clients"
import { listLeadsQuery, createLeadQuery, updateLeadQuery, deleteLeadQuery } from "@/lib/db/queries/leads"
import { listDealsQuery, createDealQuery, updateDealQuery, deleteDealQuery } from "@/lib/db/queries/deals"
import { listShowingsQuery, createShowingQuery, updateShowingQuery, deleteShowingQuery, getShowingByIdQuery } from "@/lib/db/queries/showings"
import { listTasksQuery, createTask, updateTaskQuery, deleteTaskQuery } from "@/lib/db/queries/tasks"
import { listInvestorsQuery, createInvestorQuery, updateInvestorQuery, deleteInvestorQuery } from "@/lib/db/queries/investors"
import { listDocumentsQuery, createDocumentQuery, updateDocumentQuery, deleteDocumentQuery } from "@/lib/db/queries/documents"
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarFreeSlots,
  buildShowingEventDescription,
} from "@/lib/google/calendar"
import { sendShowingConfirmationSms, sendShowingCancellationSms } from "@/lib/integrations/twilio"
import { prisma } from "@/lib/db/prisma"
import {
  Id,
  parseOrError,
  CreatePropertySchema, UpdatePropertySchema,
  CreateClientSchema, UpdateClientSchema,
  CreateLeadSchema, UpdateLeadSchema,
  CreateDealSchema, UpdateDealSchema,
  CreateShowingSchema, UpdateShowingSchema,
  CreateInvestorSchema, UpdateInvestorSchema,
  CreateDocumentSchema, UpdateDocumentSchema,
  CreateTaskSchema, UpdateTaskSchema,
  CreateRenovationSchema, UpdateRenovationSchema,
} from "@/lib/schemas/entities"

function validateId(id: unknown): { ok: true; id: number } | { ok: false; error: string } {
  const parsed = Id.safeParse(id)
  if (!parsed.success) return { ok: false, error: "Neplatné ID" }
  return { ok: true, id: parsed.data }
}

export type FormOption = { id: number; label: string }

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string }

export type ShowingActionResult =
  | { success: true; data: { id: number } }
  | { success: false; error: string; calendarConflict?: {
      conflictingEvents: Array<{ summary: string; start: string; end: string }>
      suggestedSlots: Array<{ date: string; dateLabel: string; start: string; end: string }>
    }}

function handleError(e: unknown): { success: false; error: string } {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes("P2003") || msg.includes("foreign key")) {
    return { success: false, error: "Nelze smazat — záznam má vazby na jiná data." }
  }
  if (msg.includes("P2002") || msg.includes("Unique constraint")) {
    return { success: false, error: "Záznam s těmito údaji již existuje." }
  }
  console.error("[sprava/actions] error:", e)
  return { success: false, error: "Akci se nepodařilo dokončit." }
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function listPropertiesAction(filters: {
  district?: string; type?: string; status?: string
  priceMin?: number; priceMax?: number; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listPropertiesQuery(filters)
  return {
    items: items.map((p) => ({
      id: p.id, address: p.address, district: p.district, type: p.type,
      price: Number(p.price), status: p.status, lifecycleStage: p.lifecycleStage,
      areaM2: Number(p.areaM2),
      disposition: p.disposition, yearBuilt: p.yearBuilt,
      lastRenovationYear: p.lastRenovationYear, renovationNotes: p.renovationNotes,
      ownerId: p.ownerId, ownerName: p.owner?.name ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
  }
}

export async function createPropertyAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreatePropertySchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const property = await createPropertyQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: property.id } }
  } catch (e) { return handleError(e) }
}

export async function updatePropertyAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdatePropertySchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updatePropertyQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deletePropertyAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deletePropertyQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function listClientsAction(filters: {
  segment?: string; acquisitionSource?: string; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listClientsQuery(filters)
  return {
    items: items.map((c) => ({
      id: c.id, name: c.name, email: c.email, phone: c.phone,
      acquisitionSource: c.acquisitionSource, segment: c.segment,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
  }
}

export async function createClientAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateClientSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const client = await createClientQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: client.id } }
  } catch (e) { return handleError(e) }
}

export async function updateClientAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateClientSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updateClientQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteClientAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteClientQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function listLeadsAction(filters: {
  source?: string; status?: string; dateFrom?: string; dateTo?: string; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listLeadsQuery(filters)
  return {
    items: items.map((l) => ({
      id: l.id, name: l.name, email: l.email, phone: l.phone,
      source: l.source, status: l.status, propertyInterest: l.propertyInterest,
      createdAt: l.createdAt.toISOString(), convertedAt: l.convertedAt?.toISOString() ?? null,
    })),
    total,
  }
}

export async function createLeadAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateLeadSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const lead = await createLeadQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: lead.id } }
  } catch (e) { return handleError(e) }
}

export async function updateLeadAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateLeadSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updateLeadQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteLeadAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteLeadQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export async function listDealsAction(filters: {
  status?: string; valueMin?: number; valueMax?: number
  dateFrom?: string; dateTo?: string; clientId?: number; propertyId?: number
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listDealsQuery(filters)
  return {
    items: items.map((d) => ({
      id: d.id, propertyId: d.propertyId, clientId: d.clientId,
      propertyAddress: d.property.address, propertyDistrict: d.property.district,
      clientName: d.client.name,
      status: d.status, value: Number(d.value),
      closedAt: d.closedAt?.toISOString() ?? null, createdAt: d.createdAt.toISOString(),
    })),
    total,
  }
}

export async function createDealAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateDealSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const deal = await createDealQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: deal.id } }
  } catch (e) { return handleError(e) }
}

export async function updateDealAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateDealSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updateDealQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteDealAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteDealQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Showings ─────────────────────────────────────────────────────────────────

export async function listShowingsAction(filters: {
  status?: string; dateFrom?: string; dateTo?: string; propertyId?: number; clientId?: number
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listShowingsQuery(filters)
  return {
    items: items.map((s) => ({
      id: s.id, propertyId: s.propertyId, clientId: s.clientId,
      propertyAddress: s.property.address, propertyDistrict: s.property.district,
      clientName: s.client.name,
      scheduledAt: s.scheduledAt.toISOString(), status: s.status, notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    })),
    total,
  }
}

export async function createShowingAction(data: unknown): Promise<ShowingActionResult> {
  const v = parseOrError(CreateShowingSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  const parsed = v.data
  try {
    const startDt = new Date(parsed.scheduledAt)
    const endDt = new Date(startDt.getTime() + 60 * 60 * 1000) // 1h okno

    // Kontrola konfliktů v Google Calendar
    try {
      const existingEvents = await listCalendarEvents(
        startDt.toISOString(),
        endDt.toISOString()
      )

      if (existingEvents.length > 0) {
        // Najít volné sloty pro ten samý den + následující den
        const dayStr = startDt.toISOString().slice(0, 10)
        const nextDay = new Date(startDt)
        nextDay.setDate(nextDay.getDate() + 2)
        const nextDayStr = nextDay.toISOString().slice(0, 10)

        let suggestedSlots: Array<{ date: string; dateLabel: string; start: string; end: string }> = []
        try {
          suggestedSlots = (await getCalendarFreeSlots(dayStr, nextDayStr)).slice(0, 5)
        } catch { /* ignore */ }

        return {
          success: false,
          error: `Časový konflikt v kalendáři`,
          calendarConflict: {
            conflictingEvents: existingEvents.map(e => ({
              summary: e.summary,
              start: e.start,
              end: e.end,
            })),
            suggestedSlots,
          }
        }
      }
    } catch {
      // Google API není nakonfigurováno — pokračovat bez kontroly
    }

    // Vytvořit prohlídku v DB
    const showing = await createShowingQuery(parsed)

    // Vytvořit event v Google Calendar (best-effort)
    try {
      const description = buildShowingEventDescription(
        showing.property.address,
        showing.client.name,
        parsed.notes
      )
      const event = await createCalendarEvent({
        summary: `Prohlídka: ${showing.property.address} – ${showing.client.name}`,
        startDateTime: parsed.scheduledAt,
        description,
        location: showing.property.address,
      })
      await updateShowingQuery(showing.id, { googleCalendarEventId: event.id })
    } catch {
      // Kalendářový event se nepodařilo vytvořit — prohlídka je uložena
    }

    // Odeslat potvrzovací SMS (best-effort)
    try {
      if (showing.client.phone) {
        await sendShowingConfirmationSms({
          clientName: showing.client.name,
          clientPhone: showing.client.phone,
          propertyAddress: showing.property.address,
          scheduledAt: parsed.scheduledAt,
        })
      }
    } catch {
      // SMS se nepodařilo odeslat — prohlídka je uložena
    }

    revalidatePath("/sprava")
    return { success: true, data: { id: showing.id } }
  } catch (e) { return handleError(e) }
}

export async function updateShowingAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateShowingSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  let parsed: Record<string, unknown> = { ...v.data }
  try {
    // Při zrušení: smazat kalendář + poslat SMS
    if (parsed.status === "CANCELLED") {
      const showing = await getShowingByIdQuery(idv.id)
      if (showing) {
        // Smazat kalendářovou událost (best-effort)
        if (showing.googleCalendarEventId) {
          try {
            await deleteCalendarEvent(showing.googleCalendarEventId)
          } catch {
            // Kalendářový event se nepodařilo smazat — pokračovat
          }
          parsed = { ...parsed, googleCalendarEventId: null }
        }
        // Poslat SMS o zrušení (best-effort)
        try {
          if (showing.client.phone) {
            await sendShowingCancellationSms({
              clientName: showing.client.name,
              clientPhone: showing.client.phone,
              propertyAddress: showing.property.address,
              scheduledAt: showing.scheduledAt.toISOString(),
            })
          }
        } catch {
          // SMS se nepodařilo odeslat — pokračovat
        }
      }
    }

    await updateShowingQuery(idv.id, parsed)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteShowingAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    // Načíst prohlídku a smazat kalendářový event, pokud existuje
    const showing = await getShowingByIdQuery(idv.id)
    if (showing) {
      if (showing.googleCalendarEventId) {
        try {
          await deleteCalendarEvent(showing.googleCalendarEventId)
        } catch {
          // Kalendářový event se nepodařilo smazat — pokračovat
        }
      }

      // Poslat SMS o zrušení (best-effort)
      try {
        if (showing.client.phone) {
          await sendShowingCancellationSms({
            clientName: showing.client.name,
            clientPhone: showing.client.phone,
            propertyAddress: showing.property.address,
            scheduledAt: showing.scheduledAt.toISOString(),
          })
        }
      } catch {
        // SMS se nepodařilo odeslat — pokračovat
      }
    }

    await deleteShowingQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Form Options ─────────────────────────────────────────────────────────────

export async function getFormOptionsAction(): Promise<{
  properties: FormOption[]
  clients: FormOption[]
  deals: FormOption[]
}> {
  const [properties, clients, deals] = await Promise.all([
    prisma.property.findMany({ select: { id: true, address: true, district: true }, orderBy: { address: "asc" } }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.deal.findMany({
      where: { status: "IN_PROGRESS" },
      select: { id: true, property: { select: { address: true } }, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return {
    properties: properties.map(p => ({ id: p.id, label: `${p.address} (${p.district})` })),
    clients: clients.map(c => ({ id: c.id, label: c.name })),
    deals: deals.map(d => ({ id: d.id, label: `#${d.id} ${d.property.address} — ${d.client.name}` })),
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function listTasksAction(filters: {
  status?: string; priority?: string; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listTasksQuery(filters)
  return {
    items: items.map((t) => ({
      id: t.id, title: t.title, description: t.description,
      status: t.status, priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignee: t.assignee,
      propertyId: t.propertyId,
      propertyAddress: t.property?.address ?? null,
      dealId: t.dealId,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
  }
}

export async function createTaskAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateTaskSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  const p = v.data
  try {
    const task = await createTask({
      title: p.title,
      description: p.description,
      priority: p.priority,
      dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
      assignee: p.assignee,
      propertyId: p.propertyId,
      dealId: p.dealId,
      renovationId: p.renovationId,
    })
    revalidatePath("/sprava")
    return { success: true, data: { id: task.id } }
  } catch (e) { return handleError(e) }
}

export async function updateTaskAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateTaskSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  const p = v.data
  try {
    const updateData: Record<string, unknown> = {}
    if (p.title !== undefined) updateData.title = p.title
    if (p.description !== undefined) updateData.description = p.description
    if (p.status !== undefined) updateData.status = p.status
    if (p.priority !== undefined) updateData.priority = p.priority
    if (p.dueDate !== undefined) updateData.dueDate = p.dueDate ? new Date(p.dueDate) : null
    if (p.assignee !== undefined) updateData.assignee = p.assignee

    await updateTaskQuery(idv.id, updateData)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteTaskAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteTaskQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Investors ───────────────────────────────────────────────────────────────

export async function listInvestorsAction(filters: {
  search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listInvestorsQuery(filters)
  return {
    items: items.map((inv) => {
      const totalInvested = inv.properties.reduce(
        (s, ip) => s + (ip.investedAmount ? Number(ip.investedAmount) : 0), 0,
      )
      const portfolioValue = inv.properties.reduce(
        (s, ip) => s + Number(ip.property.price), 0,
      )
      return {
        id: inv.id, name: inv.name, email: inv.email, phone: inv.phone,
        company: inv.company, notes: inv.notes,
        propertyCount: inv.properties.length,
        totalInvested, portfolioValue,
        createdAt: inv.createdAt.toISOString(),
      }
    }),
    total,
  }
}

export async function createInvestorAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateInvestorSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const inv = await createInvestorQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: inv.id } }
  } catch (e) { return handleError(e) }
}

export async function updateInvestorAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateInvestorSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updateInvestorQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteInvestorAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteInvestorQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function listDocumentsAction(filters: {
  propertyId?: number; type?: string; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listDocumentsQuery(filters)
  return {
    items: items.map((d) => ({
      id: d.id, propertyId: d.propertyId,
      propertyAddress: d.property.address,
      type: d.type, name: d.name, url: d.url, notes: d.notes,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    total,
  }
}

export async function createDocumentAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateDocumentSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    const doc = await createDocumentQuery(v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: doc.id } }
  } catch (e) { return handleError(e) }
}

export async function updateDocumentAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateDocumentSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  try {
    await updateDocumentQuery(idv.id, v.data)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteDocumentAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteDocumentQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

// ─── Renovations ─────────────────────────────────────────────────────────────

export async function listRenovationsAction(filters: {
  status?: string; phase?: string; isDelayed?: boolean; search?: string
  limit: number; offset: number; sortBy: string; sortOrder: "asc" | "desc"
}) {
  const { items, total } = await listRenovationsQuery(filters)
  return { items: items as Record<string, unknown>[], total }
}

export async function createRenovationAction(data: unknown): Promise<ActionResult> {
  const v = parseOrError(CreateRenovationSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  const p = v.data
  try {
    const renovation = await createRenovationQuery({
      ...p,
      plannedEndAt: p.plannedEndAt ? new Date(p.plannedEndAt) : undefined,
    })
    revalidatePath("/sprava")
    return { success: true, data: { id: renovation.id } }
  } catch (e) { return handleError(e) }
}

export async function updateRenovationAction(id: number, data: unknown): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  const v = parseOrError(UpdateRenovationSchema, data)
  if (!v.ok) return { success: false, error: v.error }
  const p = v.data
  try {
    await updateRenovationQuery(idv.id, {
      ...p,
      plannedEndAt: p.plannedEndAt !== undefined
        ? (p.plannedEndAt ? new Date(p.plannedEndAt) : null)
        : undefined,
    })
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function deleteRenovationAction(id: number): Promise<ActionResult> {
  const idv = validateId(id); if (!idv.ok) return { success: false, error: idv.error }
  try {
    await deleteRenovationQuery(idv.id)
    revalidatePath("/sprava")
    return { success: true, data: { id: idv.id } }
  } catch (e) { return handleError(e) }
}

export async function getRenovationDetailAction(id: number) {
  const idv = validateId(id); if (!idv.ok) return null
  const r = await getRenovationByIdQuery(idv.id)
  if (!r) return null

  const now = new Date()
  return {
    id: r.id,
    propertyId: r.propertyId,
    propertyAddress: r.property.address,
    propertyDistrict: r.property.district,
    propertyType: r.property.type,
    propertyDisposition: r.property.disposition,
    phase: r.phase,
    status: r.status,
    startedAt: r.startedAt.toISOString(),
    plannedEndAt: r.plannedEndAt?.toISOString() ?? null,
    actualEndAt: r.actualEndAt?.toISOString() ?? null,
    isDelayed: r.isDelayed,
    nextStep: r.nextStep,
    blockers: r.blockers,
    ownerName: r.ownerName,
    contractorName: r.contractorName,
    budgetPlanned: r.budgetPlanned ? Number(r.budgetPlanned) : null,
    budgetActual: r.budgetActual ? Number(r.budgetActual) : null,
    notes: r.notes,
    tasks: r.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignee: t.assignee,
      isOverdue: (t.status === "OPEN" || t.status === "IN_PROGRESS") && !!t.dueDate && t.dueDate < now,
    })),
  }
}
