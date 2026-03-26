# Integrations

External services and automation systems connected to the Back Office Agent.

---

## 1. Google Calendar

**Files**: `lib/google/auth.ts`, `lib/google/calendar.ts`

### OAuth2 Setup

The Google OAuth2 client is created as a global singleton to avoid re-initialization on every request. The client is cached on `globalThis` in development; in production, a fresh instance is created per cold start.

```typescript
// lib/google/auth.ts
const globalForGoogle = globalThis as unknown as {
  googleAuth: InstanceType<typeof google.auth.OAuth2> | null
}

export function getGoogleClient(): InstanceType<typeof google.auth.OAuth2> | null {
  // Returns null when credentials are missing (graceful degradation)
  if (!clientId || !clientSecret || !refreshToken) return null

  if (globalForGoogle.googleAuth) return globalForGoogle.googleAuth

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })

  if (process.env.NODE_ENV !== "production") {
    globalForGoogle.googleAuth = oauth2
  }
  return oauth2
}
```

**Required environment variables**:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

When any of these are missing, `getGoogleClient()` returns `null` and calendar/Gmail functions throw a descriptive error. The application continues to function without Google features.

### Functions

| Function | Description |
|----------|-------------|
| `getCalendarFreeSlots(dateRangeStart, dateRangeEnd)` | Queries the freebusy API on the primary calendar, inverts busy intervals within business hours, and returns available `FreeSlot[]` |
| `createCalendarEvent(params)` | Inserts an event on the primary calendar. Default duration: 60 minutes if `endDateTime` is omitted |
| `updateCalendarEvent(eventId, params)` | Patches an existing event. If `startDateTime` changes but `endDateTime` is not provided, end is set to start + 60 min |
| `deleteCalendarEvent(eventId)` | Deletes an event from the primary calendar |
| `listCalendarEvents(timeMin, timeMax, maxResults?)` | Lists single events ordered by start time. Default `maxResults`: 50 |

### Business Hours and Slot Rules

- **Working hours**: 09:00 - 18:00 (constants `WORK_START = 9`, `WORK_END = 18`)
- **Working days**: Monday through Friday (Saturday/Sunday skipped)
- **Timezone**: `Europe/Prague` (used for all event creation, listing, and freebusy queries)
- **Minimum slot duration**: 30 minutes (`MIN_SLOT_MINUTES = 30`)
- **Default event duration**: 60 minutes (`DEFAULT_DURATION_MS`)

Free slot labels are formatted in Czech locale (`cs-CZ`) with weekday, day, and month (e.g., "pondeli 24. brezna").

### Calendar <-> Showing Sync

When a showing is created via the `createShowing` tool (with `createCalendarEvent: true`, the default):

1. The showing record is created in the database
2. A calendar event is created with summary `"Prohlidka: {address} -- {clientName}"`, the property address as location, and a structured Czech description
3. The returned `googleCalendarEventId` is stored on the `Showing` record

When a showing is updated via `updateShowing`:
- **Rescheduled**: The linked calendar event's `startDateTime` is patched
- **Cancelled**: The linked calendar event is deleted, and `googleCalendarEventId` is set to `null`
- **Calendar sync failure**: Logged but does not block the database update

The helper `buildShowingEventDescription()` generates the event description:
```
Prohlidka nemovitosti
Adresa: {propertyAddress}
Klient: {clientName}
Poznamky: {notes}  // optional
```

---

## 2. Gmail

**Files**: `lib/google/gmail.ts`, `app/api/email/approve/route.ts`

### Safety Model: Draft-Only

The agent never sends emails directly to external recipients. The full workflow:

1. Agent tool `createGmailDraft` generates email content (subject, HTML body, recipient)
2. Frontend renders the draft in the Email tab for user review
3. User clicks "Approve" which calls `POST /api/email/approve`
4. The approve endpoint calls `saveDraft()` which creates a Gmail draft via the API
5. The user opens Gmail and sends the draft manually

This human-in-the-loop design prevents the AI from sending external communications autonomously.

### `saveDraft(to, subject, htmlBody)` -> `DraftResult`

Creates a Gmail draft using the `gmail.users.drafts.create` API. Returns `{ draftId, messageId }`.

MIME construction:
```
To: {recipient}
Subject: =?UTF-8?B?{base64-encoded-subject}?=
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: base64

{base64-encoded-html-body}
```

