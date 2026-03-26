# Design Decisions

Architectural rationale for the Back Office Operations Agent. Each decision is documented with the problem it solves, the chosen approach, trade-offs accepted, and alternatives that were considered.

---

## 1. Why These Decisions Matter

This project was built solo for a hiring challenge. Every architectural choice balances production-quality engineering against the realities of a compressed development timeline. The goal is not to ship a toy prototype but to demonstrate the judgment calls a senior engineer makes when constraints are real: limited time, a single developer, and a live Vercel deployment that must actually work.

Each section below follows the same structure: **Problem** (what needed solving), **Solution** (what was built), **Trade-off** (what was sacrificed), **Alternative considered** (what was not built, and why).

---

## 2. AI & Agent Design

### 2.1 Keyword-based tool selection instead of LLM choosing from all 45 tools

**Problem.** The agent exposes 45 tools. Sending all 45 tool schemas on every request adds approximately 4,000 tokens of context per turn, slows down tool selection, increases latency, and raises cost. Worse, the LLM occasionally selects irrelevant tools when presented with too many options.

**Solution.** `lib/agent/tool-selector.ts` implements a Czech keyword matching system. The user's message is scanned against 70+ keyword-to-group mappings (e.g., "prohlid" maps to `CRUD_SHOWINGS` + `CALENDAR`). Matched groups resolve to 10-20 relevant tools. The `CORE` group (generateReport, createAgentTask) is always included.

**Trade-off.** Rigid substring matching cannot understand intent the way semantic search would. A message like "co delam spatne" (what am I doing wrong) might not match any keyword and would fall through to the fallback path.

**Fallback.** When no keywords match (only `CORE` group selected), the selector sends all 45 tools. This ensures the system degrades gracefully rather than failing silently.

**Alternative considered.** Embedding-based semantic search over tool descriptions. This would handle ambiguous queries better but requires a vector store, embedding model, and retrieval pipeline -- too much infrastructure for the demo timeline.

### 2.2 maxSteps: 5

**Problem.** Without `maxSteps`, the Vercel AI SDK's `streamText` issues tool calls but never produces a final text response. The agent needs multiple steps for workflows like booking a showing (getPropertyDetails -> getCalendarAvailability -> createShowing).

**Solution.** `maxSteps: 5` in `app/api/chat/route.ts` (line 140). This allows up to 5 tool-call/response cycles before forcing a text completion.

**Trade-off.** Five steps caps the agent's reasoning depth. The longest scripted workflow (showing booking with SMS and calendar) requires 3 steps. Five provides headroom without risking the Vercel 120-second function timeout (`maxDuration = 120` on line 12). Higher values (10+) would risk timeouts on cold starts and significantly increase token costs.

**Measured behavior.** Most queries complete in 1-2 steps. Analytics queries (single tool call + text response) take 1 step. Multi-tool workflows (showing booking, email with presentation) take 3-4 steps.

**Alternative considered.** Dynamic `maxSteps` based on detected workflow complexity. Rejected because it adds branching logic without meaningful benefit -- 5 is sufficient for all current workflows.

### 2.3 Typed tool results with discriminated union

**Problem.** The frontend needs to render 45 different tool results across 6 tabs (Answer, Data, Chart, Report, Email, Logs). Untyped JSON results would require runtime type checking and string matching throughout the rendering pipeline.

**Solution.** Every tool returns a result object with a `toolName` literal field, a `chartType` field ("bar" | "line" | "none"), and structured data. These 40+ interfaces are combined into the `AgentToolResult` discriminated union in `types/agent.ts` (968 lines). The `toolName` field enables O(1) tab routing in `ResultsPanel.tsx`:

- `generateReport` / `generatePresentation` -> Report tab
- `createGmailDraft` / `prepareEmailDraft` -> Email tab
- Tools with `chartType !== "none"` -> Chart tab (default)
- All other CRUD/detail tools -> Data tab

**Trade-off.** Adding a new tool requires touching 5+ files (tool implementation, types, tool-selector, index re-export, possibly ResultsPanel). This ceremony is the cost of type safety.

**Alternative considered.** Generic JSON with runtime `typeof` checks. Faster to prototype but fragile -- a missing field silently breaks rendering instead of failing at compile time.

