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
- Left panel: Chat (streaming via Vercel AI SDK + Anthropic claude-sonnet-4-6)
- Right panel: Result tabs (Answer, Chart, Data, Report, Email, Logs) — auto-switches based on tool type

**Request flow**: User message → `POST /api/chat` → `streamText()` with 35 tools (max 10 steps per turn) → SSE response → frontend renders tool results in appropriate tab.

**Key architectural decisions**:
- Charts rendered by Recharts from structured `chartData` arrays returned by tools — never LLM-generated images
- Gmail creates drafts only (never auto-sends) for safety
- Message history is trimmed (base64 stripped, reports truncated) to manage context window across turns
- Tools return strongly-typed results matching `AgentToolResult` union in `types/agent.ts`
- n8n is used only for scheduler/workflow, not as the main UI

## Key Paths

| Area | Path |
|------|------|
| Chat streaming endpoint | `app/api/chat/route.ts` |
| All 35 tool definitions | `lib/agent/tools/` (each tool is its own file, re-exported from `index.ts`) |
| System prompt (Czech) | `lib/agent/prompts.ts` |
| DB schema (11 models, 8 enums) | `prisma/schema.prisma` |
| DB query functions | `lib/db/queries/` (one file per entity) |
| Seed script (faker) | `prisma/seed.ts` |
| Tool result types (40+) | `types/agent.ts` |
| Chart components | `components/charts/` |
| Results panel + tabs | `components/results/ResultsPanel.tsx` |
| Google OAuth setup | `lib/google/auth.ts` |
| Czech enum labels & colors | `lib/constants/labels.ts` |
| PPTX generation | `lib/export/pptx.ts` |
| Web scraping (sreality, bezrealitky) | `lib/scraper/` |
| Data management UI | `app/sprava/` |
| Monitoring dashboard UI | `app/dashboard/` |
| Vercel cron config | `vercel.json` (monitoring at 5 AM weekdays) |

## Adding a New Tool

1. Create `lib/agent/tools/myNewTool.ts` with Zod schema for parameters and a typed result
2. Define the tool using Vercel AI SDK's `tool()` function with `parameters` (Zod) and `execute` async function
3. Add result type to `types/agent.ts` and include in `AgentToolResult` union
4. Export from `lib/agent/tools/index.ts`
5. If the tool returns chart data, add/reuse a chart component in `components/charts/`
6. Update `components/results/ResultsPanel.tsx` tab switching logic if new result type needs special rendering
7. Update system prompt in `lib/agent/prompts.ts` if the agent needs guidance on when/how to use the tool

## Tool Categories (35 total)

- **Analytics** (5): queryNewClients, queryLeadsSalesTimeline, queryWeeklyKPIs, scanMissingRenovationData, generateReport
- **Google** (6): getCalendarAvailability, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, listCalendarEvents, createGmailDraft
- **Export** (2): generatePresentation (PPTX, 1–10 slides from pool of 10), sendPresentationEmail
- **Monitoring** (4): listScheduledJobs, createMonitoringJob, triggerMonitoringJob, getMonitoringResults
- **CRUD** (16): list/create/update for Properties, Clients, Leads, Deals, Showings
- **Other** (2): createAgentTask, getPropertyDetails

## Database

PostgreSQL via Prisma ORM. Path alias `@/*` maps to project root.

Seed data volumes: 45 clients, 150 leads, 55 properties (15 intentionally missing renovation data), 22 deals, 40 showings, 18 weekly reports, 2 scheduled monitoring jobs.

Prisma client singleton: `lib/db/prisma.ts`.

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
```

## Deployment

Vercel auto-deploys from `main` branch. DB on Neon. Vercel cron triggers `/api/cron/monitoring` at 5 AM Mon–Fri.

## Success Criteria

- End-to-end functionality with real tools (no fake responses)
- UI feels like a product, not a chatbot demo
- Charts and reports are real outputs from structured data
- Google integrations (Calendar + Gmail) working
- PPTX export functional
- Monitoring workflows connected via n8n
