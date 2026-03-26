# Backend API and Systems

Next.js 15 App Router with 10 API route files. All routes live under `app/api/`. The backend serves the AI chat agent, file export, cron-based automation, and external webhook ingestion.

---

## 1. API Routes Overview

| Method | Path | File | Purpose |
|--------|------|------|---------|
| POST | `/api/chat` | `app/api/chat/route.ts` | Main chat endpoint -- streams LLM responses with tool calls |
| GET | `/api/agent-runs` | `app/api/agent-runs/route.ts` | Paginated agent run history for the Logs tab |
| GET | `/api/cron/monitoring` | `app/api/cron/monitoring/route.ts` | Weekday 5 AM market scraping cron |
| GET | `/api/cron/daily-reminder-calls` | `app/api/cron/daily-reminder-calls/route.ts` | Daily 5 AM ElevenLabs voice reminder cron |
| GET | `/api/cron/weekly-report` | `app/api/cron/weekly-report/route.ts` | Monday 7 AM executive report generation cron |
| POST/GET | `/api/export/pptx` | `app/api/export/pptx/route.ts` | Token-based PPTX generation and download |
| POST | `/api/export/pptx/send-email` | `app/api/export/pptx/send-email/route.ts` | Email a generated PPTX as Gmail attachment |
| POST/GET | `/api/export/pdf` | `app/api/export/pdf/route.ts` | Token-based PDF generation and download |
| POST | `/api/email/approve` | `app/api/email/approve/route.ts` | Save an agent-drafted email as a Gmail draft |
| POST | `/api/n8n-webhook` | `app/api/n8n-webhook/route.ts` | Ingest monitoring results from external n8n workflows |

---

## 2. Chat Endpoint (POST /api/chat)

**File**: `app/api/chat/route.ts`

This is the core endpoint that powers the conversational AI. It accepts a message history, selects relevant tools, streams the LLM response, and logs the interaction.

### Request Format

```typescript
{
  messages: Message[]   // Full conversation history (AI SDK v4 format)
  sessionId?: string    // Optional session identifier for run logging
}
```

### Processing Pipeline

1. **Parse request** -- extract `messages` and `sessionId` from the JSON body.

2. **Trim message history** -- `trimMessageHistory(messages)` applies three layers of compression (detailed in section 5).

3. **Select tools** -- `selectTools(userQuery, agentTools)` reduces the tool set based on Czech keyword analysis of the latest user message (detailed in section 4).

4. **Stream LLM response** -- `streamText()` with the following configuration:

   ```typescript
   streamText({
     model: anthropic("claude-sonnet-4-6"),
     system: getSystemPrompt(),
     messages: trimmedMessages,
     tools: selectedTools,
     maxRetries: 1,
     maxSteps: 5,
   })
   ```

   - **model**: Anthropic Claude Sonnet 4 via `@ai-sdk/anthropic`.
   - **maxSteps: 5** -- allows up to 5 tool-call/response round-trips per request. Without this, the LLM issues tool calls but never produces a final text response.
   - **maxRetries: 1** -- single retry on transient failures.

5. **onStepFinish callback** -- fires after each tool-call step. Captures:
   - Tool name and arguments into `toolCallLog: ToolCallLog[]`.
   - Record counts from tool results (e.g., `totalCount`, `totalClients`, `totalEvents`) into `recordCounts` for explainability.

6. **onFinish callback** -- fires when the stream completes:
   - If tools were called, `buildExplainability(toolCallLog, recordCounts)` constructs audit metadata (tools used, data sources, filters, record counts, timestamp) and appends it as a message annotation via `streamData.appendMessageAnnotation()`. The frontend reads this annotation to populate the Logs tab.
   - Closes the `StreamData` instance.
   - Calls `logAgentRun()` as fire-and-forget -- never blocks the stream response. Failures are caught and logged to console.

7. **Response** -- `result.toDataStreamResponse({ data: streamData })` returns an SSE stream that the Vercel AI SDK frontend consumes.

### Configuration

- `maxDuration = 120` -- required to prevent Vercel from cutting the streaming response at the default 10-second timeout. Requires Vercel Pro plan.

---

## 3. System Prompt

**File**: `lib/agent/prompts.ts`

The system prompt is a single `getSystemPrompt()` function that returns approximately 136 lines of Czech text defining the agent's behavior.

### Dynamic Elements