### 2.4 Czech system prompt with scripted workflows

**Problem.** Without explicit workflow instructions, the LLM inconsistently chains tools. Sometimes it books a showing without checking calendar availability first. Sometimes it sends an email without fetching property details.

**Solution.** `lib/agent/prompts.ts` contains a 136-line Czech system prompt with 8+ scripted workflow patterns. Each workflow specifies the exact tool sequence (e.g., "showing booking: getPropertyDetails -> getCalendarAvailability -> offer slots -> createShowing"). The prompt also establishes response style: start with a 1-2 sentence summary, no greeting phrases, acknowledge data gaps honestly.

**Trade-off.** Czech-only prompt means the system cannot serve English-speaking users without a separate prompt. Scripted workflows are brittle -- adding a new step (e.g., "also check client's previous showings") requires updating the prompt text.

**Why Czech throughout.** Mixing languages in the prompt causes the LLM to switch languages mid-response. Czech-only prompt, labels, and seed data ensure consistent Czech output.

**Alternative considered.** Few-shot examples instead of workflow scripts. Rejected because examples consume more tokens and are harder to maintain than concise procedural instructions.

### 2.5 chartData in tool results, not LLM-generated visualizations

**Problem.** If the LLM generates chart descriptions or image URLs, the numbers can be hallucinated. The chart might not match the actual query results.

**Solution.** Every analytics tool returns a `chartData` array alongside the raw data. For example, `queryNewClients` returns both a `clients` array (full records) and a `chartData` array (`[{ name: "Sreality", pocet: 12 }, ...]`). Recharts renders directly from these structured arrays. The LLM provides commentary and trend analysis in its text response but never controls the visualization.

**Trade-off.** Chart schemas are fixed at tool implementation time. A user cannot ask for a custom visualization (e.g., "show me that as a pie chart") without adding new chart types.

**Design detail.** `chartData` arrays are stripped from message history on subsequent turns (`trimToolResult` sets `chartData = []` on line 43-45 of the chat route). The frontend has already rendered the chart; keeping the data in history wastes tokens.

---

## 3. Data & Integration Design

### 3.1 Gmail drafts only, never auto-sends

**Problem.** The LLM composes email content based on tool results and user instructions. Without review, it could send emails with incorrect recipient addresses, inappropriate tone, or hallucinated property details.

**Solution.** `createGmailDraft` in `lib/google/gmail.ts` calls `gmail.users.drafts.create` (line 92), never `gmail.users.messages.send`. The draft appears in the Email tab where the user can review, edit, approve, or reject it. Only presentation emails (`sendPresentationEmail`) send directly, because the content is a generated PPTX file, not LLM-composed text.

**Trade-off.** Extra manual step for the user. Every email requires explicit approval. For a high-volume operation, this would be a bottleneck.

**Alternative considered.** Auto-send with confirmation prompt ("Shall I send this?"). Rejected because in a multi-step conversation, the LLM might misinterpret a general "yes" as approval to send.

### 3.2 Temporary file storage instead of S3

**Problem.** Generated PPTX and PDF files need to be downloadable by the frontend. Data URLs are too large to keep in chat message history (bloats context window).

**Solution.** `lib/export/file-store.ts` writes files to the OS temp directory (`os.tmpdir()`) with UUID-based tokens and a 10-minute TTL. The download URL contains only the token; the frontend requests the file via `/api/export?token=...`. Expired files are cleaned up on access. The `pptx-store.ts` is a thin wrapper that adds a `pptx-` prefix.

**Trade-off.** Files are lost on Vercel cold starts (new function instances get a fresh `/tmp`). This is acceptable for a demo where files are needed only for immediate download.

**Why not in-memory Map.** The initial implementation used an in-memory Map, but Vercel serverless functions can spawn multiple instances. Writing to `/tmp` at least persists within the same instance's lifetime and survives across requests routed to the same container.

**Alternative considered.** S3/R2 with signed URLs. Would provide persistent, multi-instance storage but adds an infrastructure dependency (bucket provisioning, IAM credentials, SDK) disproportionate to the demo's needs.

### 3.3 Neon PostgreSQL over local SQLite or Supabase

