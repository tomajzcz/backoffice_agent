# Database

PostgreSQL via Prisma ORM. Hosted on [Neon](https://neon.tech). Schema defined in `prisma/schema.prisma`.

## Connection

```
DATABASE_URL   — pooled connection (application queries)
DIRECT_URL     — direct connection (migrations only)
```

Prisma client singleton: `lib/db/prisma.ts`.

## Models (15)

### Core Business

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| **Client** | `clients` | name, email (unique), phone, acquisitionSource, segment | → Deal[], Showing[], Property[] (owner), Investor?, CallLog[] |
| **Lead** | `leads` | name, email, phone, source, status, propertyInterest, convertedAt | — |
| **Property** | `properties` | address, district, type, price, status, areaM2, disposition, lifecycleStage, purchasePrice, renovationCost, expectedSalePrice, ownerId | → Deal[], Showing[], AgentTask[], Document[], InvestorProperty[], Renovation[] |
| **Deal** | `deals` | propertyId, clientId, status, value, closedAt | → Client, Property, AgentTask[] |
| **Showing** | `showings` | propertyId, clientId, scheduledAt, status, notes, googleCalendarEventId | → Client, Property, CallLog[] |

### Operations

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| **AgentTask** | `agent_tasks` | title, description, status, priority, dueDate, assignee, sourceQuery | → Property?, Deal?, Renovation? (polymorphic) |
| **WeeklyReport** | `weekly_reports` | weekStart (unique date), newLeads, newClients, propertiesListed, dealsClosed, revenue | — |
| **AgentRun** | `agent_runs` | sessionId, userQuery, toolsCalledJson, outputSummary | — |

### Monitoring & External

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| **ScheduledJob** | `scheduled_jobs` | name, description, cronExpr, status, configJson, notifyEmail, lastRunAt | → MonitoringResult[] |
| **MonitoringResult** | `monitoring_results` | jobId, source, title, url, price, district, disposition, areaM2, pricePerM2, score, scoreReason, isNew | → ScheduledJob |

### Investments

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| **Investor** | `investors` | name, email (unique), phone, company, notes, clientId (unique) | → Client? (one-to-one), InvestorProperty[] |
| **InvestorProperty** | `investor_properties` | investorId, propertyId, investedAmount, notes | → Investor, Property (unique compound) |

### Documents & Calls

| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| **Document** | `documents` | propertyId, type (enum), name, url, notes | → Property |
| **CallLog** | `call_logs` | showingId, clientId, phoneNormalized, status, elevenLabsCallId, callDate | → Showing, Client (unique on showingId+callDate) |
| **Renovation** | `renovations` | propertyId, phase, status, startedAt, plannedEndAt, budgetPlanned, budgetActual, isDelayed, blockers, contractorName | → Property, AgentTask[] |

## Enums (15)

| Enum | Values | Czech Labels |
|------|--------|-------------|
| **LeadStatus** | NEW, CONTACTED, QUALIFIED, CONVERTED, LOST | Novy, Kontaktovan, Kvalifikovan, Konvertovan, Ztraceny |
| **PropertyType** | BYT, DUM, POZEMEK, KOMERCNI | Byt, Dum, Pozemek, Komercni |
| **PropertyStatus** | AVAILABLE, IN_NEGOTIATION, SOLD, RENTED, WITHDRAWN | Dostupne, V jednani, Prodano, Pronajato, Stazeno |
| **LifecycleStage** | ACQUISITION, IN_RENOVATION, READY_FOR_SALE, LISTED, SOLD | Akvizice, V rekonstrukci, Pripraveno k prodeji, Inzerovano, Prodano |
| **DealStatus** | IN_PROGRESS, CLOSED_WON, CLOSED_LOST | Probiha, Uzavreno-vyhra, Uzavreno-prohra |
| **ClientSegment** | INVESTOR, PRVNI_KUPUJICI, UPGRADER, DOWNGRADER, PRENAJIMATEL | Investor, Prvni kupujici, Upgrader, Downgrader, Pronajimatel |
| **AcquisitionSource** | SREALITY, BEZREALITKY, DOPORUCENI, WEB, INZERCE, LINKEDIN | Sreality, Bezrealitky, Doporuceni, Web, Inzerce, LinkedIn |
| **ShowingStatus** | SCHEDULED, COMPLETED, CANCELLED, NO_SHOW | Naplanovana, Dokoncena, Zrusena, Nedostavil se |
| **TaskStatus** | OPEN, IN_PROGRESS, DONE, CANCELLED | Otevreny, Probiha, Hotovo, Zruseno |
| **TaskPriority** | LOW, MEDIUM, HIGH, URGENT | Nizka, Stredni, Vysoka, Urgentni |
| **JobStatus** | ACTIVE, PAUSED, ERROR | Aktivni, Pozastaveno, Chyba |
| **DocumentType** | KUPNI_SMLOUVA, NAVRH_NA_VKLAD, ZNALECKY_POSUDEK, ENERGETICKY_STITEK, LIST_VLASTNICTVI, FOTODOKUMENTACE, OSTATNI | Czech document names |
| **RenovationPhase** | PLANNING → DEMOLITION → ROUGH_WORK → INSTALLATIONS → SURFACES → FINISHING → READY_FOR_HANDOVER → COMPLETED, ON_HOLD | Czech phase names |
| **RenovationStatus** | ACTIVE, COMPLETED, ON_HOLD | Aktivni, Dokoncena, Pozastavena |
| **CallStatus** | PENDING, INITIATED, FAILED, NO_PHONE, SKIPPED | — |

Czech labels are defined in `lib/constants/labels.ts` and used across UI components.

## Key Relationships

```
Property (central node)
├── Deal[] ←→ Client
├── Showing[] ←→ Client → CallLog[]
├── Document[]
├── InvestorProperty[] ←→ Investor ←→ Client (one-to-one)
├── Renovation[] → AgentTask[]
└── AgentTask[] (polymorphic: also links to Deal, Renovation)
```

**Property** is the hub — most queries start from or join through Property.

**AgentTask** is polymorphic — it links to one of: Property, Deal, or Renovation via optional foreign keys.

**Investor ↔ Client** is one-to-one — an investor is always linked to a client record.

## Indexes

Deliberate indexing strategy:
- **Temporal**: `createdAt` on all core models for chronological queries
- **Status**: `status` on Lead, Property, Deal, Showing, AgentTask, Renovation for filtered lists
- **Domain**: `district` on Property, `acquisitionSource` on Client, `phase`/`isDelayed` on Renovation
- **Compound unique**: `[showingId, callDate]` on CallLog (idempotent daily calls), `[investorId, propertyId]` on InvestorProperty

## Query Layer

`lib/db/queries/` — one file per domain (13 files):

| File | Key Functions |
|------|--------------|
| `clients.ts` | getNewClientsByQuarter(), CRUD |
| `leads.ts` | Lead queries with status/source filtering |
| `properties.ts` | Property CRUD, lifecycle queries |
| `deals.ts` | Deal CRUD with property/client joins |
| `showings.ts` | Showing CRUD, calendar sync |
| `weekly-reports.ts` | KPI aggregation over week ranges |
| `tasks.ts` | Task CRUD with polymorphic links |
| `health.ts` | `runOperationalHealthScan()` — cross-model aggregation |
| `investors.ts` | Investor portfolio, profitability calculations |
| `documents.ts` | Document CRUD, missing document scanning |
| `monitoring.ts` | Job/result CRUD, deduplication |
| `renovations.ts` | Renovation queries, health scoring |
| `call-logs.ts` | Call tracking, idempotent creation |

All queries use Prisma's type-safe API with pagination (`limit`/`offset`/`hasMore` pattern), date range filtering (`gte`/`lt`), and enum filtering.

## Seed Data

`prisma/seed.ts` — deterministic generation with `faker.seed(42)`, Czech locale.

| Entity | Count | Notes |
|--------|-------|-------|
| Clients | 45 | Mixed segments, weighted recent dates |
| Leads | 150 | Various statuses and sources |
| Properties | 55 | 15 intentionally missing renovation data |
| Deals | 22 | Mix of in-progress, won, lost |
| Showings | 40 | Linked to property-client pairs |
| Weekly Reports | 18 | KPI snapshots |
| Monitoring Jobs | 2 | Active scraper configurations |
| Investors | ~10 | Linked to client records |
| Renovations | ~15 | Various phases and statuses |
| Documents | ~50 | Across properties |

Prague districts (all 12): Praha 1–10 + Vinohrady, Zizkov, Karlin, Smichov, Dejvice, Letna, Holesovice, Nusle, Vrsovice, Brevnov.

## Migration Workflow

```bash
# After changing schema.prisma:
npm run db:migrate    # Create + apply migration
npm run db:generate   # Regenerate Prisma client

# Full reset (destructive):
npm run db:reset      # Drop all → migrate → seed
```

## See Also

- [Tools](./tools.md) — which tools query which tables
- [Backend](./backend.md) — API routes that interact with the database
- [Deployment](./deployment.md) — Neon PostgreSQL setup
