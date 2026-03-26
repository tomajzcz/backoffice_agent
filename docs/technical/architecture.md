# System Architecture

Back Office Operations Agent -- an AI-powered assistant for a Prague-based real estate firm. This document describes the end-to-end system architecture, from user input to rendered result.

---

## 1. System Overview

The application is a **Next.js 15 App Router** project deployed on Vercel. It uses a split-screen layout: a chat panel on the left and a results panel on the right. The AI agent (Claude Sonnet 4.6 via Vercel AI SDK) receives Czech-language messages, selects and executes typed tools against a PostgreSQL database and external APIs, and streams structured results back to the frontend for rich visualization.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Chat Panel  │────>│ POST /api/chat│────>│  selectTools()   │────>│  streamText() │
│  (React)     │     │              │     │  keyword filter   │     │  Claude 4.6   │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────┬───────┘
                                                                         │
                    ┌──────────────┐     ┌─────────────────┐            │
                    │ Results Panel │<────│  SSE Response    │<───────────┘
                    │  (6 tabs)    │     │  + annotations   │     Tool calls:
                    └──────────────┘     └─────────────────┘     DB, Google, Twilio...
```

**Key numbers:**

| Metric | Value |
|--------|-------|
| Agent tools | 45 |
| Prisma models | 17 |
| Enums | 16 |
| API routes | 10 |
| Cron jobs | 3 |
| Tool groups (keyword selector) | 12 |
| Max tool-call steps per turn | 5 |
| Result tabs | 6 |

---

## 2. Request Flow (End-to-End)

Every user interaction follows the same pipeline. The numbered steps below trace a single message from input to rendered output.

1. **User types a Czech message** in the ChatPanel component.
2. **`useChat()` hook** (Vercel AI SDK) sends `POST /api/chat` with the full `messages` array and a `sessionId`.
3. **Server trims message history** -- keeps only the last 20 messages, strips base64 data URLs, truncates large markdown/HTML to 500 characters, removes `chartData` arrays entirely, and caps large result arrays to 3 items with a `_keyTotal` count.
4. **`selectTools()`** scans the latest user message for Czech keywords and maps them to relevant tool groups. Only matched tools (plus CORE) are sent to the LLM.
5. **`streamText()`** is called with:
   - Model: `claude-sonnet-4-6` (Anthropic provider)
   - System prompt: Czech-language role definition with workflow instructions (`lib/agent/prompts.ts`)
   - Filtered tool set from step 4
   - `maxSteps: 5` -- allows multi-tool chains within a single turn
   - `maxRetries: 1` -- fail-fast on transient errors
6. **LLM decides which tools to call** based on user intent and the system prompt's workflow guidance.
7. **Tools execute**: DB queries via Prisma, Google Calendar/Gmail API calls, Twilio SMS, web scraping triggers, PPTX/PDF generation, etc.
8. **`onStepFinish` callback** captures tool call logs (tool name, parameters, timestamp) and record counts from results for explainability.
9. **LLM may chain multiple tools** (up to 5 steps). Example: `getPropertyDetails` -> `getCalendarAvailability` -> `createShowing` -> `createCalendarEvent`.
10. **`onFinish` callback** builds explainability metadata via `buildExplainability()` and appends it as a `StreamData` message annotation. Agent run is logged asynchronously via `logAgentRun()` (fire-and-forget, never blocks the response).
11. **SSE stream** delivers the response to the frontend via `toDataStreamResponse()`.
12. **Frontend extracts `latestToolResult`** from the most recent assistant message's tool invocations and auto-switches the results panel tab based on `toolName`.

---

## 3. Tool Selection System

**File:** `lib/agent/tool-selector.ts`

With 45 tools, sending all tool definitions to the LLM on every turn would consume approximately 4,000+ tokens of context. The keyword-based tool selector reduces this cost and improves selection accuracy.

### How it works

1. The user's message is lowercased.
2. Each Czech keyword in `KEYWORD_GROUPS` (~60 keywords) is checked via `string.includes()`.
3. Matched keywords map to one or more tool groups.
4. The CORE group (`generateReport`, `createAgentTask`) is always included.
5. All tools from all matched groups are collected into the filtered set.
6. **Fallback:** If only CORE matched (no keyword hits), all 45 tools are sent -- the intent is unclear.

### Tool Groups (12)

| Group | Tools | Purpose |
|-------|-------|---------|
| CORE | generateReport, createAgentTask | Always included |
| ANALYTICS | queryNewClients, queryLeadsSalesTimeline, queryWeeklyKPIs, queryPropertiesByLifecycle, calculatePropertyProfitability, getInvestorOverview | Data analysis and KPIs |
| CALENDAR | getCalendarAvailability, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, listCalendarEvents | Google Calendar operations |
| EMAIL_EXPORT | createGmailDraft, sendPresentationEmail, generatePresentation | Email drafts and PPTX export |
| CRUD_PROPERTIES | listProperties, createProperty, updateProperty, getPropertyDetails, getPropertyDocuments | Property management |
| CRUD_CLIENTS | listClients, createClient, updateClient | Client management |
| CRUD_LEADS | listLeads, createLead, updateLead | Lead management |
| CRUD_DEALS | listDeals, createDeal, updateDeal | Deal management |
| CRUD_SHOWINGS | listShowings, createShowing, updateShowing | Showing management |
| MONITORING | listScheduledJobs, triggerMonitoringJob, getMonitoringResults, createMonitoringJob, analyzeNewListings | Market monitoring |
| RENOVATION | queryActiveRenovations, getRenovationDetail, scanRenovationHealth | Renovation tracking |
| DATA_QUALITY | scanMissingRenovationData, scanMissingDocuments, scanOperationalHealth, scanOverdueTasks | Data quality audits |

### Keyword examples

| Keyword | Matched Groups |
|---------|----------------|
| `klient` | CRUD_CLIENTS, ANALYTICS |
| `prohlid` | CRUD_SHOWINGS, CALENDAR |
| `briefing` | DATA_QUALITY, RENOVATION, ANALYTICS |
| `investor` | ANALYTICS, CRUD_PROPERTIES |
| `vytvor` | All CRUD groups |

---

## 4. Tool Orchestration

The `maxSteps: 5` configuration allows the LLM to chain multiple tool calls within a single conversational turn. Each step may invoke one or more tools, and the LLM receives results before deciding on the next step.

### Chain complexity examples

**Simple query (1 step):**
```
User: "Kolik mame klientu?"
  Step 1: listClients -> result
  LLM: "Mate 45 klientu..."