**Problem.** The application runs on Vercel serverless functions, which create and destroy connections rapidly. Traditional PostgreSQL connection pools are not designed for this pattern.

**Solution.** Neon provides serverless-compatible PostgreSQL with connection pooling built in. Prisma is configured with two URLs: `DATABASE_URL` (pooled, for queries in serverless functions) and `DIRECT_URL` (direct, for Prisma migrations that require a persistent connection).

**Trade-off.** External dependency with potential cold-start latency on the database side. Free tier has storage and compute limits.

**Alternative considered.** SQLite via Turso (simpler setup, no connection pooling concerns). Rejected because Prisma's SQLite adapter lacks some features used in the schema (e.g., `@default(dbgenerated())` patterns, JSON column support).

### 3.4 Single-tenant Google OAuth

**Problem.** Google Calendar and Gmail integration requires OAuth2. A full multi-tenant flow requires a consent screen, token storage per user, refresh token rotation, and handling revocations.

**Solution.** A single refresh token stored in `GOOGLE_REFRESH_TOKEN` env var. `lib/google/auth.ts` creates one OAuth2 client singleton cached globally. This serves one user (Pepa) accessing one calendar and one Gmail inbox.

**Trade-off.** Cannot support multiple users without re-architecture. If the refresh token expires (Google revokes tokens unused for 6 months), the integration silently fails.

**Alternative considered.** Multi-tenant OAuth with database-persisted tokens. The correct production approach but requires consent screen approval, token refresh logic, and per-user auth state -- overhead that does not improve the demo.

### 3.5 Twilio REST API without the SDK

**Problem.** The agent sends SMS confirmations when showings are created or cancelled. The Twilio Node.js SDK is a substantial dependency for what amounts to two API calls.

**Solution.** `lib/integrations/twilio.ts` uses `fetch` with HTTP Basic auth (line 97-105) against the Twilio Messages REST endpoint. Two template functions (`sendShowingConfirmationSms`, `sendShowingCancellationSms`) construct Czech message bodies with formatted dates.

**Trade-off.** No SDK-provided validation, retry logic, or webhook signature verification. If Twilio changes their API response format, the code breaks without a helpful error.

**Why fetch over SDK.** The SDK adds ~2MB to the bundle. The entire SMS integration is 120 lines. The two templates cover all current use cases. Adding the SDK for two POST requests would be over-engineering.

### 3.6 Error resilience in side effects

**Problem.** Creating a showing involves three operations: database insert, Google Calendar event creation, and SMS sending. If the calendar API is down, should the entire showing creation fail?

**Solution.** No. `lib/agent/tools/createShowing.ts` wraps calendar and SMS calls in independent try/catch blocks (lines 44-68, 74-92). The database record is always created first. Failures in calendar or SMS are captured as `calendarError` and `smsError` fields in the result. The frontend displays partial success (e.g., "Showing #42 created. Calendar OK. SMS: client has no phone number").

**Trade-off.** The system can be in an inconsistent state: a showing exists in the database but has no corresponding calendar event. The user sees the error and can retry or create the calendar event manually.

**Alternative considered.** Saga pattern with compensating transactions (if calendar fails, delete the DB record). Over-engineered for a demo; partial success with clear error reporting is more useful than all-or-nothing semantics.

---

## 4. Frontend Design

### 4.1 Split-screen layout instead of inline chat results

**Problem.** Agent responses include rich data: tables with 50+ rows, bar/line charts, markdown reports, email drafts, and PPTX download links. Rendering these inline in a chat bubble produces an unusable experience -- the user scrolls past walls of data to reach the next message.

**Solution.** `app/page.tsx` implements a fixed split-screen: a 400px chat panel on the left, a flexible results panel on the right with 6 tabs (Answer, Data, Chart, Report, Email, Logs). The chat panel shows conversational context; the results panel shows the latest tool output.

**Trade-off.** Only the most recent tool result is displayed in the results panel. Historical results require scrolling back through chat messages. On screens narrower than ~900px, the 400px fixed width becomes problematic (not responsive for mobile).

**Why 400px fixed, not proportional.** Chat messages are text-heavy and read well at a narrow width. The results panel needs maximum space for tables and charts. A percentage split (e.g., 30/70) would waste space in the chat column on wide screens.

