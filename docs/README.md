# Back Office Operations Agent

AI-powered conversational agent for managing back office operations at a Prague real estate company. A back office manager named "Pepa" interacts through a Czech-language chat interface to query analytics, manage properties, schedule showings, generate reports, and monitor the market -- all grounded in real database tools, never hallucinated.

Every answer is backed by structured tool execution against a live PostgreSQL database, external API calls, and transparent audit logs.

---

## Key Features

- Natural language queries in Czech with keyword-based tool routing
- 45 specialized tools across 13 categories (analytics, CRUD, export, integrations, monitoring)
- Analytics and KPI dashboards with interactive Recharts visualizations
- Google Calendar integration (availability checks, event booking, rescheduling)
- Gmail draft creation with attachments (human-in-the-loop, never auto-sends)
- Twilio SMS confirmations for showing creation, updates, and cancellations
- ElevenLabs outbound voice reminders for upcoming showings
- PPTX, PDF, and CSV export with token-based download system
- Market monitoring via Sreality and Bezrealitky scrapers on automated schedules
- Full data management UI at `/sprava` for all entities
- Automation dashboard at `/dashboard` for monitoring jobs and cron oversight
- Renovation project tracking with per-property detail views
- Investor portfolio management and profitability calculations
- Operational health scoring across properties, leads, and tasks
- Explainability panel showing tools used, data sources, filters, and record counts

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3 |
| AI | Vercel AI SDK + @ai-sdk/anthropic | 4.3 |
| LLM | Claude Sonnet 4.6 | -- |
| Database | PostgreSQL (Neon) + Prisma | 6.5 |
| UI | React, Radix UI, Tailwind CSS, Recharts | 19 / 3.4 |
| Export | PptxGenJS, PDFKit | 4.0 / 0.18 |
| Google | googleapis | 171.4 |
| SMS | Twilio | -- |
| Voice | ElevenLabs | -- |
| Validation | Zod | 3.24 |
| Language | TypeScript (strict mode) | 5 |

---

## Application Pages

| Page | URL | Description |
|------|-----|-------------|
| Chat | `/` | AI agent conversation with split-screen results panel (6 tabs) |
| Data Management | `/sprava` | CRUD interface for properties, clients, leads, deals, showings |
| Automation | `/dashboard` | Monitoring jobs, reminder call logs, executive report history |

The chat interface uses a dark theme with amber accents. The layout is split-screen: a 400px chat panel on the left, and a flex-1 results panel on the right with six tabs -- Answer, Data, Chart, Report, Email, and Logs.

---

## Quick Start

```bash
git clone <repo-url>
cd backoffice_agent
npm install
cp .env.example .env.local   # fill in required values (see Environment Variables)
npm run db:migrate
npm run db:seed
npm run dev
```

### Environment Variables

```
DATABASE_URL            # PostgreSQL connection string (Neon)
DIRECT_URL              # Direct DB connection for migrations
ANTHROPIC_API_KEY       # Claude API key
GOOGLE_CLIENT_ID        # Google OAuth2
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
TWILIO_ACCOUNT_SID      # Twilio SMS
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER     # E.164 format
CRON_SECRET             # Vercel cron authorization
```

---

## Example Conversations

### 1. Morning Briefing

**Prompt:** `"Jaky je stav operativy?"`

The agent calls `scanOperationalHealth`, `scanRenovationHealth`, and `scanOverdueTasks` to produce a combined operations status report with health scores and flagged issues.

### 2. Book a Showing

**Prompt:** `"Naplánuj prohlídku na Vinohradské 15 pro Jana Nováka"`

Multi-step execution: `getPropertyDetails` to resolve the property, `getCalendarAvailability` to find a free slot, then `createShowing` which also triggers an SMS confirmation via Twilio and creates a Google Calendar event.

### 3. Investor Report

**Prompt:** `"Připrav přehled portfolia pro investory"`

Runs `getInvestorOverview` and `calculatePropertyProfitability`, then `generatePresentation` to produce a downloadable PPTX deck with KPI slides.

### 4. Market Check