- **Current date** -- injected via `new Date().toLocaleDateString("cs-CZ", ...)` with weekday, day, month, and year. This grounds the agent's temporal awareness for calendar and reporting operations.

### Structure

The prompt is organized into these sections:

| Section | Purpose |
|---------|---------|
| Identity and role | Back office operations agent for a Prague real estate firm |
| Working rules | Always use tools, never invent data, respond in Czech |
| Company context | Apartment flipping lifecycle, investor model, lead/client segments |
| Response style | Brief summary first, then context; no long preambles |
| Workflow: Record updates | Find via list tool, confirm with user, update, confirm changes |
| Workflow: Record creation | Ask for required fields, create via tool, confirm |
| Workflow: Showing booking | getPropertyDetails, getCalendarAvailability, offer slots, createShowing (auto-creates calendar event and SMS) |
| Workflow: Showing rescheduling | listShowings, getCalendarAvailability, updateShowing (auto-syncs calendar) |
| Workflow: Showing cancellation | listShowings, updateShowing with status CANCELLED (auto-deletes calendar event) |
| Workflow: Email composition | getPropertyDetails, getCalendarAvailability, compose draft, createGmailDraft (user approves in UI) |
| Workflow: Presentation email | generatePresentation, extract pptxToken, sendPresentationEmail |
| Workflow: Monitoring | listScheduledJobs, getMonitoringResults, analyzeNewListings, triggerMonitoringJob |
| Workflow: Morning briefing | scanOperationalHealth, scanRenovationHealth, createAgentTask, scanOverdueTasks, queryPropertiesByLifecycle |
| Workflow: Renovation management | queryActiveRenovations, getRenovationDetail, scanRenovationHealth, createAgentTask |
| Workflow: PDF export | generateReport with markdown, or table PDF via panel button |
| Workflow: Investor reporting | getInvestorOverview, calculatePropertyProfitability, generateReport, generatePresentation |
| Workflow: Property check | getPropertyDetails, getPropertyDocuments, flag missing data |

---

## 4. Tool Selection System

**File**: `lib/agent/tool-selector.ts`

The tool selector reduces token cost and improves response quality by sending only relevant tools to the LLM for each message.

### Mechanism

1. The user's latest message is lowercased.
2. The message is scanned against approximately 60 Czech keyword stems (e.g., `"klient"`, `"nemovitost"`, `"prohlíd"`, `"kalendář"`, `"briefing"`).
3. Each keyword maps to one or more tool groups.
4. The `CORE` group (`generateReport`, `createAgentTask`) is always included.
5. All tools from matched groups are collected into the filtered set.
6. **Fallback**: if only CORE matched (no keywords recognized), the selector returns all tools to handle unclear intent.

### Tool Groups (13 total)

| Group | Tools | Trigger Keywords (examples) |
|-------|-------|-----------------------------|
| CORE | generateReport, createAgentTask | Always included |
| ANALYTICS | queryNewClients, queryLeadsSalesTimeline, queryWeeklyKPIs, queryPropertiesByLifecycle, calculatePropertyProfitability, getInvestorOverview | report, kpi, investor, zisk, pipeline |
| CALENDAR | getCalendarAvailability, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, listCalendarEvents | kalendar, termin, schuzk, udalost |
| EMAIL_EXPORT | createGmailDraft, sendPresentationEmail, generatePresentation | email, mail, draft, prezentac, pptx |
| CRUD_PROPERTIES | listProperties, createProperty, updateProperty, getPropertyDetails, getPropertyDocuments | nemovitost, byt, adres |
| CRUD_CLIENTS | listClients, createClient, updateClient | klient, klienty |
| CRUD_LEADS | listLeads, createLead, updateLead | lead, leady |
| CRUD_DEALS | listDeals, createDeal, updateDeal | obchod, deal, prodej |
| CRUD_SHOWINGS | listShowings, createShowing, updateShowing | prohlid, sms, zrus |
| MONITORING | listScheduledJobs, triggerMonitoringJob, getMonitoringResults, createMonitoringJob, analyzeNewListings | monitoring, nabid, sreality, bezrealitky |
| RENOVATION | queryActiveRenovations, getRenovationDetail, scanRenovationHealth | rekonstrukc, renovac, stavb, dodavatel |
| DATA_QUALITY | scanMissingRenovationData, scanMissingDocuments, scanOperationalHealth, scanOverdueTasks | briefing, ranni, zdravi, audit, problem |

