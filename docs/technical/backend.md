# Backend

Next.js 15 App Router with 9 API routes. All routes are in `app/api/`.

## API Routes

### `POST /api/chat` — Main Chat Endpoint

**File**: `app/api/chat/route.ts`

The core of the application. Accepts user messages, runs the LLM with tools, and streams back results.

**Request**: `{ messages: Message[], sessionId?: string }`
**Response**: Server-Sent Events (SSE) stream

**Flow**:
1. Parse messages and session ID from request body
2. `trimMessageHistory(messages)` — strip base64, truncate markdown/HTML, patch incomplete tool invocations
3. `streamText()` with:
   - Model: `anthropic("claude-sonnet-4-6")`
   - System prompt: `getSystemPrompt()` (Czech, dynamic date)
   - Tools: `agentTools` (all 45)
   - `maxSteps: 10`
4. `onStepFinish` — log tool calls, capture record counts
5. `onFinish` — build explainability annotation, close stream, log agent run (async)
6. Return `result.toDataStreamResponse({ data: streamData })`

**Config**: `maxDuration = 120` (Vercel Pro required)

### `GET /api/agent-runs` — Run History

**File**: `app/api/agent-runs/route.ts`

Returns paginated agent run logs. Used by the "Logy" tab.

**Query params**: `limit` (max 50, default 20)
**Returns**: `{ runs: AgentRun[] }`

### `GET /api/cron/monitoring` — Market Monitoring Cron

**File**: `app/api/cron/monitoring/route.ts`

Vercel cron job running at **5 AM weekdays**. Authenticated via `CRON_SECRET` bearer token.

**Flow**:
1. Load all active `ScheduledJob` records
2. For each job, parse `configJson` and run scrapers (sreality + bezrealitky)
3. Deduplicate results by URL
4. Filter out already-seen listings via `filterNewListings()`
5. Save new `MonitoringResult` records
6. Update `lastRunAt` on job
7. Send email notification if `notifyEmail` is set

### `GET /api/cron/daily-reminder-calls` — Voice Reminders

**File**: `app/api/cron/daily-reminder-calls/route.ts`

Vercel cron job running at **5 AM daily**. Initiates ElevenLabs voice calls for today's scheduled showings.

**Flow**:
1. Find all showings scheduled for today with status `SCHEDULED`
2. Check `CallLog` for existing calls today (idempotency)
3. Normalize Czech phone numbers to E.164 format
4. Initiate ElevenLabs outbound call with dynamic variables (customer name, property, time)
5. Create `CallLog` record with status

### `POST /api/export/pptx` + `GET /api/export/pptx`

**File**: `app/api/export/pptx/route.ts`

Token-based PPTX generation:
- **POST**: Receives slide data, builds PPTX via PptxGenJS, stores buffer in memory, returns `{ token }`
- **GET**: Retrieves PPTX by token, returns as file download

### `POST /api/export/pptx/send-email`

**File**: `app/api/export/pptx/send-email/route.ts`

Sends a generated PPTX as a Gmail attachment. Retrieves PPTX by token, constructs multipart/mixed MIME message, creates Gmail draft.

### `POST /api/export/pdf` + `GET /api/export/pdf`

**File**: `app/api/export/pdf/route.ts`

Token-based PDF generation using PDFKit:
- **POST**: Receives report data or table data, generates PDF, stores, returns `{ token }`
- **GET**: Retrieves PDF by token as file download

### `POST /api/email/approve`

**File**: `app/api/email/approve/route.ts`

Approves an email draft. The agent creates drafts via `createGmailDraft` tool — the user reviews in the Email tab and approves here.

### `POST /api/n8n-webhook`

**File**: `app/api/n8n-webhook/route.ts`

Receives monitoring results from external n8n workflows. Authenticated via `X-Webhook-Secret` header. Saves results to `MonitoringResult` table and updates job's `lastRunAt`.

## System Prompt

**File**: `lib/agent/prompts.ts`

The system prompt is ~188 lines of Czech text that defines the agent's behavior:

- **Identity**: "Pepa's back office AI assistant" for a Prague real estate firm
- **Date**: Dynamic injection of current date in Czech locale
- **Tool catalog**: Every tool described with when and how to use it
- **Workflows** (8 scripted patterns):
  1. **Showing booking**: detail → availability → offer slots → create → confirm
  2. **Email composition**: context → draft → user review → approval
  3. **Presentation**: data → report → slides → email
  4. **Monitoring**: list jobs → check results → analyze → prioritize
  5. **Morning briefing**: health scan → renovation scan → overdue tasks → summary
  6. **Renovation management**: active list → detail → health check → tasks
  7. **Investor reporting**: overview → profitability → report → presentation
  8. **Property check**: details → documents → missing docs → tasks
- **Rules**: Never invent data, always use tools, respond in Czech

## Message History Trimming

`trimMessageHistory()` in the chat route handles context window management:

| Content Type | Action |
|--------------|--------|
| Base64 data URLs (PPTX, images) | Replace with `"[file already delivered to client]"` |
| Markdown > 500 chars (reports) | Truncate with `"...[truncated for context window]"` |
| HTML > 500 chars (email bodies) | Truncate with `"...[truncated]"` |
| Incomplete tool invocations | Patch with error result to prevent SDK crash |

This ensures multi-turn conversations don't blow up the context window after generating large outputs.

## Export System

Token-based pattern for file downloads:

```
Client → POST /api/export/pptx (slide data) → Server generates file → stores in memory → returns token
Client → GET /api/export/pptx?token=xxx → Server retrieves file → returns as download
```

**PPTX** (`lib/export/pptx.ts`): PptxGenJS with dark theme (bg: #1a1a2e, accent: #f59e0b). Pool of 10 slide types — user selects 1–10 slides.

**PDF** (`lib/export/pdf.ts`): PDFKit with Roboto font. Two layouts: report (markdown-style) and table (data export).

**CSV** (`lib/export/csv.ts`): Client-side generation with BOM for Czech UTF-8 in Excel. Configurable columns per entity in `csv-configs.ts`.

**File storage** (`lib/export/file-store.ts`): In-memory Map with token keys. Files are lost on serverless cold start — adequate for demo use.

## Data Query Layer

`lib/db/queries/` contains 13 files, one per domain. Common patterns:

- **Pagination**: `limit`/`offset` parameters, `hasMore` computed as `count > offset + limit`
- **Date filtering**: `gte`/`lt` with `Date` objects for range queries
- **Enum filtering**: Prisma's type-safe enum filter (`{ status: { in: [...] } }`)
- **Aggregation**: `health.ts` runs complex cross-model queries for operational scoring
- **Joins**: Eager loading via Prisma `include` (e.g., property with deals, showings, documents)

## See Also

- [Architecture](./architecture.md) — overall request flow
- [Tools](./tools.md) — all 45 tool definitions
- [Database](./database.md) — schema and query layer
- [Integrations](./integrations.md) — Google, ElevenLabs, scrapers
- [Deployment](./deployment.md) — environment variables and Vercel config
