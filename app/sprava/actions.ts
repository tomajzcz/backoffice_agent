"use server"

import { revalidatePath } from "next/cache"
import { listPropertiesQuery, createPropertyQuery, updatePropertyQuery, deletePropertyQuery } from "@/lib/db/queries/properties"
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
import { prisma } from "@/lib/db/prisma"

export type FormOption = { id: number; label: string }

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string }

export type ShowingActionResult =
  | { success: true; data: { id: number } }
  | { success: false; error: string; calendarConflict?: {
      conflictingEvents: Array<{ summary: string; start: string; end: string }>
      suggestedSlots: Array<{ date: string; dateLabel: string; start: string; end: string }>
    }}

function handleError(e: unknown): { success: false; error: string } {
  const msg = e instanceof Error ? e.message : "Neznámá chyba"
  if (msg.includes("P2003") || msg.includes("foreign key")) {
    return { success: false, error: "Nelze smazat — záznam má vazby na jiná data." }
  }
  if (msg.includes("P2002") || msg.includes("Unique constraint")) {
    return { success: false, error: "Záznam s tímto emailem již existuje." }
  }
  return { success: false, error: msg }
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

export async function createPropertyAction(data: {
  address: string; district: string; type: string; price: number; areaM2: number
  status?: string; disposition?: string; yearBuilt?: number
  lastRenovationYear?: number; renovationNotes?: string; ownerId?: number
}): Promise<ActionResult> {
  try {
    const property = await createPropertyQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: property.id } }
  } catch (e) { return handleError(e) }
}

export async function updatePropertyAction(id: number, data: {
  address?: string; district?: string; type?: string; price?: number; areaM2?: number
  status?: string; disposition?: string; yearBuilt?: number
  lastRenovationYear?: number; renovationNotes?: string; ownerId?: number
}): Promise<ActionResult> {
  try {
    await updatePropertyQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deletePropertyAction(id: number): Promise<ActionResult> {
  try {
    await deletePropertyQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createClientAction(data: {
  name: string; email: string; phone?: string; acquisitionSource: string; segment: string
}): Promise<ActionResult> {
  try {
    const client = await createClientQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: client.id } }
  } catch (e) { return handleError(e) }
}

export async function updateClientAction(id: number, data: {
  name?: string; email?: string; phone?: string; acquisitionSource?: string; segment?: string
}): Promise<ActionResult> {
  try {
    await updateClientQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteClientAction(id: number): Promise<ActionResult> {
  try {
    await deleteClientQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createLeadAction(data: {
  name: string; email: string; phone?: string; source: string; propertyInterest?: string; status?: string
}): Promise<ActionResult> {
  try {
    const lead = await createLeadQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: lead.id } }
  } catch (e) { return handleError(e) }
}

export async function updateLeadAction(id: number, data: {
  name?: string; email?: string; phone?: string; source?: string; status?: string; propertyInterest?: string
}): Promise<ActionResult> {
  try {
    await updateLeadQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteLeadAction(id: number): Promise<ActionResult> {
  try {
    await deleteLeadQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createDealAction(data: {
  propertyId: number; clientId: number; value: number; status?: string
}): Promise<ActionResult> {
  try {
    const deal = await createDealQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: deal.id } }
  } catch (e) { return handleError(e) }
}

export async function updateDealAction(id: number, data: {
  status?: string; value?: number
}): Promise<ActionResult> {
  try {
    await updateDealQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteDealAction(id: number): Promise<ActionResult> {
  try {
    await deleteDealQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createShowingAction(data: {
  propertyId: number; clientId: number; scheduledAt: string; notes?: string
}): Promise<ShowingActionResult> {
  try {
    const startDt = new Date(data.scheduledAt)
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
    const showing = await createShowingQuery(data)

    // Vytvořit event v Google Calendar (best-effort)
    try {
      const description = buildShowingEventDescription(
        showing.property.address,
        showing.client.name,
        data.notes
      )
      const event = await createCalendarEvent({
        summary: `Prohlídka: ${showing.property.address} – ${showing.client.name}`,
        startDateTime: data.scheduledAt,
        description,
        location: showing.property.address,
      })
      await updateShowingQuery(showing.id, { googleCalendarEventId: event.id })
    } catch {
      // Kalendářový event se nepodařilo vytvořit — prohlídka je uložena
    }

    revalidatePath("/sprava")
    return { success: true, data: { id: showing.id } }
  } catch (e) { return handleError(e) }
}

export async function updateShowingAction(id: number, data: {
  status?: string; scheduledAt?: string; notes?: string
}): Promise<ActionResult> {
  try {
    await updateShowingQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteShowingAction(id: number): Promise<ActionResult> {
  try {
    // Načíst prohlídku a smazat kalendářový event, pokud existuje
    const showing = await getShowingByIdQuery(id)
    if (showing?.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(showing.googleCalendarEventId)
      } catch {
        // Kalendářový event se nepodařilo smazat — pokračovat
      }
    }

    await deleteShowingQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createTaskAction(data: {
  title: string; description?: string; priority: string; status?: string
  dueDate?: string; assignee?: string; propertyId?: number; dealId?: number
}): Promise<ActionResult> {
  try {
    const task = await createTask({
      title: data.title,
      description: data.description,
      priority: data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assignee: data.assignee,
      propertyId: data.propertyId,
      dealId: data.dealId,
    })
    revalidatePath("/sprava")
    return { success: true, data: { id: task.id } }
  } catch (e) { return handleError(e) }
}

export async function updateTaskAction(id: number, data: {
  title?: string; description?: string; status?: string; priority?: string
  dueDate?: string | null; assignee?: string | null; propertyId?: number; dealId?: number
}): Promise<ActionResult> {
  try {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.assignee !== undefined) updateData.assignee = data.assignee

    await updateTaskQuery(id, updateData)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteTaskAction(id: number): Promise<ActionResult> {
  try {
    await deleteTaskQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createInvestorAction(data: {
  name: string; email: string; phone?: string; company?: string; notes?: string
}): Promise<ActionResult> {
  try {
    const inv = await createInvestorQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: inv.id } }
  } catch (e) { return handleError(e) }
}

export async function updateInvestorAction(id: number, data: {
  name?: string; email?: string; phone?: string; company?: string; notes?: string
}): Promise<ActionResult> {
  try {
    await updateInvestorQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteInvestorAction(id: number): Promise<ActionResult> {
  try {
    await deleteInvestorQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
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

export async function createDocumentAction(data: {
  propertyId: number; type: string; name: string; url?: string; notes?: string
}): Promise<ActionResult> {
  try {
    const doc = await createDocumentQuery(data)
    revalidatePath("/sprava")
    return { success: true, data: { id: doc.id } }
  } catch (e) { return handleError(e) }
}

export async function updateDocumentAction(id: number, data: {
  propertyId?: number; type?: string; name?: string; url?: string; notes?: string
}): Promise<ActionResult> {
  try {
    await updateDocumentQuery(id, data)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}

export async function deleteDocumentAction(id: number): Promise<ActionResult> {
  try {
    await deleteDocumentQuery(id)
    revalidatePath("/sprava")
    return { success: true, data: { id } }
  } catch (e) { return handleError(e) }
}