CRUD verb keywords (`vytvor`, `pridej`, `uprav`, `aktualizuj`) activate all five CRUD groups simultaneously.

---

## 5. Message History Trimming

**File**: `app/api/chat/route.ts` -- `trimMessageHistory()` and `trimToolResult()`

Multi-turn conversations accumulate large payloads from tool results (base64 files, long markdown reports, data arrays). The trimming system prevents context window overflow through three layers.

### Layer 1: Hard Cap

Only the last **20 messages** are retained. Earlier history is discarded.

### Layer 2: Payload Stripping (trimToolResult)

Applied to every tool result in assistant messages:

| Content Type | Condition | Action |
|--------------|-----------|--------|
| `downloadUrl` | Starts with `data:` | Replaced with `"[file already delivered to client]"` |
| `markdown` | Length > 500 chars | Truncated to 500 chars + `"\n...[truncated]"` |
| `bodyHtml` | Length > 500 chars | Truncated to 500 chars + `"...[truncated]"` |
| `chartData` | Is an array | Replaced with empty array `[]` |

### Layer 3: Array Capping

Large arrays in tool results are capped to **3 items**, with the original count preserved in a `_${key}Total` metadata field.

The list of trimmable array keys:

```
properties, clients, leads, deals, showings, events, results, investors,
renovations, overdueTasks, dueSoonTasks, categories, topListings, weeks,
timeline, byDistrict, byPhase, bySource, byDisposition, byStage,
byPriority, freeSlots, byDate, jobs, documents, tasks, issues
```

### Incomplete Tool Invocation Patching

If an assistant message contains a `toolInvocations` entry with `state !== "result"` (or missing `result`), the trimmer patches it to a valid result with an error message. This prevents the AI SDK from crashing when re-sending malformed history.

### Format Compatibility

The trimmer handles both:
- **AI SDK v4 format**: `msg.toolInvocations` array with `{ state, result }` objects.
- **Legacy content array format**: `msg.content` array with `{ type: "tool-result", result }` parts.

---

## 6. Cron Jobs

All three cron jobs are defined in `vercel.json` and authenticated via `CRON_SECRET` passed as a Bearer token in the Authorization header (Vercel injects this automatically).

### GET /api/cron/monitoring -- Market Monitoring

**File**: `app/api/cron/monitoring/route.ts`
**Schedule**: `0 5 * * 1-5` (5:00 AM UTC, Monday--Friday)
**maxDuration**: 60 seconds

**Pipeline**:
1. Load all `ScheduledJob` records with status `ACTIVE`.
2. For each job, parse `configJson` as `JobConfig` and run the scraper (`runScraper(config)`).
3. Deduplicate against existing results via `filterNewListings(job.id, allListings)`.
4. Persist new listings to `MonitoringResult` table via `createMonitoringResults()`.
5. Update `lastRunAt` on the job via `updateJobLastRun()`.
6. If the job has `notifyEmail` set and new listings were found, send an email notification via `sendMonitoringEmail()`. Email failures are caught and logged but do not block the job.

**Response**: `{ success, jobsRun, totalNew, details: [{ jobId, name, scraped, new }] }`

### GET /api/cron/daily-reminder-calls -- Voice Reminders

**File**: `app/api/cron/daily-reminder-calls/route.ts`
**Schedule**: `0 5 * * *` (5:00 AM UTC, daily)
**maxDuration**: 60 seconds

**Pipeline**:
1. Validate `ELEVENLABS_AGENT_ID` is configured. Return 500 if missing.
2. Fetch today's scheduled showings via `getTodaysScheduledShowings(today)`.
3. **Idempotency check**: query `CallLog` for existing entries for today's showing IDs via `getExistingCallLogsForDate()`. Skip any already-processed showings.
4. Normalize client phone numbers to E.164 format via `normalizePhoneE164()`. Skip clients with no valid phone.
5. **Pre-call audit trail**: create a `CallLog` record with status `PENDING` before making the API call. Unique constraint violations indicate the showing was already processed (skip).
6. Initiate ElevenLabs outbound call via `initiateOutboundCall()` with dynamic variables:
   - `customer_name`, `customer_email`, `customer_phone`
   - `property_address`
   - `showing_time` (formatted in Prague timezone), `showing_date`
   - `system_time` (ISO string)