The subject line uses RFC 2047 `=?UTF-8?B?...?=` encoding to handle Czech diacritics (e.g., "Tydeni executive report").

### `sendEmailWithAttachment(to, subject, htmlBody, attachment)` -> `{ messageId }`

Used by the executive report automation (not by the agent directly). Sends an email with a PPTX attachment using `gmail.users.messages.send`. Constructs a `multipart/mixed` MIME message with a random boundary:

```
Content-Type: multipart/mixed; boundary="{boundary}"

--{boundary}
Content-Type: text/html; charset=utf-8
{html body}

--{boundary}
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="{filename}"
{base64 attachment}
--{boundary}--
```

The raw message is URL-safe Base64 encoded (`+` -> `-`, `/` -> `_`, trailing `=` stripped) per Gmail API requirements.

### Email Approval Endpoint

`POST /api/email/approve` validates the request body with Zod:

```typescript
const approveSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
})
```

On success, calls `saveDraft()` and returns `{ draftId, savedAt }`.

---

## 3. Twilio SMS

**File**: `lib/integrations/twilio.ts`

### Overview

SMS notifications for showing confirmations and cancellations. Uses the Twilio REST API directly via `fetch` -- no Twilio SDK dependency.

**Required environment variables**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (E.164 format, e.g., `+420...`)

### Functions

**`sendShowingConfirmationSms(params)`** -- Sends a confirmation when a showing is created:
```
Dobry den, {clientName}. Vase prohlidka nemovitosti na adrese {propertyAddress}
je naplanovana na {dateFormatted}. Tesime se na Vas!
```

**`sendShowingCancellationSms(params)`** -- Sends a cancellation notice:
```
Dobry den, {clientName}. Vase prohlidka nemovitosti na adrese {propertyAddress}
planovana na {dateFormatted} byla zrusena. Omlouvame se za komplikace.
V pripade dotazu nas nevahejte kontaktovat.
```

Both format dates using `cs-CZ` locale with `Europe/Prague` timezone.

**`sendSms(params)`** -- Low-level function that calls the Twilio REST API:

```typescript
const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ To: params.to, From: fromNumber, Body: params.body }),
})
```

Returns `{ messageSid, status }` (status is typically `"queued"`).

### Integration Points

- **`createShowing` tool**: Sends confirmation SMS by default (`sendSmsConfirmation: true`). If the client has no phone number, sets `smsError: "Klient nema telefonni cislo"`. API failures are captured in the result's `smsError` field and do not block showing creation.
- **`updateShowing` tool**: Sends cancellation SMS when status changes to `CANCELLED` and the client has a phone number. Failures are logged but do not block the update.

### Error Handling

All SMS failures are non-blocking. The pattern across both tools:

```typescript
try {
  await sendShowingConfirmationSms({ ... })
  smsSent = true
} catch (e) {
  smsError = e instanceof Error ? e.message : "Unknown error"
  // Primary operation (DB write) already succeeded
}
```

---

## 4. ElevenLabs Voice Calls

**Files**: `lib/integrations/elevenlabs.ts`, `app/api/cron/daily-reminder-calls/route.ts`

### Overview

Automated outbound AI voice calls for showing reminders. Calls are initiated via the ElevenLabs Conversational AI API, which uses Twilio as the telephony carrier.

**Required environment variables**:
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_PHONE_NUMBER_ID`

### `initiateOutboundCall(params)` -> `OutboundCallResult`

```typescript
interface OutboundCallParams {
  phoneNumber: string                        // E.164 format
  agentId: string
  dynamicVariables?: Record<string, string>  // Injected into the agent's conversation
}
```

Makes a `POST` to `https://api.elevenlabs.io/v1/convai/twilio/outbound-call` with:
- `agent_id` and `agent_phone_number_id` for routing
- `to_number` as the destination
- `conversation_initiation_client_data.dynamic_variables` for context injection

Authentication uses the `xi-api-key` header.

Returns `{ callId, status }` where status is typically `"initiated"`.

### Daily Reminder Cron

**Endpoint**: `GET /api/cron/daily-reminder-calls`
**Schedule**: `0 5 * * *` (5 AM daily, every day including weekends)
**Max duration**: 60 seconds

