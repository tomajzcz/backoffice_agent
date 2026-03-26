# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Chat Panel   │  │  Results Panel                           │ │
│  │  (400px)      │  │  ┌─────┬──────┬──────┬───────┬───────┐  │ │
│  │               │  │  │Odpov│ Data │ Graf │Zpráva │ Email │  │ │
│  │  MessageList  │  │  └─────┴──────┴──────┴───────┴───────┘  │ │
│  │  ChatInput    │  │  Auto-switches based on toolName         │ │
│  │  SuggestedPr. │  │                                          │ │
│  └──────┬───────┘  └─────────────────────────────┬────────────┘ │
│         │ useChat()                               │ useMemo()    │
│         └──────────────────┬──────────────────────┘              │
└────────────────────────────┼─────────────────────────────────────┘
                             │ POST /api/chat (SSE)
┌────────────────────────────┼─────────────────────────────────────┐
│  Server (Vercel Functions)  │                                     │
│                             ▼                                     │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  streamText()                                         │        │
│  │  Model: claude-sonnet-4-6                              │        │
│  │  System prompt: Czech, 188 lines                      │        │
│  │  Tools: 45 registered                                 │        │
│  │  Max steps: 10 per turn                               │        │
│  └──────┬────────────────────────┬──────────────────────┘        │
│         │ tool calls              │ onFinish                      │
│         ▼                         ▼                               │
│  ┌──────────────┐          ┌──────────────┐                      │
│  │  Tool Layer   │          │  Run Logger   │                     │
│  │  45 tools     │          │  (async)      │                     │
│  └──────┬───────┘          └──────────────┘                      │
│         │                                                         │
│  ┌──────┴────────┬──────────────┬──────────────┐                 │
│  ▼               ▼              ▼              ▼                  │
│  PostgreSQL   Google APIs   Scrapers       PptxGenJS              │
│  (Neon)       (Cal+Gmail)   (cheerio)      (export)              │
└──────────────────────────────────────────────────────────────────┘
```

## Request Flow (End-to-End)

1. **User types a message** in ChatInput (Czech natural language)
2. **`useChat` hook** (Vercel AI SDK) sends `POST /api/chat` with full message history + session ID
3. **Server receives request**, calls `trimMessageHistory()`:
   - Strips base64 data URLs (PPTX downloads)
   - Truncates markdown/HTML > 500 chars
   - Patches incomplete tool invocations to prevent SDK errors
4. **`streamText()`** invokes Claude claude-sonnet-4-6 with:
   - System prompt (Czech, from `lib/agent/prompts.ts`)
   - Trimmed message history
   - All 45 tools
   - `maxSteps: 10` (allows multi-tool chains)
5. **LLM decides which tools to call** based on user intent and system prompt guidance
6. **Tools execute server-side** — query DB, call Google APIs, run scrapers, generate files
7. **`onStepFinish`** captures tool call logs and record counts for explainability
8. **Results stream back** via SSE (Server-Sent Events) to the browser
9. **`onFinish`** fires asynchronously:
   - Builds explainability annotation via `buildExplainability()`
   - Appends annotation to `StreamData`
   - Logs agent run to DB (fire-and-forget)
10. **Frontend `useChat`** receives streamed messages with tool invocations
11. **`useMemo`** extracts `latestToolResult` from most recent `message.toolInvocations`
12. **ResultsPanel auto-switches tab** based on `toolName`:
    - Report/presentation tools → "Zpráva" tab
    - Email tools → "Email" tab
    - CRUD/data tools → "Data" tab
    - Analytics/chart tools → "Graf" tab

## Tool Orchestration

The LLM can chain up to 10 tool calls per turn (`maxSteps: 10`). This enables complex workflows:

**Morning briefing** (user: "Jaký je stav operativy?"):
1. `scanOperationalHealth` → health score + issues
2. `scanRenovationHealth` → renovation delays
3. `scanOverdueTasks` → overdue tasks
4. Agent synthesizes all results into a briefing

**Showing booking** (user: "Naplánuj prohlídku na Vinohradech"):
1. `getPropertyDetails` → property info
2. `getCalendarAvailability` → free slots
3. Agent suggests times to user
4. `createShowing` → create showing record
5. `createCalendarEvent` → sync to Google Calendar
6. `createGmailDraft` → draft invitation email

## Split-Screen Layout

| Left Panel (400px fixed) | Right Panel (flex) |
|---------------------------|-------------------|
| System status indicator | Tab bar (6 tabs) |
| Navigation (Správa, Automatizace) | Context-sensitive header |
| Message list (scrollable) | Tab content area |
| Suggested prompts (empty state) | Auto-switches on tool result |
| Chat input + mic button | |

The layout is `flex h-screen overflow-hidden` — both panels scroll independently.

## Three Application Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Chat** | `/` | Main AI interface — split-screen with chat + results |
| **Správa** (Data Management) | `/sprava` | Direct CRUD UI for all entities — tables, forms, filters |
| **Automatizace** (Dashboard) | `/dashboard` | Monitoring jobs + reminder call logs |

## Design Decisions

### Tools instead of raw LLM output
The LLM never generates data directly. Every data point comes from a tool that queries the real database or API. This ensures accuracy and auditability — the explainability panel shows exactly which tools were called and what data was accessed.

### Typed results with discriminant
Every tool result includes `toolName` as a discriminant. The frontend uses this single field to determine which tab to show, which chart to render, and which header summary to display. This avoids fragile string matching across the codebase.

### Split UI (chat + results)
Separating conversation from results means the user can keep reading the agent's explanation while reviewing a chart or table. It also enables richer visualizations (Recharts, PPTX previews) that wouldn't fit inline in a chat bubble.

### Gmail drafts only
The agent creates email drafts, never sends them. The user must explicitly approve via the Email tab. This is a safety constraint — an AI agent should not send external communications without human review.

### Context window management
`trimMessageHistory()` strips base64 data URLs and truncates long content before sending to the LLM. Without this, a single PPTX generation would consume most of the context window on the next turn. Incomplete tool invocations are also patched to prevent `AI_MessageConversionError`.

### Charts from structured data
Charts are rendered by Recharts from typed `chartData` arrays — never from LLM-generated images or SVG. This ensures consistent styling, interactivity (tooltips, legends), and deterministic output.

### Fire-and-forget logging
Agent run logging (`logAgentRun`) happens asynchronously after the stream ends. It never blocks or delays the response. If logging fails, it's caught silently — observability should not impact user experience.

## Streaming

The chat endpoint uses Vercel AI SDK's `streamText()` which produces Server-Sent Events:
- `maxDuration: 120` seconds (requires Vercel Pro plan)
- Text tokens stream incrementally
- Tool results arrive as complete objects in `toolInvocations`
- Explainability data is appended as a message annotation via `StreamData`

## Limitations

- **In-memory file storage**: PPTX and PDF tokens are stored in server memory. On Vercel's serverless architecture, this means files can be lost on cold starts. Suitable for demo, not production.
- **No authentication**: The app has no user authentication. Any visitor can use all features.
- **Single-user calendar**: Google Calendar/Gmail uses one fixed refresh token — not multi-tenant.
- **Scraper fragility**: Web scrapers parse HTML structure that can change without notice.
- **Context window**: With 10 tool steps, complex chains can approach the context limit.
- **No real-time updates**: Dashboard and data pages require manual refresh.

## Future Improvements

- Persistent file storage (S3/R2) instead of in-memory tokens
- User authentication with role-based access
- Multi-tenant Google OAuth per user
- WebSocket for real-time dashboard updates
- Tool-level streaming for long operations (progress indicators)
- Voice assistant integration (ElevenLabs conversational AI in-browser)
- Investor portal with self-service dashboards

## See Also

- [Backend](./backend.md) — API routes and streaming implementation
- [Frontend](./frontend.md) — component structure and rendering
- [Tools](./tools.md) — all 45 tools documented
- [Database](./database.md) — data model
- [Integrations](./integrations.md) — external services
