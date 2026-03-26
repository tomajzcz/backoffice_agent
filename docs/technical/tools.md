# Tool System

The agent has **45 tools** registered in `lib/agent/tools/index.ts`. Each tool is a separate file using Vercel AI SDK's `tool()` function.

## Architecture

```
lib/agent/tools/
├── index.ts                     # Exports agentTools object (all 45)
├── queryNewClients.ts           # Example: analytics tool
├── listProperties.ts            # Example: CRUD tool
├── createCalendarEvent.ts       # Example: integration tool
└── ...                          # One file per tool
```

Every tool follows the same pattern:

```typescript
import { tool } from "ai"
import { z } from "zod"

export const myToolTool = tool({
  description: "What this tool does (used by the LLM to decide when to call it)",
  parameters: z.object({
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional(),
  }),
  execute: async ({ param1, param2 }) => {
    // Business logic — DB queries, API calls, etc.
    return {
      toolName: "myTool" as const,
      chartType: "bar" as const,  // "bar" | "line" | "none"
      chartData: [...],
      // ... tool-specific fields
    }
  },
})
```

**Key pattern**: Every tool returns a typed result with `toolName` discriminant and `chartType` field. The frontend uses `toolName` to auto-switch tabs and render appropriate UI.

## Tool Categories (45 total)

### Analytics (5)

| Tool | Description | Returns |
|------|-------------|---------|
| `queryNewClients` | Q1–Q4 breakdown by acquisition source | Bar chart + client table |
| `queryLeadsSalesTimeline` | Monthly lead/sale conversion trends | Line chart + timeline |
| `queryWeeklyKPIs` | 52-week KPI snapshots (leads, clients, deals, revenue) | Bar chart + totals |
| `scanMissingRenovationData` | Properties missing renovation data | Bar chart + property list |
| `generateReport` | Markdown report from structured data | Markdown + download |

### Operational Intelligence (8)

| Tool | Description | Returns |
|------|-------------|---------|
| `queryPropertiesByLifecycle` | Pipeline by stage (akvizice → prodano) | Chart + grouped properties |
| `scanOverdueTasks` | Overdue and due-soon tasks | Task list with counts |
| `scanOperationalHealth` | Comprehensive operational audit | Health score (0–100) + categories |
| `calculatePropertyProfitability` | ROI analysis by property/district | Profitability table + averages |
| `getInvestorOverview` | Portfolio summaries per investor | Investor details + properties |
| `getPropertyDocuments` | Document listing for a property | Document list |
| `scanMissingDocuments` | Properties missing mandatory documents | Flagged properties |
| `analyzeNewListings` | Analyze monitoring results for market trends | Scored listing analysis |

### Google Integration (6)

| Tool | Description | Returns |
|------|-------------|---------|
| `getCalendarAvailability` | Free slots (9–18h, weekdays, 30min minimum) | Slot list by day |
| `createCalendarEvent` | Create event, optionally linked to showing | Event details |
| `updateCalendarEvent` | Update existing calendar event | Updated event |
| `deleteCalendarEvent` | Delete event, cascade to showing | Confirmation |
| `listCalendarEvents` | Events in date range | Event list |
| `createGmailDraft` | Create email draft (never auto-sends) | Draft with subject/body |

### Export (2)

| Tool | Description | Returns |
|------|-------------|---------|
| `generatePresentation` | PPTX with 1–10 slides from pool of 10 | Download URL + slide count |
| `sendPresentationEmail` | Send PPTX as Gmail attachment | Confirmation |

### Monitoring (4)

| Tool | Description | Returns |
|------|-------------|---------|
| `listScheduledJobs` | All monitoring job configurations | Job list with status/cron |
| `createMonitoringJob` | Define new scraper job | Created job details |
| `triggerMonitoringJob` | Manual job execution | Trigger result + listing count |
| `getMonitoringResults` | Listings found by job | Result list with scores |

### CRUD (15)

Five entities (Properties, Clients, Leads, Deals, Showings) each have three operations:

