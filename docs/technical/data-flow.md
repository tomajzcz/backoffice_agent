# Data Flow: End-to-End Scenarios

This document traces the exact code paths for four representative workflows, from user input (or cron trigger) through the API layer, database queries, external integrations, and finally to the frontend rendering layer.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scenario 1: Morning Briefing](#2-scenario-1-morning-briefing)
3. [Scenario 2: Showing Booking with Calendar + SMS](#3-scenario-2-showing-booking-with-calendar--sms)
4. [Scenario 3: Investor Report with PPTX Email](#4-scenario-3-investor-report-with-pptx-email)
5. [Scenario 4: Automated Weekly Report (cron)](#5-scenario-4-automated-weekly-report-cron)
6. [See Also](#6-see-also)

---

## 1. Introduction

Each scenario below follows the same general shape for interactive workflows:

```
User message
  -> POST /api/chat
    -> trimMessageHistory()
    -> selectTools() (keyword matching)
    -> streamText() (Claude Sonnet, maxSteps: 5)
      -> LLM invokes tool(s)
        -> DB queries / external API calls
        -> tool returns typed result
      -> onStepFinish: logs tool calls + record counts
    -> onFinish: buildExplainability() -> StreamData annotation
    -> logAgentRun() (fire-and-forget)
  -> SSE response (toDataStreamResponse)
    -> Frontend extracts latestToolResult
    -> ResultsPanel auto-switches tab
```

The cron scenario (Scenario 4) bypasses the chat layer entirely and operates through a standalone API route.

---

## 2. Scenario 1: Morning Briefing

**User input:** `"Jaky je stav operativy?"`

### Step 1: HTTP Request

The frontend sends `POST /api/chat` with the message array and optional `sessionId`.

- File: `app/api/chat/route.ts` (line 117)
- `maxDuration = 120` prevents Vercel from cutting the stream at 10 seconds.

### Step 2: Message History Trimming

`trimMessageHistory(messages)` processes the conversation:

1. **Hard cap:** Keeps only the last 20 messages (`messages.slice(-20)`).
2. **Incomplete tool calls:** Any `toolInvocations` with `state !== "result"` are patched to return an error sentinel so the LLM does not stall.
3. **Payload stripping:** For assistant messages with existing tool results:
   - Base64 `downloadUrl` values replaced with `"[file already delivered to client]"`.
   - `markdown` and `bodyHtml` strings truncated to 500 characters.
   - `chartData` arrays emptied entirely.
   - Arrays in `TRIMMABLE_ARRAYS` (properties, clients, leads, deals, showings, categories, issues, etc.) capped to 3 items with a `_<key>Total` count field preserved.

### Step 3: Tool Selection

`selectTools(userQuery, agentTools)` in `lib/agent/tool-selector.ts`:

1. The user message is lowercased: `"jaky je stav operativy?"`.
2. CORE group is always included: `["generateReport", "createAgentTask"]`.
3. Keyword `"stav"` matches `["DATA_QUALITY", "ANALYTICS"]`.
4. DATA_QUALITY group adds: `scanMissingRenovationData`, `scanMissingDocuments`, `scanOperationalHealth`, `scanOverdueTasks`.
5. ANALYTICS group adds: `queryNewClients`, `queryLeadsSalesTimeline`, `queryWeeklyKPIs`, `queryPropertiesByLifecycle`, `calculatePropertyProfitability`, `getInvestorOverview`.
6. The filtered tool set (12 tools) is passed to `streamText()` instead of all 35+.

### Step 4: LLM Streaming

`streamText()` configuration:

- Model: `anthropic("claude-sonnet-4-6")`
- System prompt: `getSystemPrompt()` from `lib/agent/prompts.ts` (Czech instructions)
- `maxSteps: 5` -- allows up to 5 sequential tool calls before the LLM must produce a text response
- `maxRetries: 1`

### Step 5: LLM Calls scanOperationalHealth

- File: `lib/agent/tools/scanOperationalHealth.ts`
- Parameters: `stalledDealsDays` (default 30), `showingFollowUpDays` (default 14)
- Delegates to `runOperationalHealthScan()` in `lib/db/queries/health.ts`

**Database queries** (6 parallel Prisma queries via `Promise.all`):

| Query | Table | Condition |
|-------|-------|-----------|
| Missing renovation data | `Property` | `lastRenovationYear IS NULL AND (renovationNotes IS NULL OR renovationNotes = '')` |
| Overdue tasks | `AgentTask` | `dueDate < now AND status IN ('OPEN', 'IN_PROGRESS')` |
| Stalled deals | `Deal` | `status = 'IN_PROGRESS' AND updatedAt < (now - 30 days)` |
| Showings without follow-up | `Showing` | `status = 'COMPLETED' AND scheduledAt < (now - 14 days)` + no matching Deal for same property+client |
| Properties without owner | `Property` | `ownerId IS NULL AND status NOT IN ('SOLD', 'WITHDRAWN')` |
| Missing lifecycle stage | `Property` | `lifecycleStage IS NULL AND status NOT IN ('SOLD', 'WITHDRAWN')` |

After the parallel queries, completed showings are filtered sequentially: for each, a `prisma.deal.findFirst()` checks whether a matching deal exists.

**Result transformation** (back in the tool):

- Each category gets a Czech label (e.g., `"overdueTasks"` -> `"Prosle ukoly"`) and severity (`"high"`, `"medium"`, `"low"`).
- Items are capped at 10 per category.
- Health score calculated: `100 - (highCount * 8) - (mediumCount * 3) - (lowCount * 1)`, clamped to 0-100.
- `chartData` is built as `[{ name: categoryLabel, pocet: count }]` for bar chart rendering.
- Returns `ScanOperationalHealthResult` with `chartType: "bar"`.

### Step 6: LLM Calls scanRenovationHealth

- File: `lib/agent/tools/scanRenovationHealth.ts`
- No parameters required.
- Delegates to `scanRenovationHealth()` in `lib/db/queries/renovations.ts`

**Database operations:**

1. `refreshDelayedFlags()` runs first -- two `updateMany` calls that sync the `isDelayed` boolean on all active renovations based on whether `plannedEndAt` has passed.
2. Fetches all active renovations with their properties and open/in-progress tasks.
3. Iterates through results, categorizing into: delayed, overBudget, withBlockers, missingContractor, missingNextStep, withOverdueTasks.

**Health score:** `100 - (delayed * 15) - (overBudget * 10) - (overdueTasks * 10) - (blockers * 5) - (missingContractor * 5) - (missingNextStep * 3)`.

### Step 7: LLM May Call scanOverdueTasks

- File: `lib/agent/tools/scanOverdueTasks.ts`
- Calls `getOverdueTasks()` and `getUpcomingTasks(includeDueSoon)` from `lib/db/queries/tasks.ts` in parallel.
- Aggregates overdue tasks by priority for chart data.

### Step 8: onStepFinish Callback

After each tool step completes (`app/api/chat/route.ts`, line 141):

- Each tool call is logged to `toolCallLog[]` with `toolName`, `params`, and `startedAt`.
- Record counts are extracted from tool results: fields like `totalCount`, `totalClients`, `totalLeads`, `totalEvents`, `totalFreeSlots`, `totalJobs`, `totalResults`.

### Step 9: LLM Synthesizes Briefing

With all tool results available, the LLM produces a Czech-language briefing summarizing the operational health score, renovation status, and any overdue tasks. This is streamed as text to the client.

### Step 10: onFinish Callback

- `buildExplainability(toolCallLog, recordCounts)` in `lib/agent/explainability.ts`:
  - Maps each tool to a Czech label and data sources (e.g., `scanOperationalHealth` -> `["PostgreSQL: properties", "PostgreSQL: clients"]`).
  - Extracts filter parameters (year, quarter, district, etc.) from tool call arguments.
  - Sanitizes params: sensitive keys like `pptxToken` and `googleEventId` are excluded; long strings are truncated.
  - Returns `ExplainabilityData` with a unique `turnId`.
- The explainability object is appended as a message annotation via `streamData.appendMessageAnnotation()`.
- `streamData.close()` signals end of metadata.
- `logAgentRun()` fires asynchronously to insert into the `AgentRun` table (fire-and-forget, never blocks response).

### Step 11: Frontend Tab Switching

In `components/results/ResultsPanel.tsx`:

- `latestToolResult` is extracted from the most recent assistant message's `toolInvocations`.
- The `useEffect` hook checks `toolName`:
  - `scanOperationalHealth` falls into the `else` branch (not in the explicit Data/Zprava/Email lists).
  - Tab auto-switches to `"graf"` (Chart tab).
- `ChartTab` receives the result and renders a Recharts bar chart from `chartData`.
- The subtitle displays: `"Zdravi: {overallScore}/100 . {totalIssues} problemu"`.

### Step 12: Explainability Display

- `ExplainabilitySection` (rendered in `AnswerTab` and `LogsTab`) shows:
  - Tools used with Czech labels
  - Data sources queried
  - Filters applied
  - Record counts per tool

---

## 3. Scenario 2: Showing Booking with Calendar + SMS

**User input:** `"Naplanuj prohlidku bytu na Vinohradske 15 pro Jana Novaka na utery v 14:00"`

### Step 1: Tool Selection

`selectTools()` processes the lowercased message:

- `"prohlid"` (substring match on `"prohlidku"`) -> `CRUD_SHOWINGS` + `CALENDAR`
- `"byt"` (substring match on `"bytu"`) -> `CRUD_PROPERTIES`
- CORE group always included.

Selected tool groups expand to:

- CORE: `generateReport`, `createAgentTask`
- CRUD_SHOWINGS: `listShowings`, `createShowing`, `updateShowing`
- CALENDAR: `getCalendarAvailability`, `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent`, `listCalendarEvents`
- CRUD_PROPERTIES: `listProperties`, `createProperty`, `updateProperty`, `getPropertyDetails`, `getPropertyDocuments`

### Step 2: LLM Calls getPropertyDetails

- File: `lib/agent/tools/getPropertyDetails.ts`
- Parameter: `propertyId` (LLM resolves from context or may first call `listProperties` to find the ID)
- Calls `getPropertyById(propertyId)` in `lib/db/queries/properties.ts`
- Prisma query includes `owner` (name, email, phone) and `_count` (documents, tasks)
- Returns `GetPropertyDetailsResult` with full property metadata, Czech enum labels applied at the tool layer

### Step 3: LLM Calls getCalendarAvailability

- File: `lib/agent/tools/getCalendarAvailability.ts`
- Parameters: `dateRangeStart`, `dateRangeEnd` (ISO 8601 date strings)
- Delegates to `getCalendarFreeSlots()` in `lib/google/calendar.ts`

**Google Calendar API call:**

1. `getCalendarApi()` obtains the OAuth2 client via `getGoogleClient()` from `lib/google/auth.ts` (cached as global singleton).
2. `calendar.freebusy.query()` is called with `timeZone: "Europe/Prague"` and `items: [{ id: "primary" }]`.
3. Busy slots are retrieved from `response.data.calendars.primary.busy`.

**Free slot computation:**

- Iterates each day in the range.
- Skips weekends (Saturday = 6, Sunday = 0).
- Working hours: `WORK_START = 9`, `WORK_END = 18`.
- For each weekday, busy intervals are sorted chronologically.
- Free intervals are computed by inverting busy periods within working hours.
- Minimum slot duration: `MIN_SLOT_MINUTES = 30`.
- Each slot includes: `date` (YYYY-MM-DD), `dateLabel` (Czech locale, e.g., "utery 24. brezna"), `start`/`end` times, `durationMinutes`.

**Tool result:** Groups slots by date for `byDate` summary and builds `chartData` for bar chart (date label -> slot count). Returns `chartType: "bar"`.

### Step 4: LLM Calls createShowing

- File: `lib/agent/tools/createShowing.ts`
- Parameters: `propertyId`, `clientId`, `scheduledAt` (ISO 8601), optional `notes`, `createCalendarEvent` (default `true`), `sendSmsConfirmation` (default `true`)

**Phase A: Database insert**

- `createShowingQuery()` in `lib/db/queries/showings.ts`
- `prisma.showing.create()` with included relations: `client` (name, phone), `property` (address, district)
- Returns the new showing record with status defaulting to `"SCHEDULED"`

**Phase B: Google Calendar event creation** (if `createCalendarEvent` is true)

- `buildShowingEventDescription()` generates a Czech description: `"Prohlidka nemovitosti\n\nAdresa: {address}\nKlient: {name}"`
- `createCalendarEvent()` in `lib/google/calendar.ts`:
  - Summary: `"Prohlidka: {address} - {clientName}"`
  - Start: the provided `scheduledAt`
  - End: defaults to start + 60 minutes (`DEFAULT_DURATION_MS = 3600000`)
  - Location: property address
  - Timezone: `"Europe/Prague"`
  - Calls `calendar.events.insert()` on the primary calendar
- On success: `updateShowingQuery(showing.id, { googleCalendarEventId: event.id })` persists the calendar event ID back to the showing record
- On failure: error is captured as `calendarError` string; the operation continues (does not block)

**Phase C: SMS confirmation** (if `sendSmsConfirmation` is true)

- Checks if `showing.client.phone` exists; if not, sets `smsError: "Klient nema telefonni cislo"`
- `sendShowingConfirmationSms()` in `lib/integrations/twilio.ts`:
  - Formats the date in Czech locale: `dateStyle: "long"`, `timeStyle: "short"`, `timeZone: "Europe/Prague"`
  - Builds message: `"Dobry den, {name}. Vase prohlidka nemovitosti na adrese {address} je naplanovana na {date}. Tesime se na Vas!"`
  - `sendSms()` calls the Twilio REST API:
    - URL: `https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json`
    - Auth: Basic authentication with `accountSid:authToken` (Base64 encoded)
    - Body: URL-encoded `To`, `From`, `Body` parameters
    - Returns `{ messageSid, status }` (typically `"queued"`)
- On failure: error is captured as `smsError` string; the operation continues

**Tool result:** `CreateShowingResult` with `chartType: "none"`, containing:
- `showing.id`, `propertyAddress`, `clientName`, `scheduledAt`, `status`, `statusLabel`
- `googleCalendarEventId` (or null + `calendarError`)
- `smsSent` boolean + optional `smsError`

### Step 5: Frontend Tab Switching

- `toolName === "createShowing"` matches the explicit list in `ResultsPanel.tsx` (line 118).
- Tab auto-switches to `"data"` (Data tab).
- `DataTab` renders the showing record details.
- Subtitle: `"Prohlidka #{id} naplanovana . Kalendar OK . SMS odeslano"` (varies based on success/failure of side effects).

### Step 6: Downstream Effects

- **Daily reminder cron** (`/api/cron/daily-reminder-calls`): Runs at 5 AM daily. Finds today's showings with `status: "SCHEDULED"` and triggers ElevenLabs outbound voice calls for reminders.

---

## 4. Scenario 3: Investor Report with PPTX Email

**User input:** `"Priprav prehled portfolia pro investory a posli prezentaci na email"`

### Step 1: Tool Selection

Keywords matched from the lowercased message:

- `"prehled"` -> `ANALYTICS`
- `"investor"` -> `ANALYTICS`, `CRUD_PROPERTIES`
- `"prezentac"` (substring match on `"prezentaci"`) -> `EMAIL_EXPORT`, `ANALYTICS`
- `"email"` -> `EMAIL_EXPORT`, `CRUD_PROPERTIES`

Selected groups: CORE, ANALYTICS, CRUD_PROPERTIES, EMAIL_EXPORT.

This gives the LLM access to investor, profitability, KPI, timeline tools plus the presentation and email tools.

### Step 2: LLM Calls getInvestorOverview

- File: `lib/agent/tools/getInvestorOverview.ts`
- Parameters: optional `investorId`, optional `investorName` (both omitted for full overview)
- Delegates to `getInvestorOverview()` in `lib/db/queries/investors.ts`

**Database query:**

- `prisma.investor.findMany()` with `include: { properties: { include: { property } } }`
- Joins through the `InvestorProperty` junction table to get each investor's property portfolio
- For each investor, computes:
  - `totalInvested`: sum of `investedAmount` across InvestorProperty records
  - `totalCurrentValue`: sum of property `price` values
- Returns array of investors with their property details (address, district, lifecycleStage, investedAmount, currentValue)

**Tool result:** `GetInvestorOverviewResult` with:
- `totalInvestors`, `totalPortfolioValue`, `totalInvested`
- `investors[]` with nested `properties[]`
- `chartType: "bar"`, `chartData`: investor name -> portfolio value in millions (rounded to 0.1M)

### Step 3: LLM Calls calculatePropertyProfitability

- File: `lib/agent/tools/calculatePropertyProfitability.ts`
- Parameters: optional `propertyId`, `district`, `minROI`
- Calls `getPropertiesWithCosts()` from `lib/db/queries/properties.ts`

**ROI calculation per property:**

```
totalInvestment = purchasePrice + renovationCost
potentialProfit = expectedSalePrice - totalInvestment
roi = (potentialProfit / totalInvestment) * 100
```

- Properties sorted by ROI descending
- Chart data: top 10 properties by profit (in millions)
- Returns aggregate metrics: `totalInvestment`, `totalExpectedRevenue`, `totalPotentialProfit`, `averageROI`

### Step 4: LLM Calls queryWeeklyKPIs and queryLeadsSalesTimeline

These are prerequisite data sources required by `generatePresentation`. The LLM calls them in earlier steps to collect the data it will pass as parameters.

### Step 5: LLM Calls generatePresentation

- File: `lib/agent/tools/generatePresentation.ts`
- Parameters: `title`, `slideCount` (1-10, default 3), `kpiData`, `timelineData`, optional `renovationData`

**Slide pool construction:**

The tool builds a pool of 10 slides in priority order:

| Slide | Content |
|-------|---------|
| 1 | KPI overview: leads, clients, deals, revenue with trend percentages |
| 2 | Leads vs sales timeline with conversion rate |
| 3 | Operational findings (if renovation data provided) or key recommendations |
| 4 | Weekly KPI detail table (last 8 weeks) |
| 5 | Conversion analysis with industry benchmark comparison (15-20%) |
| 6 | Revenue trend (weekly, last 10 weeks) |
| 7 | Properties needing attention or pipeline health |
| 8 | Performance comparison: first vs last third of period |
| 9 | Monthly lead acquisition detail |
| 10 | Action plan with data-driven recommendations |

The first `slideCount` slides are selected from this pool.

**PPTX generation:**

- `buildPptxBuffer(slides)` in `lib/export/pptx.ts` uses PptxGenJS server-side
- Each slide is rendered with dark theme colors (`bg: "1a1a2e"`, `accent: "f59e0b"`)
- Supports: metrics cards with trends, tables, bullet lists

**Token-based storage:**

- `storePptx(buffer)` in `lib/export/pptx-store.ts` delegates to `storeFile()` in `lib/export/file-store.ts`
- Writes the buffer to `/tmp/pptx-{uuid}` with a `.json` metadata file containing `expiresAt` (10 minutes TTL)
- Returns a UUID token
- Download URL constructed as `/api/export/pptx?token={uuid}&filename={encodedTitle}`

**Tool result:** `GeneratePresentationResult` with `downloadUrl`, `slideCount`, `title`, `chartType: "none"`.

### Step 6: LLM Calls sendPresentationEmail

- File: `lib/agent/tools/sendPresentationEmail.ts`
- Parameters: `to` (email), `subject`, `body` (HTML), `pptxToken` (extracted from previous step's `downloadUrl` query param), `filename`

**PPTX retrieval:**

- `getPptx(pptxToken)` in `lib/export/pptx-store.ts` reads the buffer from `/tmp/pptx-{token}`
- Checks expiry from the `.json` metadata; if expired, cleans up and returns null

**Email sending via Gmail API:**

- `sendEmailWithAttachment()` in `lib/google/gmail.ts`:
  1. Obtains Gmail API client via `getGoogleClient()` (OAuth2 singleton)
  2. Constructs MIME multipart message with boundary:
     - Part 1: HTML body (base64 encoded)
     - Part 2: PPTX attachment with `Content-Disposition: attachment`
  3. Subject line is Base64-encoded with UTF-8 charset header: `=?UTF-8?B?{base64}?=`
  4. Full message is base64url-encoded (replacing `+` with `-`, `/` with `_`, stripping `=` padding)
  5. Calls `gmail.users.messages.send()` -- note: this sends the email directly, not as a draft

**Tool result:** `SendPresentationEmailResult` with `messageId`, `to`, `subject`, `title`, `sentAt`, `chartType: "none"`.

### Step 7: Frontend Tab Progression

As multiple tools are called across steps, the tab switches accordingly:

1. `getInvestorOverview` -> `"graf"` tab (bar chart of investor portfolios)
2. `calculatePropertyProfitability` -> `"graf"` tab (bar chart of property profits)
3. `generatePresentation` -> `"zprava"` tab (Report tab with download link)
4. `sendPresentationEmail` -> `"email"` tab (Email tab showing sent confirmation)

The final tab state is `"email"`, matching the last tool result.

---

## 5. Scenario 4: Automated Weekly Report (cron)

**Trigger:** Vercel cron fires `GET /api/cron/weekly-report` every Monday at 7:00 UTC (9:00 CEST).

This scenario has no user message and does not go through the chat endpoint.

### Step 1: Cron Route Handler

- File: `app/api/cron/weekly-report/route.ts`
- `maxDuration = 120` seconds
- Validates `Authorization: Bearer ${CRON_SECRET}` header (Vercel-injected). Returns 401 if invalid.

### Step 2: Automation Config Check

- `getAutomationConfig("weekly_executive_report")` in `lib/db/queries/executive-reports.ts`
- Queries `AutomationConfig` table by key
- If config is missing or `isActive === false`, returns early with `{ success: true, message: "Automation is paused" }`
- Extracts `config.recipientEmail` for the report destination

### Step 3: Generate Executive Report

- `generateExecutiveReport({ recipientEmail, trigger: "cron", slideCount: 5 })` in `lib/executive-report/generate.ts`

**Step 3a: Create run record**

- `createReportRun({ trigger: "cron", recipientEmail })` inserts into `ExecutiveReportRun` table with `status: "RUNNING"`

**Step 3b: Parallel data collection**

Three data fetches run concurrently via `Promise.all`:

| Function | Source | Parameters |
|----------|--------|------------|
| `fetchKpiData(8)` | `getWeeklyReports(8)` -> `WeeklyReport` table | Last 8 weeks of KPI data |
| `fetchTimelineData(6)` | `getLeadsSalesTimeline(6)` -> `Lead` + `Property` tables | Last 6 months of lead/sales data |
| `fetchRenoData()` | `getMissingRenovationProperties()` -> `Property` table | Properties with `lastRenovationYear IS NULL` |

**KPI data transformation:**

- Each weekly report row is mapped to `WeekData` with ISO week label (e.g., `"T13 2026"`)
- Trends calculated by comparing averages of first half vs second half of the period: `pctChange(avg(secondHalf), avg(firstHalf))`
- Totals aggregated: `totalLeads`, `totalClients`, `totalDeals`, `totalRevenue`

**Timeline data transformation:**

- Monthly rows with `leads`, `converted`, `soldProperties`
- Overall `conversionRate = round((totalConverted / totalLeads) * 100)`

**Renovation data transformation:**

- Properties grouped by district with counts
- Sorted by count descending

**Step 3c: Build slide pool**

`buildSlidePool(kpi, timeline, reno)` constructs 8 slides:

| Slide | Content |
|-------|---------|
| 1 | Executive Report: KPI overview with trends |
| 2 | Leads vs sales timeline with conversion metrics |
| 3 | Operational findings (missing renovation data) or key recommendations |
| 4 | Weekly KPI detail table |
| 5 | Conversion analysis vs industry benchmark |
| 6 | Revenue trend (weekly) |
| 7 | Properties needing attention or pipeline health |
| 8 | Action plan with data-driven recommendations |

The first 5 slides are selected (per `slideCount: 5`).

**Step 3d: PPTX generation**

- `buildPptxBuffer(slides)` in `lib/export/pptx.ts` generates the PowerPoint buffer using PptxGenJS

**Step 3e: Email construction**

- `buildEmailHtml(kpi, timeline)` generates an inline-styled HTML email body:
  - Dark theme matching the app UI (`background: #1a1a2e`)
  - KPI cards with colored trend arrows (green up, red down)
  - Conversion rate and total sales summary
  - Note about PPTX attachment
  - Footer: "Automaticky vygenerovano . Back Office Agent . Prague Properties"

**Step 3f: Send email with attachment**

- `sendEmailWithAttachment()` in `lib/google/gmail.ts`
- Recipient: `config.recipientEmail`
- Subject: `"Tydenni executive report - {dateLabel}"` (Czech date format)
- Attachment: `executive-report-{YYYY-MM-DD}.pptx`
- MIME multipart construction identical to Scenario 3, Step 6

### Step 4: Record Outcome

**On success:**

- `updateReportRun(run.id, { status: "SUCCESS", slideCount: 5, finishedAt: new Date() })`
- Returns `{ runId, success: true }`

**On failure:**

- Error message captured and truncated to 500 characters
- `updateReportRun(run.id, { status: "FAILED", errorMessage, finishedAt: new Date() })`
- Returns `{ runId, success: false, error: errorMessage }`

### Step 5: HTTP Response

The cron route returns the result as JSON. Vercel logs the cron execution status.

---

## 6. See Also

- [architecture.md](architecture.md) -- System architecture overview and component diagram
- [backend.md](backend.md) -- API routes, middleware, and server-side patterns
- [tools.md](tools.md) -- Complete tool catalog with parameters and return types
- [integrations.md](integrations.md) -- Google Calendar, Gmail, Twilio, and ElevenLabs integration details
- [database.md](database.md) -- Schema documentation and query patterns
- [frontend.md](frontend.md) -- UI components and state management
