# Tool System

Complete documentation for the 48-tool agent system registered in `lib/agent/tools/index.ts`.

---

## 1. Architecture

### File Structure

Every tool lives in its own file inside `lib/agent/tools/`. The barrel export in `index.ts` assembles all tools into a single `agentTools` object.

```
lib/agent/tools/
  index.ts                          # Barrel: exports agentTools record (48 tools)
  queryNewClients.ts                # Analytics
  queryLeadsSalesTimeline.ts        # Analytics
  queryWeeklyKPIs.ts                # Analytics
  queryPropertiesByLifecycle.ts     # Analytics
  calculatePropertyProfitability.ts # Analytics
  getInvestorOverview.ts            # Analytics
  scanMissingRenovationData.ts      # Data quality
  scanMissingDocuments.ts           # Data quality
  scanOperationalHealth.ts          # Data quality
  scanOverdueTasks.ts               # Data quality
  listProperties.ts                 # CRUD
  createProperty.ts                 # CRUD
  updateProperty.ts                 # CRUD
  getPropertyDetails.ts             # CRUD (detail)
  getPropertyDocuments.ts           # CRUD (documents)
  listClients.ts                    # CRUD
  createClient.ts                   # CRUD
  updateClient.ts                   # CRUD
  listLeads.ts                      # CRUD
  createLead.ts                     # CRUD
  updateLead.ts                     # CRUD
  listDeals.ts                      # CRUD
  createDeal.ts                     # CRUD
  updateDeal.ts                     # CRUD
  listShowings.ts                   # CRUD (+ Calendar + SMS side effects)
  createShowing.ts                  # CRUD (+ Calendar + SMS side effects)
  updateShowing.ts                  # CRUD (+ Calendar + SMS side effects)
  getCalendarAvailability.ts        # Calendar
  createCalendarEvent.ts            # Calendar
  updateCalendarEvent.ts            # Calendar
  deleteCalendarEvent.ts            # Calendar
  listCalendarEvents.ts             # Calendar
  createGmailDraft.ts               # Email
  sendPresentationEmail.ts          # Export / Email
  generatePresentation.ts           # Export (PPTX)
  generateReport.ts                 # Report (Markdown/PDF)
  createAgentTask.ts                # Task management
  listScheduledJobs.ts              # Monitoring
  createMonitoringJob.ts            # Monitoring
  triggerMonitoringJob.ts           # Monitoring
  getMonitoringResults.ts           # Monitoring
  analyzeNewListings.ts             # Monitoring (analytics)
  queryActiveRenovations.ts         # Renovation
  getRenovationDetail.ts            # Renovation
  scanRenovationHealth.ts           # Renovation
```

### Key Types

```typescript
// lib/agent/tools/index.ts
export const agentTools = { ... } as const

// Derived type: union of all 48 tool names
export type AgentToolName = keyof typeof agentTools
```

The `agentTools` object is passed directly to `streamText()` (or a filtered subset via the tool selector). The AI SDK discovers available tools from this record.

---

## 2. Tool Pattern

Every tool follows an identical structure:

```typescript
import { tool } from "ai"
import { z } from "zod"
import { someDbQuery } from "@/lib/db/queries/entity"
import { LABEL_MAP } from "@/lib/constants/labels"
import type { SomeToolResult } from "@/types/agent"

export const myToolTool = tool({
  // Czech description -- consumed by the LLM to decide when to invoke
  description: "Vraci seznam ...",

  // Zod schema for parameters -- also sent to LLM for structured extraction
  parameters: z.object({
    requiredParam: z.number().int().describe("Popis parametru"),
    optionalParam: z.string().optional().describe("Volitelny popis"),
    withDefault: z.number().default(10).describe("S vychozi hodnotou"),
  }),

  // Async execute -- runs server-side when LLM invokes the tool
  execute: async (params): Promise<SomeToolResult> => {
    const data = await someDbQuery(params)

    return {
      toolName: "myTool",          // discriminant for AgentToolResult union
      chartType: "bar",            // "bar" | "line" | "none"
      chartData: data.map(d => ({  // Recharts-ready array (empty if chartType=none)
        name: d.label,
        pocet: d.count,
      })),
      // ... tool-specific fields
    }
  },
})
```

