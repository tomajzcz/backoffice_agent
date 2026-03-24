import { google, calendar_v3 } from "googleapis"
import { getGoogleClient } from "./auth"

export interface FreeSlot {
  date: string       // YYYY-MM-DD
  dateLabel: string   // "pondělí 24. března"
  start: string       // "09:00"
  end: string         // "10:30"
  durationMinutes: number
}

export interface CalendarEvent {
  id: string
  summary: string
  description: string | null
  start: string          // ISO 8601
  end: string            // ISO 8601
  location: string | null
  status: string
  htmlLink: string
}

export interface CreateEventParams {
  summary: string
  description?: string
  startDateTime: string  // ISO 8601
  endDateTime?: string   // defaults to start + 60 min
  location?: string
}

export interface UpdateEventParams {
  summary?: string
  description?: string
  startDateTime?: string
  endDateTime?: string
  location?: string
}

const WORK_START = 9   // 9:00
const WORK_END = 18    // 18:00
const MIN_SLOT_MINUTES = 30

export async function getCalendarFreeSlots(
  dateRangeStart: string,
  dateRangeEnd: string,
): Promise<FreeSlot[]> {
  const calendar = getCalendarApi()

  const startDate = new Date(dateRangeStart)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(dateRangeEnd)
  endDate.setHours(23, 59, 59, 999)

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      timeZone: "Europe/Prague",
      items: [{ id: "primary" }],
    },
  })

  const busySlots = response.data.calendars?.primary?.busy ?? []

  // Generate free slots by inverting busy periods within working hours
  const freeSlots: FreeSlot[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current.setDate(current.getDate() + 1)
      continue
    }

    const dayStart = new Date(current)
    dayStart.setHours(WORK_START, 0, 0, 0)

    const dayEnd = new Date(current)
    dayEnd.setHours(WORK_END, 0, 0, 0)

    // Find busy intervals for this day
    const dayBusy = busySlots
      .map((b) => ({
        start: new Date(b.start!),
        end: new Date(b.end!),
      }))
      .filter((b) => b.start < dayEnd && b.end > dayStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Compute free intervals
    let cursor = dayStart.getTime()
    for (const busy of dayBusy) {
      const busyStart = Math.max(busy.start.getTime(), dayStart.getTime())
      const busyEnd = Math.min(busy.end.getTime(), dayEnd.getTime())

      if (cursor < busyStart) {
        const duration = Math.round((busyStart - cursor) / 60000)
        if (duration >= MIN_SLOT_MINUTES) {
          freeSlots.push(makeSlot(current, cursor, busyStart))
        }
      }
      cursor = Math.max(cursor, busyEnd)
    }

    // Remaining time after last busy slot
    if (cursor < dayEnd.getTime()) {
      const duration = Math.round((dayEnd.getTime() - cursor) / 60000)
      if (duration >= MIN_SLOT_MINUTES) {
        freeSlots.push(makeSlot(current, cursor, dayEnd.getTime()))
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return freeSlots
}

// ─── Calendar Event CRUD ────────────────────────────────────────────────────

function getCalendarApi() {
  const auth = getGoogleClient()
  if (!auth) {
    throw new Error("Google API není nakonfigurováno. Nastav GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_REFRESH_TOKEN v .env.local")
  }
  return google.calendar({ version: "v3", auth })
}

const TIMEZONE = "Europe/Prague"
const DEFAULT_DURATION_MS = 60 * 60 * 1000 // 60 min

export async function createCalendarEvent(params: CreateEventParams): Promise<CalendarEvent> {
  const calendar = getCalendarApi()

  const startDt = new Date(params.startDateTime)
  const endDt = params.endDateTime ? new Date(params.endDateTime) : new Date(startDt.getTime() + DEFAULT_DURATION_MS)

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: { dateTime: startDt.toISOString(), timeZone: TIMEZONE },
      end: { dateTime: endDt.toISOString(), timeZone: TIMEZONE },
    },
  })

  return mapEvent(event.data)
}

export async function updateCalendarEvent(eventId: string, params: UpdateEventParams): Promise<CalendarEvent> {
  const calendar = getCalendarApi()

  const requestBody: calendar_v3.Schema$Event = {}
  if (params.summary !== undefined) requestBody.summary = params.summary
  if (params.description !== undefined) requestBody.description = params.description
  if (params.location !== undefined) requestBody.location = params.location
  if (params.startDateTime !== undefined) {
    requestBody.start = { dateTime: new Date(params.startDateTime).toISOString(), timeZone: TIMEZONE }
  }
  if (params.endDateTime !== undefined) {
    requestBody.end = { dateTime: new Date(params.endDateTime).toISOString(), timeZone: TIMEZONE }
  }
  // If start changed but end not provided, default end to start + 60 min
  if (params.startDateTime && !params.endDateTime) {
    const newEnd = new Date(new Date(params.startDateTime).getTime() + DEFAULT_DURATION_MS)
    requestBody.end = { dateTime: newEnd.toISOString(), timeZone: TIMEZONE }
  }

  const event = await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody,
  })

  return mapEvent(event.data)
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = getCalendarApi()

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  })

  return true
}

export async function listCalendarEvents(
  timeMin: string,
  timeMax: string,
  maxResults: number = 50,
): Promise<CalendarEvent[]> {
  const calendar = getCalendarApi()

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date(timeMin).toISOString(),
    timeMax: new Date(timeMax).toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: TIMEZONE,
  })

  return (response.data.items ?? []).map(mapEvent)
}

export function buildShowingEventDescription(
  propertyAddress: string,
  clientName: string,
  notes?: string,
): string {
  let desc = `Prohlídka nemovitosti\n\nAdresa: ${propertyAddress}\nKlient: ${clientName}`
  if (notes) desc += `\nPoznámky: ${notes}`
  return desc
}

function mapEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: event.id ?? "",
    summary: event.summary ?? "",
    description: event.description ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    location: event.location ?? null,
    status: event.status ?? "confirmed",
    htmlLink: event.htmlLink ?? "",
  }
}

// ─── Free slots helper ──────────────────────────────────────────────────────

function makeSlot(day: Date, startMs: number, endMs: number): FreeSlot {
  const dateStr = day.toISOString().slice(0, 10)
  const dateLabel = day.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const startDate = new Date(startMs)
  const endDate = new Date(endMs)

  return {
    date: dateStr,
    dateLabel,
    start: `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`,
    end: `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`,
    durationMinutes: Math.round((endMs - startMs) / 60000),
  }
}
