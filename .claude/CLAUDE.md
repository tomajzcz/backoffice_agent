# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Back Office Operations Agent for a fictional real estate firm in Prague. AI-powered chat UI that helps "Pepa" (back office manager) with analytics, data quality scanning, report generation, Google Calendar/Gmail integration, and market monitoring. Competition project for a job application — the deliverable is a deployed Vercel URL + demo video.

Language context: UI and agent responses are in **Czech**. System prompt, labels, and seed data use Czech text.

## Commands

```bash
npm run dev              # Start dev server (Next.js)
npm run build            # Production build
npm run lint             # ESLint
npm run db:generate      # Prisma generate client
npm run db:migrate       # Prisma migrate dev
npm run db:seed          # Seed database (tsx prisma/seed.ts)
npm run db:reset         # Reset DB + re-seed (destructive)
npm run db:studio        # Prisma Studio GUI
```

After changing `prisma/schema.prisma`, run `db:migrate` then `db:generate`.

## Architecture

**Next.js 15 App Router** with split-screen layout:
- Left panel: Chat (streaming via Vercel AI SDK `ai@4.3.16` + Anthropic claude-sonnet-4-6)
- Right panel: Result tabs (Answer, Chart, Data, Report, Email, Logs) — auto-switches based on tool type

### Request Flow

User message → `POST /api/chat` → tool selector filters tools by Czech keywords → `streamText()` with filtered tools (max 5 steps) → SSE response → frontend auto-switches result tab.

### Tool Selector (`lib/agent/tool-selector.ts`)

Reduces context by only sending relevant tools per message. Scans user input for Czech keywords (klient, nemovitost, prohlídka, etc.), maps to tool groups (CORE, ANALYTICS, CRUD_PROPERTIES, EMAIL_EXPORT, etc.), always includes CORE group. Falls back to all tools when no keywords match.

### Message History Trimming (`app/api/chat/route.ts`)

Three-layer strategy to stay under context limits:
1. **Hard cap**: Last 20 messages only
2. **Payload stripping**: Base64 data URLs → `"[file already delivered]"`, large markdown/HTML → 500 char truncation, chart data arrays → removed entirely
3. **Array capping**: Large result arrays (properties, leads) → 3 items + `_keyTotal` count metadata

Handles both AI SDK v4's `toolInvocations` format and legacy `content` array with `tool-result` parts.

### Explainability

`buildExplainability()` appends audit metadata (tools used, data sources, filters, record counts) as message annotations. Shown in the "Logs" tab. Agent runs logged async via `logAgentRun()` to `AgentRun` table (fire-and-forget, never blocks response).

### Key Architectural Decisions

- Charts rendered by Recharts from structured `chartData` arrays returned by tools — never LLM-generated images
- Gmail creates drafts only (never auto-sends) for safety
- Tools return strongly-typed results matching `AgentToolResult` discriminated union in `types/agent.ts`
- Error resilience: SMS/calendar failures in tool execution don't block the primary operation (captured as `smsError`, `calendarError` fields in results)
- No authentication layer — assumes trusted internal environment
- `serverExternalPackages: ["pdfkit"]` in next.config (pdfkit must run server-side)

## Key Paths

| Area | Path |
|------|------|
| Chat streaming endpoint | `app/api/chat/route.ts` |
| Tool definitions (45 tools) | `lib/agent/tools/` (each tool = own file, re-exported from `index.ts`) |
| Tool selector (keyword routing) | `lib/agent/tool-selector.ts` |
| System prompt (Czech) | `lib/agent/prompts.ts` |
| DB schema | `prisma/schema.prisma` |
| DB query functions | `lib/db/queries/` (one file per entity) |
| Seed script (faker) | `prisma/seed.ts` |
| Tool result types (40+) | `types/agent.ts` |
| Chart components | `components/charts/` |
| Results panel + tabs | `components/results/ResultsPanel.tsx` |
| Google OAuth / Calendar / Gmail | `lib/google/auth.ts`, `calendar.ts`, `gmail.ts` |
| Czech enum labels & colors | `lib/constants/labels.ts` |
| PPTX generation | `lib/export/pptx.ts` |
| PDF generation | `lib/export/pdf.ts` |
| File download tokens | `lib/export/file-store.ts`, `pptx-store.ts` |
| Web scraping (sreality, bezrealitky) | `lib/scraper/` |
| Twilio SMS integration | `lib/integrations/twilio.ts` |
| ElevenLabs voice calls | `lib/integrations/elevenlabs.ts` |
| Data management UI | `app/sprava/` |
| Monitoring dashboard | `app/dashboard/` |

## Adding a New Tool