### Conventions

| Convention | Detail |
|---|---|
| Description language | Czech (consumed by LLM) |
| Parameter descriptions | Czech (shown to LLM) |
| `toolName` field | Must match the key in `agentTools` |
| `chartType` field | `"bar"`, `"line"`, or `"none"` |
| `chartData` array | Czech keys (e.g., `pocet`, `leady`, `prodeje`) for Recharts |
| Label resolution | Applied in tool execute, not in query layer. Uses maps from `lib/constants/labels.ts` |
| Error handling | Throw for fatal errors (tool not found, invalid ID). Capture non-fatal errors in result fields (`calendarError`, `smsError`). |
| Return type | Strongly-typed interface from `types/agent.ts` |

---

## 3. Tool Catalog (48 Tools)

### 3.1 Analytics (6 tools)

| Tool Name | Description | Key Parameters | Chart Type | Returns |
|---|---|---|---|---|
| `queryNewClients` | New clients by quarter with source breakdown | `year`, `quarter` | bar | `totalClients`, `bySource[]`, `clients[]` |
| `queryLeadsSalesTimeline` | Monthly leads vs. sales over N months | `months` (default 6) | line | `totalLeads`, `totalSold`, `conversionRate`, `timeline[]` |
| `queryWeeklyKPIs` | Weekly KPI data (leads, clients, deals, revenue) | `weeksBack` (default 8) | bar | `weeks[]`, `trends`, `totals` |
| `queryPropertiesByLifecycle` | Properties grouped by lifecycle stage | `stage?`, `district?`, `includeStalled?` | bar | `properties[]`, `stalledProperties[]`, `byStage[]` |
| `calculatePropertyProfitability` | ROI and profit calculation per property | `propertyId?`, `district?`, `minROI?` | bar | `properties[]`, `averageROI`, `totalPotentialProfit` |
| `getInvestorOverview` | Investor portfolio summary with property holdings | `investorId?`, `investorName?` | bar | `investors[]`, `totalPortfolioValue`, `totalInvested` |

### 3.2 Data Quality / Scanning (4 tools)

| Tool Name | Description | Key Parameters | Chart Type | Returns |
|---|---|---|---|---|
| `scanMissingRenovationData` | Properties missing renovation year/notes | (none) | bar | `properties[]`, `byDistrict[]`, `totalCount` |
| `scanMissingDocuments` | Properties missing required documents (purchase contract, energy certificate, title deed, photos) | (none) | bar | `properties[]`, `totalWithMissingDocs` |
| `scanOperationalHealth` | Comprehensive operational audit (6 categories, score 0-100) | `stalledDealsDays` (default 30), `showingFollowUpDays` (default 14) | bar | `overallScore`, `categories[]`, `totalIssues` |
| `scanOverdueTasks` | Overdue tasks and tasks due soon | `includeDueSoon` (default 3 days) | bar | `overdueTasks[]`, `dueSoonTasks[]`, `byPriority[]` |

**`scanOperationalHealth` checks six categories:**

| Category | Severity | What it checks |
|---|---|---|
| `overdueTasks` | high | Tasks past due date with status OPEN/IN_PROGRESS |
| `stalledDeals` | high | Deals with no activity for N days |
| `missingRenovation` | medium | Properties without renovation data |
| `showingsWithoutFollowUp` | medium | Completed showings with no follow-up within N days |
| `propertiesWithoutOwner` | low | Properties with no assigned owner |
| `missingLifecycle` | low | Properties without lifecycle stage |

Score formula: `100 - (highCount * 8) - (mediumCount * 3) - (lowCount * 1)`, clamped to [0, 100].