The cron handler follows this sequence:

1. **Fetch showings**: Queries all showings scheduled for today with status `SCHEDULED`
2. **Idempotency check**: Loads existing `CallLog` records for today's showing IDs. Showings already processed are skipped.
3. **Phone validation**: Normalizes phone numbers to E.164 via `normalizePhoneE164()`. Showings with invalid or missing phones get a `NO_PHONE` log entry.
4. **Create PENDING log**: Before calling the API, a `CallLog` with status `PENDING` is created (crash-safe audit trail). Unique constraint on `[showingId, callDate]` prevents duplicates.
5. **Initiate call**: Calls `initiateOutboundCall()` with dynamic variables:
   - `customer_name`, `customer_email`, `customer_phone`
   - `property_address`, `showing_time`, `showing_date`
   - `system_time` (current ISO timestamp)
6. **Update log**: Status moves to `INITIATED` (with `elevenLabsCallId`) or `FAILED` (with error message).

### CallLog Status Flow

```
PENDING -> INITIATED  (API call succeeded)
PENDING -> FAILED     (API call threw)
        -> NO_PHONE   (client has no valid phone number)
        -> SKIPPED    (already processed today / duplicate constraint)
```

The `CallLog` model has a unique constraint on `[showingId, callDate]` ensuring each showing gets at most one call attempt per day.

### Trigger

Voice calls are triggered exclusively by the daily cron job -- they are **not** triggered by agent tools. The agent has no direct access to the ElevenLabs integration.

---

## 5. Web Scrapers

**Files**: `lib/scraper/index.ts`, `lib/scraper/sreality.ts`, `lib/scraper/bezrealitky.ts`, `lib/scraper/types.ts`, `lib/scraper/dedup.ts`, `lib/scraper/localities.ts`

### Architecture

The scraper system uses a router pattern. `lib/scraper/index.ts` maintains a registry of source-specific scrapers and dispatches to them in parallel:

```typescript
const SCRAPERS: Record<string, (config: JobConfig) => Promise<ScrapedListing[]>> = {
  sreality: scrapeSreality,
  bezrealitky: scrapeBezrealitky,
}

export async function runScraper(config: JobConfig): Promise<ScrapedListing[]> {
  const sources = config.sources?.length ? config.sources : Object.keys(SCRAPERS)
  const tasks = sources
    .filter((s) => SCRAPERS[s])
    .map((s) => SCRAPERS[s](config).catch(() => [] as ScrapedListing[]))
  const allResults = (await Promise.all(tasks)).flat()
  // Deduplicate by URL
  // ...
}
```

Individual scraper failures are caught and return an empty array, so one source failing does not block results from other sources.

### Common Types

```typescript
// lib/scraper/types.ts
interface ScrapedListing {
  source: string
  title: string
  url: string
  price: number | null
  district: string | null
  disposition: string | null
  areaM2: number | null
}

interface JobConfig {
  locality: string
  sources: string[]
  filters: {
    types?: string[]           // ["BYT", "DUM", "KOMERCNI", "POZEMEK"]
    dispositions?: string[]    // ["2+kk", "3+kk", "3+1"]
    minPrice?: number
    maxPrice?: number
    minAreaM2?: number
    maxAreaM2?: number
  }
}
```

### Sreality.cz Scraper

**File**: `lib/scraper/sreality.ts`
**Method**: JSON API (`https://www.sreality.cz/api/cs/v2/estates`)

Key behaviors:
- Maps internal property types to Sreality `category_main_cb` values: `BYT=1`, `DUM=2`, `KOMERCNI=3`, `POZEMEK=4`
- Maps disposition strings to `category_sub_cb` values (e.g., `"2+kk" -> 4`, `"3+1" -> 7`)
- Constructs detail page URLs from type slug, disposition slug, SEO locality, and `hash_id`
- Filters out informational listings (price <= 1 Kc)
- Applies client-side price and area filters (API price parameters are unreliable)
- Extracts area from title via regex (`/(\d+)\s*m[^2]/`)
- Extracts disposition from structured `seo.category_sub_cb` field, with regex fallback from title

### Bezrealitky.cz Scraper

**File**: `lib/scraper/bezrealitky.ts`
**Method**: GraphQL API (`https://api.bezrealitky.cz/graphql/`)