### 4.2 useChat as the sole state management

**Problem.** The application needs to manage message state, streaming status, input handling, error state, and derived data (latest tool result, latest explainability annotation).

**Solution.** `app/page.tsx` uses Vercel AI SDK's `useChat` hook as the single source of truth. All state derives from `messages` and `data` returned by the hook. `latestToolResult` is computed via `useMemo` by scanning messages in reverse for the last `toolInvocations` entry with `state === "result"`. `latestExplainability` is extracted from `data` (stream annotations) similarly.

**Trade-off.** No persistent state across page reloads. Refreshing the browser loses the entire conversation. `useMemo` rescans all messages on every render (acceptable for 20-message cap, would need optimization for longer conversations).

**Alternative considered.** Redux or Zustand for global state with persistence. Unnecessary for a single-page, single-session application. The AI SDK's hook already provides everything needed.

### 4.3 Auto-switching tabs via useEffect

**Problem.** When the agent returns a chart result, the user should see the Chart tab. When it returns an email draft, the Email tab. The user should not have to manually switch tabs after every query.

**Solution.** `ResultsPanel.tsx` uses a `useEffect` watching `latestToolResult` (lines 91-130). A switch on `toolName` determines the target tab: report/presentation tools -> Report tab, email tools -> Email tab, CRUD/detail tools -> Data tab, analytics tools with charts -> Chart tab.

**Trade-off.** Auto-switching can be disorienting if the user is reading content in one tab when a new result arrives. The user can manually override by clicking a tab, but the next result will auto-switch again.

### 4.4 Server components for /sprava and /dashboard

**Problem.** The data management (`/sprava`) and monitoring dashboard (`/dashboard`) pages need initial data loaded from the database. Client-side fetching means loading spinners on every page visit.

**Solution.** These routes use React Server Components for initial data loading. The server fetches data during rendering; the client receives pre-populated HTML. Interactive elements (forms, filters, action buttons) are isolated in `"use client"` child components.

**Trade-off.** Hybrid server/client architecture adds complexity to component boundaries. Props must be serializable. Server components cannot use hooks or browser APIs.

---

## 5. Operational Design

### 5.1 Three independent cron jobs

**Problem.** The system has three scheduled tasks with different cadences, durations, and failure modes: market monitoring (scraping), daily reminder calls (ElevenLabs), and weekly executive reports (PPTX generation + email).

**Solution.** Three separate Vercel cron routes, each with its own schedule:

| Job | Schedule | Route | Duration |
|-----|----------|-------|----------|
| Monitoring | 5 AM Mon-Fri | `/api/cron/monitoring` | 30-60s (web scraping) |
| Reminder calls | 5 AM daily | `/api/cron/daily-reminder-calls` | 5-15s |
| Weekly report | 7 AM Monday | `/api/cron/weekly-report` | 10-30s (PPTX + email) |

All routes validate `CRON_SECRET` via the Authorization header.

**Trade-off.** No centralized orchestration or dependency management between jobs. If monitoring needs to finish before reminders (it does not, currently), there is no mechanism to enforce ordering.

**Alternative considered.** A single orchestrator endpoint that dispatches sub-tasks. Adds a coordination layer that is unnecessary when jobs are independent. Also, Vercel cron has a 60-second timeout per route -- a single orchestrator running all three sequentially might exceed this.

### 5.2 Fire-and-forget agent run logging

**Problem.** Every agent interaction should be logged for debugging and analytics (which tools were called, what the user asked, response summary). But logging must not slow down the user-facing response.

**Solution.** `logAgentRun()` is called inside `onFinish` (line 175 of the chat route) with `.catch(console.error)`. It writes to the `AgentRun` table asynchronously. The stream response has already been sent to the client by this point.

**Trade-off.** If the database write fails (connection timeout, constraint violation), the log is lost. The error is captured in console output but not surfaced to the user or retried.

**Why acceptable.** Agent run logs are diagnostic, not transactional. Losing occasional log entries does not affect the user experience. The alternative -- blocking the stream until the log is persisted -- would add 50-200ms latency to every response.

### 5.3 Deterministic seed data with faker.seed(42)