7. Update `CallLog` status to `INITIATED` (with `elevenLabsCallId`) on success, or `FAILED` (with error message, capped at 500 chars) on failure.

**Response**: `{ success, message, totalShowings, callsInitiated, callsSkipped, callsFailed, details }`

### GET /api/cron/weekly-report -- Executive Report

**File**: `app/api/cron/weekly-report/route.ts`
**Schedule**: `0 7 * * 1` (7:00 AM UTC, Monday only -- equates to 9:00 CEST / 8:00 CET)
**maxDuration**: 120 seconds

**Pipeline**:
1. Load the `AutomationConfig` record for key `"weekly_executive_report"` via `getAutomationConfig()`.
2. If the config does not exist or `isActive` is false, return `{ success: true, message: "Automation is paused" }`.
3. Delegate to `generateExecutiveReport()` with the config's `recipientEmail`, trigger `"cron"`, and `slideCount: 5`.

**Response**: `{ runId, success, error? }`

---

## 7. Export System

The export system uses a token-based pattern to avoid embedding large binary payloads in chat messages. The flow:

```
Tool generates data --> POST /api/export/{format} --> server builds file, stores in /tmp --> returns { token, filename }
Frontend receives token --> user clicks download --> GET /api/export/{format}?token=xxx --> file download
```

### PPTX Generation

**File**: `lib/export/pptx.ts`
**Library**: PptxGenJS

The `buildPptxBuffer(slides: SlideData[])` function generates a widescreen (16:9) PPTX with a dark theme.

**SlideData interface**:

```typescript
interface SlideData {
  title: string
  subtitle?: string
  metrics?: SlideMetric[]       // Rendered as a card grid (up to 4 columns)
  tableHeaders?: string[]       // Rendered as a styled data table
  tableRows?: string[][]
  bullets?: string[]            // Rendered as bullet list
}

interface SlideMetric {
  label: string
  value: string | number
  trend?: string                // e.g., "+12%" -- colored green/red
}
```

**Theme colors**:
- Background: `#1a1a2e` (dark navy)
- Accent: `#f59e0b` (amber) -- top stripe on every slide
- Text: `#e2e8f0` (light gray)
- Positive trend: `#34d399` (emerald)
- Negative trend: `#f87171` (red)

Each slide includes an amber accent bar at top, title/subtitle, optional metric cards, optional table, optional bullets, and a branded footer.

**PPTX route** (`app/api/export/pptx/route.ts`):
- **POST**: accepts `{ slides: SlideData[], filename?: string }`, builds buffer, stores via `storePptx()`, returns `{ token, filename }`.
- **GET**: accepts `?token=xxx&filename=yyy`, retrieves buffer via `getPptx()`, returns with Content-Type `application/vnd.openxmlformats-officedocument.presentationml.presentation`.

### PDF Generation

**File**: `lib/export/pdf.ts`
**Library**: PDFKit (server-only, configured in `next.config` as `serverExternalPackages`)

Two public functions:

- `buildReportPdf(title, markdown)` -- parses markdown into blocks (headings, paragraphs, bullets, numbered lists, blockquotes, tables, horizontal rules) and renders them with custom typography.
- `buildTablePdf(title, headers, rows)` -- renders tabular data. Automatically switches to landscape layout when rows have more than 5 columns.

**Custom fonts**: Syne-Bold (headings), Outfit-Regular/Medium/Light (body text), loaded from `lib/export/fonts/`.

**Design**: Light background with amber accent stripe at top, alternating row backgrounds in tables, auto-pagination with continuation headers and page number footers.

**PDF route** (`app/api/export/pdf/route.ts`):
- **POST**: accepts `{ type: "report"|"table", title, markdown?, headers?, rows? }`. Validates required fields per type, generates PDF, stores via `storeFile()`, returns `{ token, filename }`. Filenames are timestamped via `buildTimestampedFilename()`.
- **GET**: accepts `?token=xxx&filename=yyy`, retrieves buffer, returns with Content-Type `application/pdf`.

### CSV Export

CSV files are generated client-side in the browser (not via API). They use a UTF-8 BOM to ensure correct character encoding when opened in Excel.

### Token-Based File Storage

**Files**: `lib/export/file-store.ts`, `lib/export/pptx-store.ts`

The generic file store (`file-store.ts`) provides:

```typescript
storeFile(buffer: Buffer, prefix: string): string   // Returns a UUID token
getFile(token: string, prefix: string): Buffer | null
```