### 3.3 CRUD -- Properties (5 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `listProperties` | Paginated property list with filters | `district?`, `type?`, `status?`, `lifecycleStage?`, `priceMin?`, `priceMax?`, `areaMin?`, `areaMax?`, `search?`, `limit`, `offset`, `sortBy`, `sortOrder` | none |
| `createProperty` | Create a new property | `address`, `district`, `type`, `price`, `areaM2`, `status?`, `disposition?`, `yearBuilt?`, `lifecycleStage?`, `purchasePrice?`, `renovationCost?`, `expectedSalePrice?`, `ownerId?` | none |
| `updateProperty` | Update an existing property | `propertyId`, plus any field from createProperty | none |
| `getPropertyDetails` | Full property detail including owner, document/task counts | `propertyId` | none |
| `getPropertyDocuments` | List documents attached to a property | `propertyId` | none |

### 3.4 CRUD -- Clients (3 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `listClients` | Paginated client list | `segment?`, `source?`, `search?`, `limit`, `offset` | none |
| `createClient` | Create a new client | `name`, `email`, `phone?`, `segment`, `acquisitionSource` | none |
| `updateClient` | Update a client | `clientId`, plus any updatable field | none |

### 3.5 CRUD -- Leads (3 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `listLeads` | Paginated lead list | `status?`, `source?`, `search?`, `limit`, `offset` | none |
| `createLead` | Create a new lead | `name`, `email`, `phone?`, `source`, `propertyInterest?` | none |
| `updateLead` | Update a lead | `leadId`, plus any updatable field | none |

### 3.6 CRUD -- Deals (3 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `listDeals` | Paginated deal list | `status?`, `search?`, `limit`, `offset` | none |
| `createDeal` | Create a new deal | `propertyId`, `clientId`, `value`, `status?` | none |
| `updateDeal` | Update a deal | `dealId`, plus any updatable field | none |

### 3.7 CRUD -- Showings (3 tools)

| Tool Name | Description | Key Parameters | Chart Type | Side Effects |
|---|---|---|---|---|
| `listShowings` | Paginated showing list | `status?`, `propertyId?`, `clientId?`, `limit`, `offset` | none | -- |
| `createShowing` | Schedule a new property showing | `propertyId`, `clientId`, `scheduledAt`, `notes?`, `createCalendarEvent` (default true), `sendSmsConfirmation` (default true) | none | Google Calendar event creation, Twilio SMS confirmation |
| `updateShowing` | Update or cancel a showing | `showingId`, `status?`, `scheduledAt?`, `notes?` | none | Calendar sync on reschedule, calendar deletion on cancel, SMS cancellation notification |

**Side effect handling in `createShowing`:**

1. DB record created first (always succeeds or throws)
2. Google Calendar event created (if `createCalendarEvent=true`). On success, `googleCalendarEventId` stored on showing record. On failure, `calendarError` captured in result.
3. SMS sent via Twilio (if `sendSmsConfirmation=true`). On success, `smsSent=true`. On failure, `smsError` captured in result.
4. Calendar/SMS failures never block the primary DB operation.

**Side effect handling in `updateShowing`:**

1. If status changes to `CANCELLED` and showing is linked to calendar, calendar event is deleted.
2. If `scheduledAt` changes and showing is linked to calendar, calendar event time is updated.
3. If status changes to `CANCELLED` and client has a phone number, cancellation SMS is sent via Twilio.
4. All side effect failures are caught and logged, never blocking the DB update.

### 3.8 Calendar (5 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `getCalendarAvailability` | Find free slots in Google Calendar | `dateRangeStart`, `dateRangeEnd` | bar |
| `createCalendarEvent` | Create a new Google Calendar event | `summary`, `startDateTime`, `endDateTime?`, `description?`, `location?`, `showingId?` | none |
| `updateCalendarEvent` | Update an existing calendar event | `googleEventId?`, `showingId?`, `summary?`, `startDateTime?`, `endDateTime?`, `location?`, `description?` | none |
| `deleteCalendarEvent` | Delete a calendar event | `googleEventId?`, `showingId?` | none |
| `listCalendarEvents` | List events in a date range | `dateRangeStart`, `dateRangeEnd`, `maxResults?` | none |