Key behaviors:
- Uses the `AdvertList` GraphQL query with typed variables (`OfferType`, `EstateType`, `Disposition`, `regionOsmIds`)
- Maps internal types to GraphQL enum values: `BYT -> ["BYT"]`, `DUM -> ["DUM"]`, `KOMERCNI -> ["KANCELAR", "NEBYTOVY_PROSTOR"]`
- Converts disposition strings to GraphQL format: `"2+kk" -> "DISP_2_KK"`
- Uses `regionOsmIds` for locality filtering (OpenStreetMap relation IDs)
- Server-side filtering for price and area ranges (via `priceFrom`, `priceTo`, `surfaceFrom`, `surfaceTo` variables)
- Constructs listing URLs as `https://www.bezrealitky.cz/nemovitosti-byty-domy/{uri}`

### Locality Resolution

**File**: `lib/scraper/localities.ts`

Each scraper source has its own locality resolution system:

**Sreality**: Maps locality names to either:
- `{ type: "param", id: number, paramName: "locality_district_id" | "locality_region_id" }` -- for numbered districts, cities, and regions
- `{ type: "region", region: string, regionEntityType: "osmm" }` -- for Prague neighborhoods (text-based search)

**Bezrealitky**: Maps locality names to OpenStreetMap relation IDs (e.g., `"praha" -> ["R435514"]`, `"vinohrady" -> ["R428841"]`).

Both resolvers support:
- Exact match (case-insensitive)
- Diacritics-insensitive matching (`removeDiacritics()` normalizes Czech characters)
- Substring matching (e.g., "Praha 7 Holesovice" matches "holesovice")

Coverage includes all 14 Czech regions, all regional capitals, 40+ additional cities (okres-level), and 25+ Prague neighborhoods.

### Deduplication

**File**: `lib/scraper/dedup.ts`

Two-layer deduplication:

1. **In-memory**: `runScraper()` deduplicates across sources by URL using a `Set`
2. **Database**: `filterNewListings(jobId, listings)` queries existing `MonitoringResult` records for the job and filters out any listings with matching URLs

```typescript
export async function filterNewListings(jobId: number, listings: ScrapedListing[]): Promise<ScrapedListing[]> {
  const existing = await prisma.monitoringResult.findMany({
    where: { jobId, url: { in: urls } },
    select: { url: true },
  })
  const existingUrls = new Set(existing.map((r) => r.url))
  return listings.filter((l) => !existingUrls.has(l.url))
}
```

---

## 6. Vercel Cron Jobs

Defined in `vercel.json`. All three jobs validate the `Authorization: Bearer ${CRON_SECRET}` header, which Vercel injects automatically for cron invocations.

| Job | Schedule | Endpoint | maxDuration | Purpose |
|-----|----------|----------|-------------|---------|
| Market monitoring | `0 5 * * 1-5` (5 AM Mon-Fri) | `/api/cron/monitoring` | 60s | Scrape Sreality + Bezrealitky, dedup, save new listings, send email notifications |
| Reminder calls | `0 5 * * *` (5 AM daily) | `/api/cron/daily-reminder-calls` | 60s | ElevenLabs outbound voice calls for today's showings |
| Weekly report | `0 7 * * 1` (7 AM Monday) | `/api/cron/weekly-report` | 120s | Generate executive PPTX report and email to configured recipient |

### Monitoring Cron (`/api/cron/monitoring`)

1. Loads all `ScheduledJob` records with status `ACTIVE`
2. For each job, runs `runScraper(config)` with the job's `configJson`
3. Filters results through `filterNewListings()` for deduplication
4. Saves new listings to `MonitoringResult` table
5. Updates `lastRunAt` on the job
6. Sends email notification via `sendMonitoringEmail()` if `notifyEmail` is set and new listings exist
7. Returns summary: `{ jobsRun, totalNew, details[] }`

### Reminder Calls Cron (`/api/cron/daily-reminder-calls`)