Files are written to the OS temp directory (`os.tmpdir()`) with a sanitized token-based filename. Each file has an accompanying `.json` metadata file containing the expiration timestamp. Files expire after **10 minutes** (`TTL_MS = 10 * 60 * 1000`). Expired files are deleted on access.

The PPTX store (`pptx-store.ts`) is a thin wrapper that delegates to the generic store with the prefix `"pptx-"`.

Since files live on the filesystem of a serverless function instance, they are lost on cold start. This is acceptable for the demo use case.

### Presentation Email

**File**: `app/api/export/pptx/send-email/route.ts`

- **POST**: accepts `{ to, token, filename? }`.
- Retrieves the PPTX buffer by token.
- Sends via `sendEmailWithAttachment()` from `lib/google/gmail.ts` with a Czech email template.
- Returns `{ success, messageId }`.

### Email Approval

**File**: `app/api/email/approve/route.ts`

- **POST**: accepts `{ to, subject, bodyHtml }` validated with Zod.
- Saves the email as a Gmail draft via `saveDraft()` (never auto-sends).
- Returns `{ draftId, savedAt }`.

---

## 8. Executive Report Automation

**File**: `lib/executive-report/generate.ts`

The `generateExecutiveReport()` function orchestrates the full pipeline for automated weekly executive reports.

### Inputs

```typescript
{
  recipientEmail: string
  trigger: "cron" | "manual"
  slideCount?: number    // Defaults to 5
}
```

### Pipeline

1. **Create audit record** -- `createReportRun()` inserts a row in the `ReportRun` table with the trigger type and recipient.

2. **Data collection** -- three queries run in parallel via `Promise.all()`:
   - `fetchKpiData(8)` -- weekly KPI reports for the last 8 weeks (leads, clients, deals, revenue, with trend calculations comparing first/second half).
   - `fetchTimelineData(6)` -- lead-to-sale conversion timeline for the last 6 months.
   - `fetchRenoData()` -- properties missing renovation data, grouped by district.

3. **Slide generation** -- `buildSlidePool()` produces a pool of up to 8 slides:
   - Slide 1: KPI overview with 4 metric cards (leads, clients, deals, revenue with trends)
   - Slide 2: Leads vs sales timeline table with conversion metrics
   - Slide 3: Operational findings (missing renovation data) or key recommendations
   - Slide 4: Weekly KPI detail table (last 8 weeks)
   - Slide 5: Conversion analysis with industry benchmark comparison
   - Slide 6: Revenue trend table with per-deal averages
   - Slide 7: Properties requiring attention or pipeline health metrics
   - Slide 8: Action plan with prioritized recommendations based on data
   The first `slideCount` slides from the pool are selected.

4. **PPTX build** -- `buildPptxBuffer(slides)` generates the binary file.

5. **Email construction** -- `buildEmailHtml()` generates an HTML email body with a dark-themed card layout showing KPI summaries with colored trend arrows (green up, red down).

6. **Email delivery** -- `sendEmailWithAttachment()` sends the email with the PPTX attached. The attachment filename is timestamped (e.g., `executive-report-2026-03-26.pptx`).

7. **Audit update** -- on success, `updateReportRun()` sets status to `SUCCESS` with slide count and finish timestamp. On failure, sets `FAILED` with the error message (capped at 500 chars).

### Return Value

```typescript
{ runId: number; success: boolean; error?: string }
```

---

## 9. Data Query Layer

**Directory**: `lib/db/queries/` (14 files)

Each file corresponds to a domain entity or concern:

| File | Domain |
|------|--------|
| `clients.ts` | Client CRUD, quarterly/yearly queries, segment aggregation |
| `leads.ts` | Lead CRUD, sales timeline, conversion analytics |
| `properties.ts` | Property CRUD, lifecycle queries, missing renovation data |
| `deals.ts` | Deal CRUD, revenue aggregation |
| `showings.ts` | Showing CRUD, calendar integration, today's schedule |
| `monitoring.ts` | Monitoring job CRUD, result persistence, last run updates |
| `weekly-reports.ts` | Weekly KPI report retrieval |
| `investors.ts` | Investor portfolio aggregation, profitability calculations |
| `renovations.ts` | Active renovations, delay tracking, health metrics |
| `tasks.ts` | Agent task CRUD, overdue/due-soon queries |
| `documents.ts` | Property document queries, missing document scans |
| `health.ts` | Cross-model operational health scoring |
| `call-logs.ts` | Voice call audit trail, idempotency checks |
| `executive-reports.ts` | Automation config, report run audit records |