1. Create `lib/agent/tools/myNewTool.ts` — use `tool()` from `ai`, Zod for `parameters`, async `execute` returning a typed result object with `toolName`, `chartType`, and `chartData`
2. Add result type to `types/agent.ts` and include in `AgentToolResult` union
3. Export from `lib/agent/tools/index.ts`
4. Add Czech keyword mappings in `lib/agent/tool-selector.ts` (register in `TOOL_GROUPS` and `KEYWORD_GROUPS`)
5. If chart data, add/reuse a chart component in `components/charts/`
6. Update `components/results/ResultsPanel.tsx` tab-switching logic if new result type needs special rendering
7. Update system prompt in `lib/agent/prompts.ts` if agent needs guidance on when/how to use the tool
8. If result contains large arrays, ensure trimming in `trimToolResult()` handles them

## Tool Categories (45 total)

- **Analytics / queries** (5): queryNewClients, queryLeadsSalesTimeline, queryWeeklyKPIs, queryActiveRenovations, queryPropertiesByLifecycle
- **Health & data-quality scans** (5): scanOperationalHealth, scanRenovationHealth, scanOverdueTasks, scanMissingRenovationData, scanMissingDocuments
- **Investor / profitability** (2): getInvestorOverview, calculatePropertyProfitability
- **Property detail** (3): getPropertyDetails, getPropertyDocuments, getRenovationDetail
- **Google** (6): getCalendarAvailability, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, listCalendarEvents, createGmailDraft
- **Export & reporting** (3): generateReport, generatePresentation (PPTX, 1–10 slides from pool of 10), sendPresentationEmail
- **Monitoring** (5): listScheduledJobs, createMonitoringJob, triggerMonitoringJob, getMonitoringResults, analyzeNewListings
- **CRUD** (15): list/create/update for Properties, Clients, Leads, Deals, Showings (no delete)
- **Other** (1): createAgentTask

When this list drifts from `lib/agent/tools/`, the directory is the source of truth.

## Integrations

**Google Calendar**: OAuth2 client cached as global singleton. Free/busy queries for slot finding. Working hours 9 AM–6 PM, weekends skipped. Events store `googleCalendarEventId` on Showing records.

**Gmail**: Draft-only (never sends). MIME multipart for attachments (PPTX emails). Base64-encoded UTF-8 subject lines.

**Twilio SMS**: Sends confirmations on showing creation/update/cancellation. E.164 phone format. Czech message templates. Failures captured in result, don't block operation.

**ElevenLabs**: Outbound AI voice calls for showing reminders. Triggered by daily cron, not by agent tools directly.

## Database

PostgreSQL via Prisma ORM. `@/*` path alias maps to project root. Prisma client singleton in `lib/db/prisma.ts` (global cache prevents multiple clients in dev).

**Query pattern**: One file per entity in `lib/db/queries/`. Query functions return typed interfaces (e.g., `ClientRow`, `PropertyRow`). Czech label lookups applied in query layer, not tools. Prisma `where` conditions built dynamically from tool parameters.

Seed data: 45 clients, 150 leads, 55 properties (15 intentionally missing renovation data), 22 deals, 40 showings, 18 weekly reports, 2 scheduled monitoring jobs.

## Cron Jobs (Vercel)

All validate `CRON_SECRET` via Authorization header (Vercel-injected).

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| Monitoring | 5 AM Mon–Fri | `/api/cron/monitoring` | Web scraping (Sreality, Bezrealitky), dedup, DB persistence |
| Reminder calls | 5 AM daily | `/api/cron/daily-reminder-calls` | ElevenLabs outbound calls for today's showings |
| Weekly report | 7 AM Monday | `/api/cron/weekly-report` | Executive PPTX report with KPI slides + email |

## Routes

**Pages**: `/` (chat), `/dashboard` (monitoring + automation), `/sprava` (CRUD management), `/sprava/rekonstrukce/[id]` (renovation detail)

**API**: `/api/chat`, `/api/cron/*`, `/api/agent-runs`, `/api/email`, `/api/export` (file downloads), `/api/n8n-webhook`

## Export System

PPTX and PDF generated server-side. Output stored temporarily via token-based file store (`lib/export/file-store.ts`, `pptx-store.ts`). Download tokens prevent data URLs from bloating chat history (trimmed to `"[file already delivered]"`).

## Environment Variables

```
DATABASE_URL=           # Postgres (Neon)
DIRECT_URL=             # Direct DB connection (migrations)
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
N8N_BASE_URL=           # Optional, for monitoring webhooks
N8N_WEBHOOK_SECRET=     # Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=    # E.164 format (e.g., +420...)
CRON_SECRET=            # Required by /api/cron/* (Vercel-injected as Authorization header)
```

Cron schedules live in `vercel.json`, not in code.

## Deployment

Vercel auto-deploys from `main` branch. DB on Neon. TypeScript strict mode. Node 20 LTS.

`tsconfig.json` excludes `prisma/seed.ts` and `scripts/` from typechecking — those run via `tsx` and are not built.

No test runner is configured. There is no `npm test` and no test files in the repo; verify changes via `npm run lint`, `npm run build`, and manual checks against the dev server.
