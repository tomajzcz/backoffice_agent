# Database Schema Documentation

## 1. Overview

| Attribute | Value |
|-----------|-------|
| Provider | PostgreSQL (hosted on [Neon](https://neon.tech) serverless) |
| ORM | Prisma 6.5 (`@prisma/client` ^6.5.0) |
| Schema file | `prisma/schema.prisma` |
| Client singleton | `lib/db/prisma.ts` (global cache in dev, graceful shutdown via `beforeExit`) |
| Models | 17 |
| Enums | 16 |
| Query layer | 14 files in `lib/db/queries/` |

The Prisma client is instantiated once and cached on `globalThis` during development to prevent multiple clients accumulating across hot reloads. In production a single instance is created per process. A `beforeExit` handler calls `prisma.$disconnect()` to release connections cleanly.

---

## 2. Connection Configuration

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pooled connection (application queries)
  directUrl = env("DIRECT_URL")        // direct connection (migrations only)
}
```

| Variable | Purpose | Typical Value |
|----------|---------|---------------|
| `DATABASE_URL` | Neon pooled connection string used by the application at runtime | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Direct (non-pooled) connection used only by `prisma migrate` | Same host without connection pooling suffix |

---

## 3. Models (17 total)

### 3.1 Core Business Models (5)

#### Client

People (buyers, investors, renters). Central entity linked to most transaction models.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| name | String | required | |
| email | String | unique | |
| phone | String? | optional | |
| acquisitionSource | AcquisitionSource | required | Enum |
| segment | ClientSegment | required | Enum |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** deals[], properties[] (as owner), showings[], callLogs[], investor? (one-to-one)

**Indexes:** `createdAt`, `acquisitionSource`

**Table name:** `clients`

---

#### Lead

Prospects not yet converted to clients. Standalone model (no FK relations).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| name | String | required | |
| email | String | required | Not unique (unlike Client) |
| phone | String? | optional | |
| source | AcquisitionSource | required | Same enum as Client |
| status | LeadStatus | default: NEW | Enum |
| propertyInterest | String? | optional | Free-text description of interest |
| createdAt | DateTime | default: now() | |
| convertedAt | DateTime? | optional | Set when status becomes CONVERTED |

**Relations:** none

**Indexes:** `createdAt`, `source`, `status`, `convertedAt`

**Table name:** `leads`

---

#### Property

Real estate units. The central hub of the data model -- most other entities relate to Property.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| address | String | required | Full address including district |
| district | String | required | e.g., "Praha 7 -- Holesovice" |
| type | PropertyType | required | Enum: BYT, DUM, POZEMEK, KOMERCNI |
| price | Decimal(12,2) | required | Listing price in CZK |
| status | PropertyStatus | default: AVAILABLE | Enum |
| areaM2 | Decimal(8,2) | required | Floor area in square meters |
| disposition | String? | optional | e.g., "3+kk", "2+1" |
| yearBuilt | Int? | optional | |
| lastRenovationYear | Int? | optional | 15 properties intentionally null for data quality scanning |
| renovationNotes | String? | optional | |
| lifecycleStage | LifecycleStage? | optional | Investment lifecycle tracking |
| stageChangedAt | DateTime? | optional | When lifecycle stage last changed |
| purchasePrice | Decimal(12,2)? | optional | Acquisition cost |
| renovationCost | Decimal(12,2)? | optional | Total renovation spend |
| expectedSalePrice | Decimal(12,2)? | optional | Target sale price |
| ownerId | Int? | FK to Client | Optional owner reference |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** owner? (Client), deals[], showings[], tasks[] (AgentTask), documents[], investorProperties[], renovations[]

**Indexes:** `district`, `status`, `createdAt`, `lastRenovationYear`, `lifecycleStage`

**Table name:** `properties`

---

#### Deal

Transactions linking a client to a property.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| propertyId | Int | FK to Property | |
| clientId | Int | FK to Client | |
| status | DealStatus | default: IN_PROGRESS | Enum |
| value | Decimal(12,2) | required | Transaction value in CZK |
| closedAt | DateTime? | optional | Set when deal closes (won or lost) |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** client (Client), property (Property), tasks[] (AgentTask)

**Indexes:** `status`, `closedAt`, `createdAt`

**Table name:** `deals`

---

#### Showing

Property viewings scheduled for clients.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| propertyId | Int | FK to Property | |
| clientId | Int | FK to Client | |
| scheduledAt | DateTime | required | Date and time of the viewing |
| status | ShowingStatus | default: SCHEDULED | Enum |
| notes | String? | optional | |
| googleCalendarEventId | String? | optional | Mapped column: `google_calendar_event_id` |
| createdAt | DateTime | default: now() | |

**Relations:** client (Client), property (Property), callLogs[] (CallLog)

**Indexes:** `scheduledAt`, `status`

**Table name:** `showings`

---

### 3.2 Operations Models (3)

#### AgentTask

Action items created by the AI agent or manually. Polymorphic -- links to one of Property, Deal, or Renovation via optional FKs.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| title | String | required | |
| description | String? | optional | |
| status | TaskStatus | default: OPEN | Enum |
| priority | TaskPriority | default: MEDIUM | Enum |
| dueDate | DateTime? | optional | |
| assignee | String? | optional | Free-text name (e.g., "Pepa", "Martin") |
| propertyId | Int? | FK to Property | |
| dealId | Int? | FK to Deal | |
| renovationId | Int? | FK to Renovation | |
| sourceQuery | String? | optional | The user query that created this task |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** property? (Property), deal? (Deal), renovation? (Renovation)

**Indexes:** `status`, `priority`, `dueDate`, `propertyId`, `dealId`, `renovationId`, `createdAt`

**Table name:** `agent_tasks`

---

#### WeeklyReport

Aggregated KPI snapshots, one per week. Used for trend analysis and executive reporting.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| weekStart | DateTime | unique, @db.Date | Monday of the reporting week |
| newLeads | Int | required | |
| newClients | Int | required | |
| propertiesListed | Int | required | |
| dealsClosed | Int | required | |
| revenue | Decimal(14,2) | required | Total revenue for the week in CZK |
| createdAt | DateTime | default: now() | |

**Relations:** none

**Indexes:** `weekStart` (unique)

**Table name:** `weekly_reports`

---

#### AgentRun

Audit trail for AI agent invocations. Written asynchronously (fire-and-forget) to avoid blocking responses.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| sessionId | String | required | Groups runs within a chat session |
| userQuery | String | required | The user's input message |
| toolsCalledJson | Json | required | Array of tool names invoked |
| outputSummary | String? | optional | Brief summary of the response |
| createdAt | DateTime | default: now() | |

**Relations:** none

**Indexes:** `sessionId`, `createdAt`

**Table name:** `agent_runs`

---

### 3.3 Monitoring Models (2)

#### ScheduledJob

Market monitoring job definitions. Each job scrapes listings from configured sources on a cron schedule.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| name | String | required | e.g., "Monitor Praha Holesovice" |
| description | String? | optional | |
| cronExpr | String | required | Standard cron expression |
| lastRunAt | DateTime? | optional | |
| nextRunAt | DateTime? | optional | |
| status | JobStatus | default: ACTIVE | Enum |
| configJson | Json | required | Locality, sources, filters |
| notifyEmail | String? | optional | Mapped column: `notify_email` |
| createdAt | DateTime | default: now() | |

**Relations:** results[] (MonitoringResult)

**Table name:** `scheduled_jobs`

---

#### MonitoringResult

Individual scraped listing records, scored for investment potential.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| jobId | Int | FK to ScheduledJob | |
| source | String | required | e.g., "sreality", "bezrealitky" |
| title | String | required | Listing title |
| url | String | required | Link to original listing |
| price | Decimal(12,2)? | optional | |
| district | String? | optional | |
| disposition | String? | optional | |
| areaM2 | Decimal(8,2)? | optional | |
| pricePerM2 | Decimal(10,2)? | optional | Computed at scrape time |
| score | Int? | default: 0 | Investment opportunity score (0-100) |
| scoreReason | String? | optional | Explanation of the score |
| foundAt | DateTime | default: now() | |
| isNew | Boolean | default: true | Flipped to false after first display |

**Relations:** job (ScheduledJob)

**Indexes:** `jobId`, `foundAt`, `isNew`, `score`

**Table name:** `monitoring_results`

---

### 3.4 Investment Models (2)

#### Investor

Investment fund or individual investor profiles. Optionally linked one-to-one with a Client record.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| name | String | required | |
| email | String | unique | |
| phone | String? | optional | |
| company | String? | optional | |
| notes | String? | optional | |
| clientId | Int? | unique, FK to Client | One-to-one with Client |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** client? (Client, one-to-one), properties[] (InvestorProperty)

**Indexes:** `createdAt`

**Table name:** `investors`

---

#### InvestorProperty

Many-to-many join table between Investor and Property, with investment metadata.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| investorId | Int | FK to Investor | |
| propertyId | Int | FK to Property | |
| investedAmount | Decimal(12,2)? | optional | Amount invested in CZK |
| notes | String? | optional | |

**Relations:** investor (Investor), property (Property)

**Unique constraint:** `[investorId, propertyId]`

**Indexes:** `investorId`, `propertyId`

**Table name:** `investor_properties`

---

### 3.5 Document Model (1)

#### Document

Files and documents attached to properties.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| propertyId | Int | FK to Property | |
| type | DocumentType | required | Enum |
| name | String | required | Display name |
| url | String? | optional | Link to file (e.g., Google Drive) |
| uploadedAt | DateTime | default: now() | |
| notes | String? | optional | |

**Relations:** property (Property)

**Indexes:** `propertyId`, `type`

**Table name:** `documents`

---

### 3.6 Communication Model (1)

#### CallLog

Voice call tracking for showing reminders via ElevenLabs outbound calls.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| showingId | Int | FK to Showing | |
| clientId | Int | FK to Client | |
| phoneNormalized | String? | optional | E.164 format |
| status | CallStatus | default: PENDING | Enum |
| elevenLabsCallId | String? | optional | Mapped column: `elevenlabs_call_id` |
| errorMessage | String? | optional | |
| callDate | DateTime | @db.Date | Date-only (no time component) |
| createdAt | DateTime | default: now() | |

**Relations:** showing (Showing), client (Client)

**Unique constraint:** `[showingId, callDate]` (idempotency -- prevents duplicate calls for the same showing on the same day)

**Indexes:** `callDate`, `showingId`, `clientId`

**Table name:** `call_logs`

---

### 3.7 Renovation Model (1)

#### Renovation

Construction project tracking for property flips.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| propertyId | Int | FK to Property | |
| phase | RenovationPhase | default: PLANNING | Enum (ordered progression) |
| status | RenovationStatus | default: ACTIVE | Enum |
| startedAt | DateTime | default: now() | |
| plannedEndAt | DateTime? | optional | Target completion date |
| actualEndAt | DateTime? | optional | Actual completion date |
| nextStep | String? | optional | Description of next action |
| blockers | String? | optional | Current blockers/issues |
| ownerName | String? | optional | Project owner name |
| contractorName | String? | optional | Contractor/company name |
| budgetPlanned | Decimal(12,2)? | optional | Planned budget in CZK |
| budgetActual | Decimal(12,2)? | optional | Actual spend to date in CZK |
| isDelayed | Boolean | default: false | Flag for overdue renovations |
| notes | String? | optional | |
| createdAt | DateTime | default: now() | |
| updatedAt | DateTime | @updatedAt | |

**Relations:** property (Property), tasks[] (AgentTask)

**Indexes:** `propertyId`, `status`, `phase`, `isDelayed`

**Table name:** `renovations`

---

### 3.8 Automation Models (2)

#### AutomationConfig

Configuration for automated cron jobs (reminder calls, executive reports).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| key | String | unique | e.g., "daily_reminder_calls", "weekly_executive_report" |
| isActive | Boolean | default: true | Mapped column: `is_active` |
| recipientEmail | String | required | Mapped column: `recipient_email` |
| cronExpr | String | required | Mapped column: `cron_expr` |
| configJson | Json? | optional | Mapped column: `config_json` |
| createdAt | DateTime | default: now() | Mapped column: `created_at` |
| updatedAt | DateTime | @updatedAt | Mapped column: `updated_at` |

**Relations:** none

**Table name:** `automation_configs`

---

#### ExecutiveReportRun

Audit trail for weekly executive report generation.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Int | PK, autoincrement | |
| status | ExecutiveReportStatus | default: RUNNING | Enum |
| trigger | String | default: "cron" | "cron" or "manual" |
| recipientEmail | String | required | Mapped column: `recipient_email` |
| slideCount | Int? | optional | Mapped column: `slide_count` |
| pptxToken | String? | optional | Download token for generated PPTX |
| errorMessage | String? | optional | Mapped column: `error_message` |
| startedAt | DateTime | default: now() | Mapped column: `started_at` |
| finishedAt | DateTime? | optional | Mapped column: `finished_at` |
| createdAt | DateTime | default: now() | Mapped column: `created_at` |

**Relations:** none

**Indexes:** `startedAt`, `status`

**Table name:** `executive_report_runs`

---

## 4. Enums (16 total)

| Enum | Values | Used By |
|------|--------|---------|
| **AcquisitionSource** | `SREALITY`, `BEZREALITKY`, `DOPORUCENI`, `WEB`, `INZERCE`, `LINKEDIN` | Client.acquisitionSource, Lead.source |
| **ClientSegment** | `INVESTOR`, `PRVNI_KUPUJICI`, `UPGRADER`, `DOWNGRADER`, `PRENAJIMATEL` | Client.segment |
| **LeadStatus** | `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST` | Lead.status |
| **PropertyType** | `BYT`, `DUM`, `POZEMEK`, `KOMERCNI` | Property.type |
| **PropertyStatus** | `AVAILABLE`, `IN_NEGOTIATION`, `SOLD`, `RENTED`, `WITHDRAWN` | Property.status |
| **LifecycleStage** | `ACQUISITION`, `IN_RENOVATION`, `READY_FOR_SALE`, `LISTED`, `SOLD` | Property.lifecycleStage |
| **DealStatus** | `IN_PROGRESS`, `CLOSED_WON`, `CLOSED_LOST` | Deal.status |
| **ShowingStatus** | `SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` | Showing.status |
| **TaskStatus** | `OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED` | AgentTask.status |
| **TaskPriority** | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | AgentTask.priority |
| **JobStatus** | `ACTIVE`, `PAUSED`, `ERROR` | ScheduledJob.status |
| **DocumentType** | `KUPNI_SMLOUVA`, `NAVRH_NA_VKLAD`, `ZNALECKY_POSUDEK`, `ENERGETICKY_STITEK`, `LIST_VLASTNICTVI`, `FOTODOKUMENTACE`, `OSTATNI` | Document.type |
| **RenovationPhase** | `PLANNING`, `DEMOLITION`, `ROUGH_WORK`, `INSTALLATIONS`, `SURFACES`, `FINISHING`, `READY_FOR_HANDOVER`, `COMPLETED`, `ON_HOLD` | Renovation.phase |
| **RenovationStatus** | `ACTIVE`, `COMPLETED`, `ON_HOLD` | Renovation.status |
| **CallStatus** | `PENDING`, `INITIATED`, `FAILED`, `NO_PHONE`, `SKIPPED` | CallLog.status |
| **ExecutiveReportStatus** | `RUNNING`, `SUCCESS`, `FAILED` | ExecutiveReportRun.status |

Czech display labels for all enums are defined in `lib/constants/labels.ts` and used throughout the UI.

---

## 5. Key Relationships

```
                    Investor --- InvestorProperty --- Property
                       |                                |
                    Client?                             |
                       |                                |
Client --------------- Deal ----------------------------+
  |                                                     |
  +--- Showing -----------------------------------------+
  |       |                                             |
  |       +--- CallLog                                  +--- Document
  |                                                     |
  +--- (owner) ----------------------------------------+
                                                        |
                                            AgentTask --+
                                                        |
                                           Renovation --+
                                               |
                                           AgentTask

ScheduledJob --- MonitoringResult

AutomationConfig           (standalone)
ExecutiveReportRun         (standalone)
AgentRun                   (standalone)
WeeklyReport               (standalone)
Lead                       (standalone)
```

**Design notes:**

- **Property is the hub** -- most queries start from or join through Property. It connects to deals, showings, documents, renovations, investors, and tasks.
- **AgentTask is polymorphic** -- it links to one of Property, Deal, or Renovation via optional foreign keys (`propertyId`, `dealId`, `renovationId`).
- **Investor and Client have a one-to-one relationship** -- an investor is always linked to at most one client record (via `clientId` unique constraint on Investor).
- **Lead is standalone** -- leads have no FK relationships; they represent unconverted prospects that exist outside the transactional data model.
- **CallLog uses a compound unique constraint** (`[showingId, callDate]`) to guarantee idempotent daily reminder calls.

---

## 6. Indexing Strategy

### Temporal Indexes

Most models include a `createdAt` index to support chronological queries, dashboards, and date-range filtering.

| Model | Temporal Index Fields |
|-------|---------------------|
| Client | `createdAt` |
| Lead | `createdAt`, `convertedAt` |
| Property | `createdAt` |
| Deal | `createdAt`, `closedAt` |
| Showing | `scheduledAt` |
| AgentTask | `createdAt`, `dueDate` |
| WeeklyReport | `weekStart` (unique) |
| AgentRun | `createdAt` |
| MonitoringResult | `foundAt` |
| Investor | `createdAt` |
| CallLog | `callDate` |
| ExecutiveReportRun | `startedAt` |

### Status Indexes

Filtered list queries rely on status indexes to avoid full table scans.

| Model | Status Index Fields |
|-------|--------------------|
| Lead | `status`, `source` |
| Property | `status`, `lifecycleStage` |
| Deal | `status` |
| Showing | `status` |
| AgentTask | `status`, `priority` |
| ScheduledJob | (via `status` column, no explicit index) |
| Renovation | `status`, `phase`, `isDelayed` |
| MonitoringResult | `isNew`, `score` |
| ExecutiveReportRun | `status` |

### Domain-Specific Indexes

| Model | Field | Purpose |
|-------|-------|---------|
| Property | `district` | Filter by Prague district |
| Property | `lastRenovationYear` | Data quality scanning for missing renovation data |
| Client | `acquisitionSource` | Acquisition funnel analysis |
| AgentTask | `propertyId`, `dealId`, `renovationId` | Polymorphic FK lookups |
| Document | `type` | Filter by document category |
| CallLog | `showingId`, `clientId` | FK lookups |
| InvestorProperty | `investorId`, `propertyId` | FK lookups |
| MonitoringResult | `jobId` | FK lookup |
| Renovation | `propertyId` | FK lookup |

### Compound Unique Constraints

| Model | Fields | Purpose |
|-------|--------|---------|
| CallLog | `[showingId, callDate]` | Idempotent daily reminder calls |
| InvestorProperty | `[investorId, propertyId]` | Prevent duplicate investor-property links |

---

## 7. Query Layer

All database access goes through `lib/db/queries/` -- one file per domain (14 files total). Query functions use Prisma's type-safe API with consistent patterns: pagination (`limit`/`offset`), date range filtering (`gte`/`lt`), enum filtering, and sorted output.

| File | Key Exported Functions | Description |
|------|----------------------|-------------|
| `clients.ts` | `listClientsQuery`, `createClientQuery`, `updateClientQuery`, `deleteClientQuery`, `getNewClientsByQuarter`, `getClientsByYear` | Client CRUD and quarterly acquisition analytics |
| `properties.ts` | `listPropertiesQuery`, `getPropertyById`, `createPropertyQuery`, `updatePropertyQuery`, `deletePropertyQuery`, `getMissingRenovationProperties`, `getPropertiesByLifecycle`, `getPropertiesWithCosts` | Property CRUD, lifecycle queries, cost analysis, data quality scanning |
| `leads.ts` | `listLeadsQuery`, `createLeadQuery`, `updateLeadQuery`, `deleteLeadQuery`, `getLeadsSalesTimeline` | Lead CRUD and monthly funnel timeline |
| `deals.ts` | `listDealsQuery`, `createDealQuery`, `updateDealQuery`, `deleteDealQuery` | Deal CRUD with property/client joins |
| `showings.ts` | `listShowingsQuery`, `createShowingQuery`, `updateShowingQuery`, `getShowingByIdQuery`, `deleteShowingQuery` | Showing CRUD with calendar sync support |
| `tasks.ts` | `listTasksQuery`, `createTask`, `updateTaskQuery`, `deleteTaskQuery`, `getOverdueTasks`, `getUpcomingTasks` | Task CRUD with polymorphic links, overdue/upcoming scanning |
| `renovations.ts` | `listRenovationsQuery`, `getRenovationByIdQuery`, `getActiveRenovationForProperty`, `createRenovationQuery`, `updateRenovationQuery`, `deleteRenovationQuery`, `getActiveRenovations`, `scanRenovationHealth` | Renovation CRUD, health scoring, active project tracking |
| `health.ts` | `runOperationalHealthScan` | Cross-model aggregation across 6 categories (properties, deals, tasks, renovations, documents, showings) |
| `monitoring.ts` | `getScheduledJobs`, `getScheduledJobById`, `getMonitoringResultsByJob`, `getMonitoringResultsScored`, `createScheduledJob`, `updateScheduledJob`, `deleteScheduledJob`, `createMonitoringResults`, `updateJobLastRun` | Job/result CRUD, deduplication, scored result queries |
| `weekly-reports.ts` | `getWeeklyReports` | KPI aggregation over configurable week ranges |
| `investors.ts` | `listInvestorsQuery`, `createInvestorQuery`, `updateInvestorQuery`, `deleteInvestorQuery`, `getInvestorOverview` | Investor CRUD, portfolio overview, profitability calculations |
| `documents.ts` | `listDocumentsQuery`, `createDocumentQuery`, `updateDocumentQuery`, `deleteDocumentQuery`, `getPropertyDocuments`, `scanMissingDocuments` | Document CRUD, missing document audit |
| `call-logs.ts` | `getTodaysScheduledShowings`, `getExistingCallLogsForDate`, `createCallLog`, `listCallLogs`, `updateCallLogStatus` | Call tracking, idempotent creation, daily reminder support |
| `executive-reports.ts` | `getAutomationConfig`, `upsertAutomationConfig`, `createReportRun`, `updateReportRun`, `listReportRuns` | Automation config management, executive report audit trail |

### Common Query Patterns

- **Pagination:** Functions accept `limit` and `offset` parameters and return `{ items, total }` (or `{ items, total, hasMore }`).
- **Dynamic where clauses:** Filter parameters are optional; `where` objects are built conditionally using spread syntax.
- **Date range filtering:** Uses Prisma's `gte`/`lt` operators for date-bounded queries.
- **Enum filtering:** Parameters accept enum values directly; Prisma validates at compile time.
- **Sorting:** Most list functions support configurable `orderBy` with defaults (typically `createdAt` descending).

---

## 8. Seed Data

Seed script: `prisma/seed.ts`

Deterministic generation using `@faker-js/faker` with seed `42` and Czech locale (`cs`). The script clears all data in FK-safe order before seeding.

| Entity | Count | Notes |
|--------|-------|-------|
| Client | 45 | Czech names, spread across all 5 segments and 6 sources. Dates weighted recent (Jan 2025 -- Mar 2026). |
| Lead | 150 | ~30% converted. Various statuses and sources. Same date range as clients. |
| Property | 55 | 15 intentionally missing `lastRenovationYear` for data quality scanning. First 10 in premium districts. 25 with financial data (purchasePrice, renovationCost, expectedSalePrice). |
| Deal | 22 | ~65% won, remaining split between in-progress and lost. Values within +/-8% of listing price. |
| Showing | 40 | Mixed statuses (50% completed, rest scheduled/cancelled/no-show). Date range Mar 2025 -- May 2026. |
| WeeklyReport | 18 | One per week. Upward trend with noise for realistic KPI charts. |
| ScheduledJob | 2 | "Monitor Praha Holesovice" (cron 7:00 Mon-Fri) and "Monitor Praha Zizkov" (cron 7:30 Mon-Fri). |
| MonitoringResult | 9 | Pre-scored listings across both jobs. Scores range from 55 to 92. |
| AgentTask | 15 (base) + renovation tasks | 5 overdue, 4 upcoming, 4 done, 2 cancelled. Additional tasks linked to renovations. |
| Renovation | Up to 5 | One per IN_RENOVATION property. Various phases (DEMOLITION through FINISHING). One deliberately delayed. One over budget. |
| Investor | 5 | 3 linked to INVESTOR-segment clients, 2 standalone. Each with 2-4 property links. |
| InvestorProperty | ~15 | Join records with invested amounts at 70-90% of property price. |
| Document | ~70-100 | First 30 properties get 2-5 documents each; remaining 25 get 0-1 (intentionally incomplete for missing document scanning). |
| AutomationConfig | 2 | `daily_reminder_calls` (5 AM daily) and `weekly_executive_report` (7 AM Monday). |

### Prague Districts Used

Praha 1 -- Stare Mesto, Praha 2 -- Vinohrady, Praha 3 -- Zizkov, Praha 4 -- Nusle, Praha 5 -- Smichov, Praha 6 -- Dejvice, Praha 7 -- Holesovice, Praha 8 -- Liben, Praha 9 -- Vysocany, Praha 10 -- Vrsovice, Praha 12 -- Modrany, Praha 13 -- Stodulky.

Premium districts (higher prices): Praha 1, Praha 2, Praha 6.

---

## 9. Migration Commands

```bash
# Generate Prisma client (after schema changes or fresh install)
npm run db:generate        # prisma generate

# Create and apply a migration (development)
npm run db:migrate         # prisma migrate dev

# Seed the database with test data
npm run db:seed            # tsx prisma/seed.ts

# Full reset: drop all tables, re-migrate, re-seed (destructive)
npm run db:reset           # prisma migrate reset --force && tsx prisma/seed.ts

# Open Prisma Studio GUI for visual data browsing
npm run db:studio          # prisma studio
```

### Typical Workflow After Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration and apply it
npm run db:migrate
# 3. Regenerate Prisma client types
npm run db:generate
# 4. Optionally re-seed if seed logic changed
npm run db:seed
```

The `postinstall` script in `package.json` runs `prisma generate` automatically after `npm install`, ensuring the Prisma client is always up to date in CI/CD and fresh clones.

---

## 10. See Also

- [Tools](./tools.md) -- which agent tools query which tables
- [Backend](./backend.md) -- API routes that interact with the database
- [Deployment](./deployment.md) -- Neon PostgreSQL setup and environment variables