### Common Patterns

- **Typed return interfaces** -- each file defines row interfaces (e.g., `ClientRow`, `PropertyRow`) to decouple Prisma's generated types from the tool layer.
- **Pagination** -- list functions accept `limit` and `offset` parameters. Total counts are returned alongside items (e.g., `{ items, total }`), enabling the trimming system to record `_keyTotal` metadata.
- **Dynamic where clauses** -- filter parameters are optional; Prisma `where` conditions are built dynamically by only including defined fields.
- **Date range filtering** -- uses `gte`/`lt` with `Date` objects for temporal queries (quarters, months, arbitrary ranges).
- **Czech label application** -- enum values (e.g., `APARTMENT`, `SCHEDULED`) are mapped to Czech labels in the query layer using lookup tables from `lib/constants/labels.ts`, not in tools.
- **Eager loading** -- Prisma `include` for related data (e.g., property with owner, deals, showings, documents) to avoid N+1 queries.
- **Aggregation** -- `health.ts` runs complex cross-model queries combining properties, leads, deals, tasks, and showings to compute operational health scores.

---

## 10. Agent Run Logging

**File**: `lib/agent/run-logger.ts`

The `logAgentRun()` function persists agent interaction metadata to the `AgentRun` database table.

### Invocation Pattern

Called in the `onFinish` callback of `streamText()` as fire-and-forget:

```typescript
logAgentRun({
  sessionId: sessionId ?? "anonymous",
  userQuery,
  toolsCalledJson: toolCallLog,
  outputSummary: text?.slice(0, 500) ?? null,
}).catch(console.error)
```

The `.catch(console.error)` ensures logging failures never block the stream response or propagate errors to the client.

### Logged Fields

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Client-provided session identifier, or `"anonymous"` |
| `userQuery` | string | The user's message, capped at 1000 characters |
| `toolsCalledJson` | JSON | Array of `ToolCallLog` objects with `toolName`, `params`, and `startedAt` |
| `outputSummary` | string or null | First 500 characters of the LLM's final text response |

### Retrieval

The `GET /api/agent-runs` endpoint (`app/api/agent-runs/route.ts`) returns recent runs:
- **Query parameter**: `limit` (integer, max 50, default 20).
- **Response**: JSON array of run records ordered by `createdAt` descending, each containing `id`, `sessionId`, `userQuery`, `toolsCalledJson`, `outputSummary`, and `createdAt`.

### Explainability

**File**: `lib/agent/explainability.ts`

The `buildExplainability()` function constructs an `ExplainabilityData` object from the tool call log:
- **toolsUsed** -- tool name, Czech label, sanitized params (sensitive keys like `token`, `secret`, `draftId` are excluded; long strings are truncated).
- **dataSources** -- deduplicated list of data sources per tool (e.g., `"PostgreSQL: clients"`, `"Google Calendar API"`).
- **recordCounts** -- map of tool name to record count from results.
- **filters** -- extracted filter parameters in Czech (e.g., `"Rok": "2026"`, `"Obvod": "Praha 5"`).
- **timestamp** -- ISO string.

This data is appended as a message annotation on the SSE stream and rendered in the frontend Logs tab.

---

## 11. n8n Webhook

**File**: `app/api/n8n-webhook/route.ts`

Receives monitoring results pushed from external n8n automation workflows.

- **Authentication**: `X-Webhook-Secret` header validated against `N8N_WEBHOOK_SECRET` env var.
- **Request body**: `{ jobId: number, results: Array<{ source, title, url, price?, district?, disposition? }> }`.
- **Actions**: persists results via `createMonitoringResults()`, updates job's `lastRunAt` via `updateJobLastRun()`.
- **Response**: `{ success, inserted, jobId }`.

---

## See Also

- [Architecture](./architecture.md) -- overall system design and request flow
- [Tools](./tools.md) -- all tool definitions and categories
- [Database](./database.md) -- Prisma schema and data model
- [Integrations](./integrations.md) -- Google Calendar/Gmail, ElevenLabs, Twilio, scrapers
- [Frontend](./frontend.md) -- React components, chat UI, result panel
- [Deployment](./deployment.md) -- environment variables and Vercel configuration