```

**Compound analysis (2-3 steps):**
```
User: "Ranni briefing"
  Step 1: scanOperationalHealth -> overall score + issues
  Step 2: scanRenovationHealth -> renovation health + delays
  Step 3: scanOverdueTasks -> overdue task list
  LLM: summary with key issues and recommendations
```

**Full workflow (4-5 steps):**
```
User: "Naplanuj prohlidku bytu na Vinohradech pro klienta Novaka"
  Step 1: getPropertyDetails -> property info
  Step 2: getCalendarAvailability -> free time slots
  Step 3: createShowing -> creates DB record + calendar event + SMS
  Step 4: (LLM summarizes result with calendar link and SMS status)
```

**Export workflow (3-4 steps):**
```
User: "Priprav prezentaci portfolia a posli ji na email"
  Step 1: getInvestorOverview -> portfolio data
  Step 2: generatePresentation -> PPTX file with download token
  Step 3: sendPresentationEmail -> sends PPTX via Gmail
  LLM: confirmation with email details
```

### Tool result structure

Every tool returns a strongly-typed result object (discriminated union in `types/agent.ts`) that includes:

- `toolName` -- string literal discriminant for type narrowing
- `chartType` -- `"bar"`, `"line"`, or `"none"` -- tells the frontend whether to render a chart
- `chartData` -- structured array for Recharts rendering (when `chartType` is not `"none"`)
- Domain-specific fields (counts, records, metadata)

---

## 5. Split-Screen Layout

The application uses a fixed split-screen layout with the chat panel on the left and the results panel on the right.

| Left Panel (ChatPanel, 400px) | Right Panel (ResultsPanel, flex-1) |
|------|------|
| Chat conversation history | Result visualization |
| Message input with speech support | 6 switchable tabs |
| Suggested prompts | Export buttons (PDF, CSV) |
| Loading indicators | Explainability metadata |

The left panel has a fixed width of 400px. The right panel fills the remaining viewport width via `flex-1`. Both panels scroll independently.

---

## 6. Result Tab Auto-Switching

When a new tool result arrives, the `ResultsPanel` component automatically switches to the most appropriate tab based on the `toolName` field.

| Tool Result | Target Tab |
|-------------|------------|
| `generateReport`, `generatePresentation` | Zprava (Report) |
| `createGmailDraft`, `prepareEmailDraft`, `sendPresentationEmail` | Email |
| `createAgentTask`, `getPropertyDetails`, `getPropertyDocuments`, all `list*`, `create*`, `update*`, `delete*`, calendar CRUD, `triggerMonitoringJob`, `getMonitoringResults`, `listScheduledJobs`, `getRenovationDetail` | Data |
| Analytics tools with `chartData` (`queryNewClients`, `queryLeadsSalesTimeline`, `queryWeeklyKPIs`, `queryPropertiesByLifecycle`, `scanMissingRenovationData`, `scanOverdueTasks`, `scanOperationalHealth`, `calculatePropertyProfitability`, `getInvestorOverview`, `scanMissingDocuments`, `analyzeNewListings`, `queryActiveRenovations`, `scanRenovationHealth`) | Graf (Chart) |
| No tool result (text-only response) | Odpoved (Answer) |
| Always available | Logy (Logs) -- shows explainability data |

### Tab definitions

| Tab ID | Label | Icon | Content |
|--------|-------|------|---------|
| `odpoved` | Odpoved | MessageSquare | LLM text response with markdown rendering |
| `data` | Data | Table2 | Structured data tables, record details, CRUD confirmations |
| `graf` | Graf | BarChart2 | Recharts bar/line charts from `chartData` |
| `zprava` | Zprava | FileText | Markdown reports, PPTX download links |
| `email` | Email | Mail | Gmail draft preview with approve/reject actions |
| `logy` | Logy | Activity | Explainability: tools used, data sources, filters, record counts |

---

## 7. Streaming Architecture

### SSE transport

The `streamText()` function returns a server-sent events (SSE) stream via `toDataStreamResponse()`. This enables token-by-token delivery of the LLM's text response and real-time tool execution status.

### StreamData annotations

`StreamData` is used for out-of-band metadata that does not appear in the chat text. The primary use is **explainability data** -- appended as a message annotation in the `onFinish` callback. The frontend reads these annotations to populate the Logy tab.

### Timing and limits

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `maxDuration` | 120s | Vercel Pro serverless function timeout |
| `maxSteps` | 5 | Maximum tool-call rounds per turn |
| `maxRetries` | 1 | Fail-fast on API errors |

### Fire-and-forget logging

`logAgentRun()` persists the session ID, user query, tool call log, and output summary to the `AgentRun` table. It runs asynchronously after the stream is set up and errors are caught with `.catch(console.error)` -- it never blocks or delays the user-facing response.

### Message history trimming (three layers)

To prevent context window overflow on subsequent turns:

1. **Hard cap:** Only the last 20 messages are kept.
2. **Payload stripping:** Base64 data URLs are replaced with `"[file already delivered to client]"`, markdown/HTML bodies are truncated to 500 characters, `chartData` arrays are emptied entirely.
3. **Array capping:** Large result arrays (properties, leads, events, etc. -- 25+ trimmable keys) are sliced to 3 items, with the original count preserved in a `_keyTotal` metadata field.
4. **Incomplete tool calls:** If a tool invocation has no `result` (state !== "result"), a fallback error result is injected to prevent the LLM from stalling.

---

## 8. Three Application Pages

| Page | Route | Rendering | Purpose |
|------|-------|-----------|---------|
| Chat | `/` | Client-side (`useChat` hook) | AI agent conversation with split-screen results |
| Data Management | `/sprava` | Server Components + Client Components | CRUD interface for all entities (properties, clients, leads, deals, showings, renovations) |
| Automation Dashboard | `/dashboard` | Server Components + Client Components | Monitoring job management, daily reminder call logs, executive report history |

### Page details

**Chat (`/`):** The primary interface. Left panel renders `ChatPanel` with message history, input box, speech input, and suggested prompts. Right panel renders `ResultsPanel` with 6 tabs. State is managed by the `useChat` hook from Vercel AI SDK.

**Data Management (`/sprava`):** Server-rendered data tables with client-side filtering and pagination. Each entity has list and detail views. The renovation detail page (`/sprava/rekonstrukce/[id]`) provides a dedicated timeline and task management UI.

**Automation Dashboard (`/dashboard`):** Displays scheduled monitoring jobs with run history, daily reminder call logs (ElevenLabs voice calls), and executive report run history. Includes controls to toggle automations and trigger manual runs.

---

## 9. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Typed tools instead of raw LLM output | Structured, auditable responses; frontend can render charts/tables from typed data |
| Keyword-based tool filtering | Reduces token cost (~4K tokens for 45 tool schemas); improves selection accuracy by narrowing the choice set |
| Split-screen UI | Chat for conversational interaction, panel for rich data visualization; both visible simultaneously |
| Gmail drafts only (never auto-sends) | Human-in-the-loop safety; user reviews and approves every email |
| In-memory file storage (token-based) | Sufficient for demo scope; avoids S3/R2 infrastructure complexity |
| Fire-and-forget agent run logging | Never blocks or delays the user-facing SSE stream |
| Czech system prompt and tool descriptions | Natural interaction for the target user (Pepa, back office manager in Prague) |
| `chartData` in tool results (not LLM-generated) | Deterministic chart rendering; LLM provides commentary, not visualization |
| Error resilience in side effects | SMS/calendar failures during showing creation are captured as fields (`smsError`, `calendarError`) but do not block the primary DB operation |
| `maxSteps: 5` | Sufficient for most workflows (query -> analyze -> act -> confirm); limits runaway tool chains |

For detailed rationale on each decision, see [design-decisions.md](./design-decisions.md).

---

## 10. Limitations

| Limitation | Impact |
|------------|--------|
| **No authentication** | Assumes trusted internal network; any user with the URL has full access |
| **In-memory file storage** | Download tokens expire on serverless function cold start; not suitable for persistent file access |
| **Single-tenant Google OAuth** | One Google Calendar and one Gmail account shared across all sessions |
| **Keyword-based tool selection** | May miss user intent when no matching Czech keywords are present; falls back to sending all 45 tools |
| **5-step tool limit** | Complex multi-tool workflows (e.g., full briefing + report + email) may require multiple conversation turns |
| **No real-time data** | Database contains snapshots from seed data and periodic monitoring runs; no live market feeds |
| **Simplified financial model** | Basic ROI calculation (purchase + renovation vs. expected sale); no DCF, IRR, or cash flow projections |
| **No concurrent user handling** | Single session model; no user isolation or multi-tenant data separation |
| **No undo/rollback** | CRUD operations (create, update) are immediate and permanent; no soft-delete or audit trail beyond `AgentRun` logs |

---

## 11. Future Improvements

- **Semantic tool selection** -- Replace keyword matching with embedding-based intent classification for more accurate tool routing.
- **Multi-user authentication with RBAC** -- Add user accounts, roles (admin, agent, viewer), and data isolation.
- **Persistent file storage** -- Move PPTX/PDF output to S3 or Cloudflare R2 with signed URLs.
- **Real-time notifications** -- WebSocket or SSE push for monitoring alerts, task reminders, and calendar changes.
- **Voice assistant integration** -- Bidirectional voice interface using ElevenLabs or similar for hands-free operation.
- **Deeper financial analytics** -- DCF calculations, cash flow projections, IRR computation, portfolio optimization.
- **Mobile-responsive layout** -- Adaptive split-screen that collapses to tabbed navigation on small screens.
- **Multi-language support** -- Configurable UI and system prompt language beyond Czech.
- **Webhook-driven tool execution** -- Allow external systems to trigger agent actions via authenticated webhooks.
- **Conversation memory** -- Persistent session context across browser refreshes using server-side storage.

---

## 12. See Also

| Document | Description |
|----------|-------------|
| [backend.md](./backend.md) | API routes, streaming implementation, cron jobs |
| [frontend.md](./frontend.md) | React components, state management, UI patterns |
| [database.md](./database.md) | Prisma schema, models, enums, query patterns |
| [tools.md](./tools.md) | All 45 tools: parameters, return types, categories |
| [integrations.md](./integrations.md) | Google Calendar, Gmail, Twilio, ElevenLabs, web scraping |
| [deployment.md](./deployment.md) | Vercel configuration, environment variables, cron setup |
| [design-decisions.md](./design-decisions.md) | Detailed rationale for architectural choices |