See [Section 4: ElevenLabs Voice Calls](#4-elevenlabs-voice-calls) for the full flow.

### Weekly Report Cron (`/api/cron/weekly-report`)

1. Loads `AutomationConfig` for key `"weekly_executive_report"`
2. If config is inactive, returns early with `"Automation is paused"`
3. Calls `generateExecutiveReport()` with the configured recipient email, `trigger: "cron"`, and `slideCount: 5`

---

## 7. Executive Report Automation

**File**: `lib/executive-report/generate.ts`

### Trigger

- **Automated**: Weekly report cron (`/api/cron/weekly-report`, Mondays at 7 AM UTC)
- **Manual**: The `generatePresentation` agent tool

### Data Pipeline

The `generateExecutiveReport()` function fetches three data sources in parallel:

```typescript
const [kpi, timeline, reno] = await Promise.all([
  fetchKpiData(8),          // Last 8 weeks of WeeklyReport records
  fetchTimelineData(6),     // Last 6 months of lead/sales timeline
  fetchRenoData(),          // Properties missing renovation data
])
```

**KPI data** (`fetchKpiData`): Queries `WeeklyReport` records, computes period-over-period trends (first half vs. second half), and aggregates totals for leads, clients, deals, and revenue.

**Timeline data** (`fetchTimelineData`): Queries lead and sales counts by month, calculates conversion rate.

**Renovation data** (`fetchRenoData`): Queries properties missing renovation year or notes, groups by district.

### Slide Generation

`buildSlidePool()` creates a pool of 8 slide definitions:

1. **Executive Report** -- KPI overview with trends
2. **Lead/Sales Timeline** -- Monthly table with conversion rates
3. **Operational Findings** -- Missing renovation data or recommendations
4. **Weekly KPI Detail** -- Last 8 weeks in table format
5. **Conversion Analysis** -- Monthly conversion rates vs. industry average (15-20%)
6. **Revenue Trend** -- Weekly revenue with average per deal
7. **Properties Needing Attention** -- Top 8 properties missing data (or pipeline health metrics)
8. **Action Plan** -- Data-driven priority recommendations

The `slideCount` parameter (default 5) determines how many slides from the pool are included.

### Output and Delivery

1. Slides are passed to `buildPptxBuffer()` to generate a PPTX file
2. An HTML email is constructed with KPI summary cards (styled for dark theme)
3. `sendEmailWithAttachment()` sends the email with the PPTX attached
4. An `ExecutiveReportRun` record tracks the run (status: `SUCCESS` or `FAILED`)

### Configuration

The `AutomationConfig` model (key: `"weekly_executive_report"`) controls:
- `isActive`: Whether the cron trigger runs
- `recipientEmail`: Where the report is sent

### Tracking

Each run creates an `ExecutiveReportRun` record:
- `trigger`: `"cron"` or `"manual"`
- `recipientEmail`: Target address
- `status`: `"PENDING"` -> `"SUCCESS"` or `"FAILED"`
- `slideCount`: Number of slides generated
- `errorMessage`: Captured on failure (truncated to 500 characters)
- `finishedAt`: Completion timestamp

---

## 8. n8n Webhook

**File**: `app/api/n8n-webhook/route.ts`

### Purpose

Provides an external ingestion endpoint for monitoring results. Allows n8n workflows (or any external system) to push scraped listings into the application without using the built-in scrapers.

### Endpoint

```
POST /api/n8n-webhook
```

### Authentication

Header-based secret validation:
```
x-webhook-secret: {N8N_WEBHOOK_SECRET}
```

If `N8N_WEBHOOK_SECRET` is not set in the environment, the endpoint accepts all requests (no authentication).

### Request Body

```typescript
{
  jobId: number,
  results: Array<{
    source: string
    title: string
    url: string
    price?: number | null
    district?: string | null
    disposition?: string | null
  }>
}
```

### Behavior

1. Validates the webhook secret (if configured)
2. Validates that `jobId` and `results[]` are present
3. Calls `createMonitoringResults(jobId, results)` to bulk-insert into the `MonitoringResult` table
4. Calls `updateJobLastRun(jobId)` to update the associated `ScheduledJob`
5. Returns `{ success: true, inserted: count, jobId }`

This integration is optional. The application functions fully without n8n using Vercel cron and built-in scrapers.

---

## 9. See Also

- [Architecture](./architecture.md) -- System-level overview and request flow
- [Backend](./backend.md) -- API routes including cron and webhook endpoints
- [Tools](./tools.md) -- Agent tools that use these integrations (createShowing, updateShowing, createGmailDraft, etc.)
- [Deployment](./deployment.md) -- Environment variables required for each integration