**Event resolution:** `updateCalendarEvent` and `deleteCalendarEvent` accept either `googleEventId` or `showingId`. When `showingId` is provided, the tool looks up the linked calendar event ID from the showing record. If a showing's time is updated via `updateCalendarEvent`, the `scheduledAt` field on the showing record is synced back.

**Free slot detection:** `getCalendarAvailability` uses Google Calendar's free/busy API. Working hours are 9:00-18:00 Monday-Friday. Weekends are skipped. Results are grouped by date with slot counts for chart display.

### 3.9 Email and Export (3 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `createGmailDraft` | Prepare an email draft for user approval (does NOT save to Gmail) | `to`, `subject`, `body` (HTML) | none |
| `generatePresentation` | Generate a downloadable PPTX presentation | `title`, `slideCount` (1-10, default 3), `kpiData`, `timelineData`, `renovationData?` | none |
| `sendPresentationEmail` | Send a generated PPTX as an email attachment via Gmail | `to`, `subject`, `body` (HTML), `pptxToken`, `filename` | none |

**`createGmailDraft` note:** Despite the name, this tool returns a `PrepareEmailDraftResult` (toolName: `"prepareEmailDraft"`). It does NOT call the Gmail API. It prepares the draft for display in the Email tab. Actual Gmail draft creation happens only after explicit user approval in the UI.

**`generatePresentation` pipeline:**

1. Requires data from `queryWeeklyKPIs` and `queryLeadsSalesTimeline` (passed as `kpiData`, `timelineData`). Optional `renovationData` from `scanMissingRenovationData`.
2. Builds a pool of 10 slides (KPI overview, leads vs. sales, recommendations, weekly detail, conversion analysis, revenue trend, attention items, performance comparison, lead acquisition detail, action plan).
3. Takes the first `slideCount` slides from the pool.
4. Generates PPTX buffer via `lib/export/pptx.ts` (using pptxgenjs).
5. Stores buffer in temporary pptx-store with a download token.
6. Returns `downloadUrl` with the token for client download.

**`sendPresentationEmail` pipeline:**