| Operation | Pattern | Returns |
|-----------|---------|---------|
| `list{Entity}` | Paginated list with filters (status, source, district, etc.) | Array + totalCount + hasMore |
| `create{Entity}` | Create from parameters | Created record |
| `update{Entity}` | Partial update by ID | Updated record |

All CRUD tools support:
- Pagination: `limit` (default 20) + `offset`
- Status filtering via enum parameters
- Sort by `createdAt` descending

### Renovation Management (3)

| Tool | Description | Returns |
|------|-------------|---------|
| `queryActiveRenovations` | Active renovations by phase/district | Grouped renovation list |
| `getRenovationDetail` | Full detail: phase, budget, tasks, blockers | Renovation with tasks |
| `scanRenovationHealth` | Delayed/over-budget detection | Health score (0–100) + issues |

### Other (2)

| Tool | Description | Returns |
|------|-------------|---------|
| `createAgentTask` | Create task linked to property/deal/renovation | Task details |
| `getPropertyDetails` | Full property context with deals, showings, docs | Property aggregate |

## Type System

All tool results are defined in `types/agent.ts`:

```typescript
export type AgentToolResult =
  | QueryNewClientsResult
  | QueryLeadsSalesTimelineResult
  | ScanMissingRenovationResult
  | CreateAgentTaskResult
  | QueryWeeklyKPIsResult
  | GenerateReportResult
  | GeneratePresentationResult
  // ... 38 more result types
```

Every result includes:
- `toolName: string` — discriminant for frontend routing
- `chartType: "bar" | "line" | "none"` — tells ChartTab which chart to render

### Chart Data Contract

Tools with `chartType: "bar"` return:
```typescript
chartData: Array<{ name: string; pocet: number }>
```

Tools with `chartType: "line"` return:
```typescript
chartData: Array<{ name: string; leady: number; prodeje: number }>
```

Czech field names (`pocet` = count, `leady` = leads, `prodeje` = sales) are used because the chart labels render directly from data keys.

## Explainability

`lib/agent/explainability.ts` builds metadata for each tool call:

```typescript
type ExplainabilityData = {
  toolsUsed: Array<{ toolLabel: string; params: Record<string, unknown> }>
  dataSources: string[]           // e.g., "PostgreSQL: clients", "Google Calendar API"
  recordCounts: Record<string, number>
  filters: Record<string, string>  // Extracted from params
  limitations: string[]
}
```

- Tool labels are in Czech (e.g., "Analýza nových klientů")
- Parameters are sanitized (tokens stripped, long strings truncated)
- Data sources are mapped per tool (each tool declares what it accesses)
- Rendered in the "Odpověď" tab as a collapsible section

## Agent Run Logging

`lib/agent/run-logger.ts` logs every interaction:

```typescript
logAgentRun({
  sessionId: string,
  userQuery: string,
  toolsCalledJson: ToolCallLog[],
  outputSummary: string | null,
})
```

Logging is fire-and-forget — it never blocks the streaming response. Logs are viewable in the "Logy" tab via `GET /api/agent-runs`.

## Adding a New Tool

1. **Create file**: `lib/agent/tools/myNewTool.ts`
   - Define Zod schema for parameters
   - Implement `execute` function
   - Return typed result with `toolName` and `chartType`

2. **Add result type**: `types/agent.ts`
   - Define `MyNewToolResult` interface
   - Add to `AgentToolResult` union

3. **Register tool**: `lib/agent/tools/index.ts`
   - Import and add to `agentTools` object

4. **Frontend rendering**: `components/results/ResultsPanel.tsx`
   - Add `toolName` to the appropriate tab-switching branch
   - If new chart type needed: add component in `components/charts/`

5. **Data tab** (if applicable): `components/results/DataTab.tsx`
   - Add rendering logic for the new result type

6. **System prompt**: `lib/agent/prompts.ts`
   - Add tool description and usage guidance for the LLM

## See Also

- [Architecture](./architecture.md) — how tools fit into the request flow
- [Database](./database.md) — data sources tools query
- [Frontend](./frontend.md) — how tool results render in tabs