**Prompt:** `"Co je nového na trhu v Holešovicích?"`

Calls `listScheduledJobs` and `getMonitoringResults` to pull the latest scraped listings, then `analyzeNewListings` to surface relevant opportunities in the Holesovice district.

---

## How It Works

```
User message (Czech)
    |
    v
POST /api/chat
    |
    v
selectTools() -- keyword matching --> filtered tool subset (13 groups)
    |
    v
streamText() -- Claude Sonnet 4.6, maxSteps: 5
    |
    v
Tool execution --> DB queries / external APIs
    |
    v
SSE streaming response
    |
    v
Frontend auto-switches result tab (Answer | Data | Chart | Report | Email | Logs)
```

The tool selector scans the Czech user input for keywords (e.g., klient, nemovitost, prohlidka) and maps them to relevant tool groups, reducing context size. The CORE group is always included. When no keywords match, all tools are sent as a fallback.

Message history is trimmed with a three-layer strategy: hard cap at 20 messages, payload stripping (base64 data URLs replaced, large content truncated), and array capping (large result sets limited to 3 items with count metadata).

---

## Documentation Index

### Technical Documentation (English)

| Document | Description |
|----------|-------------|
| [Architecture](technical/architecture.md) | System overview, request flow, design decisions |
| [Backend](technical/backend.md) | API routes, tool system, query layer |
| [Frontend](technical/frontend.md) | Components, state management, design system |
| [Database](technical/database.md) | Schema (17 models, 16 enums), relationships, seed data |
| [Tools](technical/tools.md) | Tool catalog (45 tools), type system, categories |
| [Integrations](technical/integrations.md) | Google, Twilio, ElevenLabs, web scrapers |
| [Deployment](technical/deployment.md) | Environment setup, Vercel config, Neon database |
| [Data Flow](technical/data-flow.md) | End-to-end scenario walkthroughs |
| [Design Decisions](technical/design-decisions.md) | Architectural rationale and trade-offs |

### User Documentation (Czech)

| Document | Description |
|----------|-------------|
| [Jak system funguje](user/how-it-works.md) | Prehled systemu a ovladani |
| [Prakticke scenare](user/use-cases.md) | Krok za krokem priklady |
| [Funkce](user/features.md) | Katalog vsech funkci |
| [Co agent umi](user/agent-capabilities.md) | Typy dotazu a moznosti |
| [FAQ](user/faq.md) | Caste otazky |

---

## Demo Presentation Guide

1. **Start with a morning briefing** -- type `"Jaky je stav operativy?"` to show the agent pulling cross-domain operational health data
2. **Explore the Data tab** -- click through the health scoring results, renovation status, and overdue task flags
3. **Book a showing** -- demonstrate multi-step tool chaining with Calendar + SMS integration
4. **Generate an investor report** -- trigger PPTX generation and show the download flow
5. **Open Data Management** -- navigate to `/sprava` to show the CRUD interface for all entities
6. **Show Automation Dashboard** -- navigate to `/dashboard` to demonstrate monitoring jobs and cron schedules

---

## Project Metrics

| Metric | Value |
|--------|-------|
| AI tools | 45 |
| Tool groups | 13 |
| Database models | 17 |
| Database enums | 16 |
| API routes | 10 |
| Automated cron jobs | 3 |
| Result display tabs | 6 |
| External integrations | 4 (Google, Twilio, ElevenLabs, n8n) |
| Export formats | 3 (PPTX, PDF, CSV) |
| Max tool steps per turn | 5 |

---

## Cron Jobs

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| Market Monitoring | 5 AM Mon--Fri | `/api/cron/monitoring` | Scrape Sreality and Bezrealitky, deduplicate, persist to DB |
| Reminder Calls | 5 AM daily | `/api/cron/daily-reminder-calls` | ElevenLabs outbound voice calls for today's showings |
| Weekly Report | 7 AM Monday | `/api/cron/weekly-report` | Executive PPTX report with KPI slides, emailed via Gmail |

All cron endpoints validate `CRON_SECRET` via the Authorization header.

---

## License

Private project. Not open source.