1. Retrieves PPTX buffer from pptx-store using the `pptxToken` (extracted from previous `generatePresentation` result's `downloadUrl`).
2. Sends email with PPTX attachment via Gmail API using MIME multipart encoding.

### 3.10 Monitoring (5 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `listScheduledJobs` | List all monitoring jobs with status and run info | `status?` (ACTIVE/PAUSED/ERROR) | none |
| `createMonitoringJob` | Create a new real estate monitoring job | `name`, `locality`, `sources[]`, `types?`, `dispositions?`, `minPrice?`, `maxPrice?`, `minAreaM2?`, `maxAreaM2?`, `cronExpr`, `notifyEmail?` | none |
| `triggerMonitoringJob` | Immediately run a monitoring job (outside cron schedule) | `jobId` | none |
| `getMonitoringResults` | Retrieve monitoring results for last N days | `jobId`, `days` (default 7) | none |
| `analyzeNewListings` | Market analysis of monitoring results with scoring and statistics | `jobId`, `days` (default 7), `minScore?` | bar |

**`triggerMonitoringJob` pipeline:**

1. Loads job configuration from DB.
2. Runs web scraper against configured sources (Sreality, Bezrealitky).
3. Deduplicates results against existing records.
4. Saves new listings to DB.
5. Updates job's `lastRunAt` timestamp.
6. If `notifyEmail` is configured and new listings were found, sends notification email.

**`analyzeNewListings` computes:**

- Average price, price per m2, median price, price range
- Aggregation by disposition (apartment layout)
- Relevance scoring per listing
- Chart data: average price by disposition

### 3.11 Reports and Tasks (2 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `generateReport` | Generate a structured Markdown report (displayed in Report tab, downloadable as PDF) | `reportType` (`weekly_summary` / `renovation_scan` / `custom`), `data?`, `title?`, `markdown?` | none |
| `createAgentTask` | Create a task for the back office team | `title`, `description?`, `priority` (LOW/MEDIUM/HIGH/URGENT), `dueDate?`, `assignee?`, `propertyId?`, `dealId?`, `renovationId?`, `sourceQuery?` | none |

**`generateReport` modes:**

| Mode | Required Input | Behavior |
|---|---|---|
| `weekly_summary` | `data` from `queryWeeklyKPIs` | Builds structured Markdown with KPI table, weekly detail, trend analysis |
| `renovation_scan` | `data` from `scanMissingRenovationData` | Builds report with district breakdown, property list, recommendations |
| `custom` | `title` and `markdown` | Agent composes custom Markdown directly (investor reports, ad-hoc analysis, etc.) |

### 3.12 Renovation (3 tools)

| Tool Name | Description | Key Parameters | Chart Type |
|---|---|---|---|
| `queryActiveRenovations` | List active renovations with budget and task info | `phase?` (7 phases: PLANNING through READY_FOR_HANDOVER), `district?`, `onlyDelayed?` | bar |
| `getRenovationDetail` | Full renovation detail with tasks, budget utilization, blockers | `renovationId` | none |
| `scanRenovationHealth` | Health audit of all active renovations | (none) | bar |

**`scanRenovationHealth` checks six issue categories:**

| Category | Severity | What it checks |
|---|---|---|
| `delayed` | high | Renovations past planned end date |
| `overBudget` | high | Actual cost exceeds planned budget |
| `overdueTasks` | high | Renovations with overdue tasks |
| `blockers` | medium | Renovations with active blockers |
| `missingContractor` | medium | Renovations without assigned contractor |
| `missingNextStep` | low | Renovations without a defined next step |

Health score formula: `100 - (delayed * 15) - (overBudget * 10) - (overdueTasks * 10) - (blockers * 5) - (missingContractor * 5) - (missingNextStep * 3)`, clamped to [0, 100].

---

## 4. Tool Selection

The tool selector (`lib/agent/tool-selector.ts`) reduces LLM context by only sending relevant tools per message instead of all 48.

### How It Works

```
User message (Czech) --> selectTools() --> filtered subset of agentTools
```

1. User message is lowercased.
2. Each Czech keyword in `KEYWORD_GROUPS` is checked via `string.includes()`.
3. Matching keywords map to one or more tool groups.
4. The `CORE` group is always included.
5. If only `CORE` matched (no keywords detected), the fallback sends all 48 tools (unclear intent).
6. Otherwise, only tools from matched groups are passed to `streamText()`.

### Tool Groups (13 groups)

| Group | Tools | Count |
|---|---|---|
| `CORE` | `generateReport`, `createAgentTask` | 2 |
| `ANALYTICS` | `queryNewClients`, `queryLeadsSalesTimeline`, `queryWeeklyKPIs`, `queryPropertiesByLifecycle`, `calculatePropertyProfitability`, `getInvestorOverview` | 6 |
| `CALENDAR` | `getCalendarAvailability`, `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent`, `listCalendarEvents` | 5 |
| `EMAIL_EXPORT` | `createGmailDraft`, `sendPresentationEmail`, `generatePresentation` | 3 |
| `CRUD_PROPERTIES` | `listProperties`, `createProperty`, `updateProperty`, `getPropertyDetails`, `getPropertyDocuments` | 5 |
| `CRUD_CLIENTS` | `listClients`, `createClient`, `updateClient` | 3 |
| `CRUD_LEADS` | `listLeads`, `createLead`, `updateLead` | 3 |
| `CRUD_DEALS` | `listDeals`, `createDeal`, `updateDeal` | 3 |
| `CRUD_SHOWINGS` | `listShowings`, `createShowing`, `updateShowing` | 3 |
| `MONITORING` | `listScheduledJobs`, `triggerMonitoringJob`, `getMonitoringResults`, `createMonitoringJob`, `analyzeNewListings` | 5 |
| `RENOVATION` | `queryActiveRenovations`, `getRenovationDetail`, `scanRenovationHealth` | 3 |
| `DATA_QUALITY` | `scanMissingRenovationData`, `scanMissingDocuments`, `scanOperationalHealth`, `scanOverdueTasks` | 4 |

### Keyword Mapping (Excerpt)

Keywords are Czech word stems that match multiple morphological forms via substring matching.

| Keyword | Groups Activated |
|---|---|
| `klient`, `klienty`, `klientu` | CRUD_CLIENTS, ANALYTICS |
| `nemovitost`, `nemovitosti` | CRUD_PROPERTIES, ANALYTICS |
| `prohlid`, `prohliz`, `prohlidk` | CRUD_SHOWINGS, CALENDAR |
| `kalendar`, `termin`, `schuzk` | CALENDAR |
| `email`, `mail`, `draft` | EMAIL_EXPORT |
| `monitoring`, `sreality`, `bezrealitky` | MONITORING |
| `rekonstrukc`, `renovac`, `oprav` | RENOVATION |
| `briefing`, `ranni` | DATA_QUALITY, RENOVATION, ANALYTICS |
| `investor`, `roi`, `zisk` | ANALYTICS |
| `vytvor`, `pridej` | All 5 CRUD groups |
| `uprav`, `aktualizuj` | All 5 CRUD groups |
| `smaz` | CALENDAR |
| `zrus` | CRUD_SHOWINGS, CALENDAR |

### Cross-Group Activation

Many keywords activate multiple groups. For example, `prohlid` (showing) activates both `CRUD_SHOWINGS` and `CALENDAR` because showing operations often require calendar integration.

---

## 5. Type System

All tool result types are defined in `types/agent.ts`.

### AgentToolResult Discriminated Union

```typescript
export type AgentToolResult =
  | QueryNewClientsResult
  | QueryLeadsSalesTimelineResult
  | ScanMissingRenovationResult
  | CreateAgentTaskResult
  | QueryWeeklyKPIsResult
  | GenerateReportResult
  | GeneratePresentationResult
  | GetCalendarAvailabilityResult
  | CreateCalendarEventResult
  | UpdateCalendarEventResult
  | DeleteCalendarEventResult
  | ListCalendarEventsResult
  | GetPropertyDetailsResult
  | CreateGmailDraftResult
  | SendPresentationEmailResult
  | ListScheduledJobsResult
  | TriggerMonitoringJobResult
  | GetMonitoringResultsResult
  | ListPropertiesResult
  | CreatePropertyResult
  | UpdatePropertyResult
  | ListClientsResult
  | CreateClientResult
  | UpdateClientResult
  | ListLeadsResult
  | CreateLeadResult
  | UpdateLeadResult
  | ListDealsResult
  | CreateDealResult
  | UpdateDealResult
  | ListShowingsResult
  | CreateShowingResult
  | UpdateShowingResult
  | PrepareEmailDraftResult
  | QueryPropertiesByLifecycleResult
  | ScanOverdueTasksResult
  | ScanOperationalHealthResult
  | CalculatePropertyProfitabilityResult
  | GetInvestorOverviewResult
  | GetPropertyDocumentsResult
  | ScanMissingDocumentsResult
  | AnalyzeNewListingsResult
  | QueryActiveRenovationsResult
  | GetRenovationDetailResult
  | ScanRenovationHealthResult
```

### Common Fields

Every result type includes these fields:

| Field | Type | Purpose |
|---|---|---|
| `toolName` | string literal | Discriminant for the union. Must match the key in `agentTools`. |
| `chartType` | `"bar"` \| `"line"` \| `"none"` | Tells the frontend which chart component to render. |
| `chartData` | array (optional) | Recharts-ready data. Keys are Czech (`pocet`, `leady`, `prodeje`). Only present when `chartType !== "none"`. |

### ChartType

```typescript
export type ChartType = "bar" | "line" | "none"
```

| Value | Used By | Frontend Component |
|---|---|---|
| `"bar"` | Most analytics/scan tools | `components/charts/` bar chart |
| `"line"` | `queryLeadsSalesTimeline` only | `components/charts/` line chart |
| `"none"` | All CRUD, calendar, email, export tools | No chart rendered |

### Pagination Pattern (CRUD List Tools)

All list tools share this pagination structure:

```typescript
{
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  [entityName]: Array<{ ... }>
}
```

### Update Pattern (CRUD Update Tools)

All update tools return:

```typescript
{
  [entityName]: { ... }      // The updated entity
  updatedFields: string[]     // Names of fields that were changed
}
```

---

## 6. Explainability

The explainability system (`lib/agent/explainability.ts`) provides audit metadata for every agent turn where tools were invoked. Data is sent to the frontend as a message annotation and displayed in the "Logs" tab.

### buildExplainability()

```typescript
function buildExplainability(
  toolCalls: ToolCallLog[],
  recordCounts: Record<string, number>,
): ExplainabilityData
```

### ExplainabilityData Interface

```typescript
interface ExplainabilityData {
  type: "explainability"
  turnId: string                          // UUID per turn
  toolsUsed: Array<{
    toolName: string
    toolLabel: string                     // Czech label (e.g., "Dotaz na nove klienty")
    params: Record<string, unknown>       // Sanitized (sensitive params hidden, long strings truncated)
    durationMs?: number
  }>
  dataSources: string[]                   // e.g., ["PostgreSQL: clients", "Google Calendar API"]
  recordCounts: Record<string, number>    // e.g., { "queryNewClients": 12 }
  filters: Record<string, string>         // e.g., { "Rok": "2025", "Kvartal": "Q1" }
  limitations: string[]                   // Currently unused (always [])
  timestamp: string                       // ISO 8601
}
```

### What It Captures

| Field | Source |
|---|---|
| `toolsUsed` | From `ToolCallLog[]` accumulated in `onStepFinish` callback |
| `dataSources` | Static mapping per tool (e.g., `createShowing` maps to `["PostgreSQL: showings", "Google Calendar API"]`) |
| `recordCounts` | Extracted from tool results during `onStepFinish` (fields: `totalCount`, `totalClients`, `totalLeads`, `totalEvents`, `totalFreeSlots`, `totalJobs`, `totalResults`) |
| `filters` | Extracted from tool parameters (year, quarter, monthsBack, weeksBack, district, status, type, limit, offset, days, source, segment) |

### Sensitive Parameter Handling

These parameter keys are excluded from explainability output:

- `googleEventId`, `googleCalendarEventId`
- `draftId`, `pptxToken`, `token`, `secret`

String values longer than 200 characters are truncated to 100 characters with an ellipsis.

### Delivery Mechanism

Explainability data is appended as a message annotation via `StreamData.appendMessageAnnotation()` in the `onFinish` callback of `streamText()`. The frontend receives it through the SSE data stream.

---

## 7. Agent Run Logging

Every agent interaction is logged to the `AgentRun` database table via `logAgentRun()` in `lib/agent/run-logger.ts`.

### logAgentRun()

```typescript
interface LogAgentRunParams {
  sessionId: string
  userQuery: string
  toolsCalledJson: ToolCallLog[]
  outputSummary: string | null
}

async function logAgentRun(params: LogAgentRunParams): Promise<void>
```

### Behavior

- **Fire-and-forget:** Called with `.catch(console.error)` in `onFinish`. Never blocks the streaming response.
- **User query capped** at 1000 characters.
- **Output summary capped** at 500 characters (the agent's text response).
- **toolsCalledJson** stores the complete `ToolCallLog[]` array as JSON in PostgreSQL.

### ToolCallLog

```typescript
interface ToolCallLog {
  toolName: string
  params: Record<string, unknown>
  startedAt?: number   // Date.now() timestamp
}
```

---

## 8. Message History Trimming

The chat endpoint (`app/api/chat/route.ts`) trims previous tool results to prevent conversation history from exceeding context limits.

### Three-Layer Strategy

| Layer | What it does |
|---|---|
| **Hard cap** | Keep only the last 20 messages |
| **Payload stripping** | Replace `data:` URLs with `"[file already delivered]"`, truncate markdown/HTML to 500 chars, clear `chartData` arrays entirely |
| **Array capping** | Large arrays (properties, clients, leads, etc.) capped to 3 items with `_keyTotal` metadata preserving the original count |

### Trimmable Arrays

The following array keys are subject to the 3-item cap:

```
properties, clients, leads, deals, showings, events, results,
investors, renovations, overdueTasks, dueSoonTasks, categories,
topListings, weeks, timeline, byDistrict, byPhase, bySource,
byDisposition, byStage, byPriority, freeSlots, byDate, jobs,
documents, tasks, issues
```

### Incomplete Tool Results

If a tool invocation in the message history has `state !== "result"` or is missing a result, it is replaced with a fallback:

```typescript
{
  toolName: inv.toolName ?? "unknown",
  error: "Tool call did not complete. Please retry.",
  chartType: "none",
}
```

---

## 9. Adding a New Tool (Step-by-Step Guide)

### Step 1: Create the Tool File

Create `lib/agent/tools/myNewTool.ts`:

```typescript
import { tool } from "ai"
import { z } from "zod"
import type { MyNewToolResult } from "@/types/agent"

export const myNewToolTool = tool({
  description: "Czech description for the LLM...",
  parameters: z.object({
    // Zod schema with .describe() on each field
  }),
  execute: async (params): Promise<MyNewToolResult> => {
    // Implementation
    return {
      toolName: "myNewTool",
      chartType: "none",   // or "bar" / "line"
      // ... result fields
    }
  },
})
```

### Step 2: Add Result Type

In `types/agent.ts`, add the result interface and include it in the union:

```typescript
export interface MyNewToolResult {
  toolName: "myNewTool"
  chartType: "bar"    // or "line" | "none"
  chartData: Array<{ name: string; pocet: number }>
  // ... other fields
}

// Add to AgentToolResult union:
export type AgentToolResult =
  | ...existing types...
  | MyNewToolResult
```

### Step 3: Export from Index

In `lib/agent/tools/index.ts`:

```typescript
import { myNewToolTool } from "./myNewTool"

export const agentTools = {
  // ... existing tools
  myNewTool: myNewToolTool,
} as const
```

### Step 4: Register in Tool Selector

In `lib/agent/tool-selector.ts`:

1. Add to an existing group or create a new one in `TOOL_GROUPS`:

```typescript
const TOOL_GROUPS: Record<string, ToolName[]> = {
  // Add to existing group:
  ANALYTICS: [...existing, "myNewTool"],
  // Or create a new group:
  MY_GROUP: ["myNewTool"],
}
```

2. Add Czech keyword mappings in `KEYWORD_GROUPS`:

```typescript
const KEYWORD_GROUPS: [string, string[]][] = [
  // ... existing
  ["myklicoveslovo", ["ANALYTICS"]],  // or your new group
]
```

### Step 5: Add Chart Component (if chartType is not "none")

If the tool returns chart data, add or reuse a chart component in `components/charts/`. Recharts renders the `chartData` array directly.

### Step 6: Update ResultsPanel Tab Switching (if needed)

In `components/results/ResultsPanel.tsx`:

1. Add a subtitle case in `getResultSubtitle()`.
2. Add tab auto-switching logic if the new tool result needs special rendering (e.g., a new tab type).

### Step 7: Update System Prompt

In `lib/agent/prompts.ts`, add guidance for when the agent should use the new tool, especially if it has dependencies on other tools (like `generatePresentation` requiring data from `queryWeeklyKPIs`).

### Step 8: Handle Trimming

If the tool result contains large arrays, ensure the array key names are added to the `TRIMMABLE_ARRAYS` list in `app/api/chat/route.ts` so they are properly capped during message history trimming.

### Step 9: Update Explainability (optional)

In `lib/agent/explainability.ts`:

1. Add a Czech label in `TOOL_LABELS`.
2. Add data source mapping in `DATA_SOURCES`.

---

## 10. See Also

- [architecture.md](architecture.md) -- Overall system architecture and request flow
- [backend.md](backend.md) -- API routes, streaming, and server-side logic
- [database.md](database.md) -- Prisma schema, query patterns, and seed data
- [frontend.md](frontend.md) -- React components, tab rendering, and chart integration
- [integrations.md](integrations.md) -- Google Calendar, Gmail, Twilio, and ElevenLabs details
- [deployment.md](deployment.md) -- Vercel deployment, cron jobs, and environment variables