**Problem.** Development and testing require realistic data that is consistent across environments. Random seed data makes bugs difficult to reproduce ("it worked on my machine" because different client names/dates).

**Solution.** `prisma/seed.ts` calls `faker.seed(42)` on line 7. The Faker instance uses Czech and English locales. The seed creates:

- 45 clients across 5 segments and 6 acquisition sources
- 150 leads with weighted dates (more recent leads are more frequent)
- 55 properties across 12 Prague districts (15 intentionally missing renovation data)
- 22 deals at various stages
- 40 showings
- 18 weekly reports
- 2 scheduled monitoring jobs

**Trade-off.** `faker.seed(42)` only seeds the Faker PRNG. The helper functions `randomItem()` and `randomInt()` use `Math.random()`, which is not seeded. This means some distribution aspects (district assignment, street selection) vary between runs. Full determinism would require replacing all `Math.random()` calls with the seeded Faker instance.

**Intentional data gaps.** 15 properties are seeded without renovation data. This creates realistic test scenarios for the `scanMissingRenovationData` tool, which is one of the demo's key features.

### 5.4 Three-layer message history trimming

**Problem.** As conversations grow, tool results accumulate in message history. A single `listProperties` result with 50 records, each containing 15 fields, can be 5,000+ tokens. After 10 queries, the context window fills with stale tool outputs.

**Solution.** `trimMessageHistory()` in `app/api/chat/route.ts` applies three layers:

1. **Hard cap**: Only the last 20 messages are kept (line 64).
2. **Payload stripping**: Base64 data URLs become `"[file already delivered]"`, markdown/HTML over 500 chars is truncated, `chartData` arrays are emptied entirely (lines 31-45).
3. **Array capping**: 22 known array keys (properties, clients, leads, etc.) are capped at 3 items with a `_keyTotal` metadata field preserving the original count (lines 47-54).

**Trade-off.** The LLM loses access to full historical results. If the user asks "what was the third client in that list you showed me earlier?", the trimmed history may not contain that data. The `_keyTotal` count at least tells the LLM "there were 45 clients, I can see 3."

**Incomplete tool calls.** Tool invocations with `state !== "result"` (interrupted or failed) are patched to include a synthetic error result (lines 75-84). Without this, the AI SDK throws errors when encountering incomplete tool call sequences in the message history.

---

## 6. What Would Change in Production

| Decision | Demo Approach | Production Approach |
|----------|---------------|---------------------|
| Authentication | None -- assumes trusted internal environment | RBAC with SSO (Azure AD / Google Workspace) |
| File storage | OS temp directory with 10-min TTL | S3 or Cloudflare R2 with signed URLs and lifecycle policies |
| Google OAuth | Single-tenant refresh token in env var | Multi-tenant consent flow with per-user token storage |
| Tool selection | Czech keyword substring matching | Embedding-based semantic search with confidence threshold |
| Error handling | `console.error` and `.catch()` | Sentry or Datadog with alerting, structured logging |
| Testing | Manual testing against seeded data | Unit tests for tools, integration tests for workflows, E2E with Playwright |
| Rate limiting | None | Per-user throttling with token bucket (e.g., Upstash Ratelimit) |
| Session persistence | Ephemeral (lost on page reload) | Server-side session storage with conversation history in database |
| File export | Token-based temp files | Permanent URLs with access control and audit logging |
| Message trimming | Fixed 20-message window | Sliding window with semantic summarization of older messages |
| SMS integration | Direct REST API with `fetch` | Twilio SDK with webhook handling, delivery status tracking, and retry logic |
| Cron jobs | Vercel cron with console logging | Temporal or Inngest for durable workflows with observability |

---

## 7. See Also

- [architecture.md](architecture.md) -- System overview, request flow diagrams, component relationships
- [backend.md](backend.md) -- API routes, streaming implementation, cron job details
- [tools.md](tools.md) -- Complete tool catalog, parameter schemas, result types
- [frontend.md](frontend.md) -- React component tree, tab routing, state management
- [integrations.md](integrations.md) -- Google Calendar, Gmail, Twilio, ElevenLabs integration details
- [database.md](database.md) -- Prisma schema, query patterns, seed data structure
