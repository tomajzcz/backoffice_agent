# Back Office Operations Agent

AI-powered assistant for a real estate back office in Prague. Built as a production-quality demo of how an AI agent can manage day-to-day operations — from analytics and scheduling to market monitoring and investor reporting.

## What It Does

**Pepa** runs the back office of a Prague real estate firm. Instead of switching between spreadsheets, email, calendar, and market portals, he talks to an AI agent that handles everything through a single chat interface.

The agent has **45 tools** that connect to a real database, Google Calendar, Gmail, and market scrapers. Every response is backed by real data — no hallucinated numbers.

## Key Features

- **AI Chat** — Natural language interface in Czech, powered by Claude claude-sonnet-4-6
- **Analytics & Reporting** — KPIs, client analysis, lead/sales trends, property profitability
- **Google Calendar** — View availability, book showings, sync events
- **Gmail Integration** — Draft emails with AI, review before sending (never auto-sends)
- **PPTX & PDF Export** — Generate presentations and reports from real data
- **Market Monitoring** — Automated scraping of sreality.cz and bezrealitky.cz at 5 AM
- **Voice Reminders** — Automated showing reminder calls via ElevenLabs
- **Data Management** — Full CRUD UI for properties, clients, leads, deals, showings
- **Operational Health** — 0–100 health score with issue detection
- **Renovation Tracking** — Phase monitoring, budget control, blocker identification

## How It Works

```
User (Czech) → Chat Panel → POST /api/chat → Claude claude-sonnet-4-6 + 45 tools → SSE stream
                                                      ↓
                                              PostgreSQL · Google APIs · Scrapers
                                                      ↓
                              Results Panel ← Typed results with auto-tab switching
                              (Charts · Tables · Reports · Email drafts · Logs)
```

The UI is split-screen: chat on the left, results on the right with 6 tabs that auto-switch based on what the agent returns.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5 |
| AI | Claude claude-sonnet-4-6 via Vercel AI SDK |
| Database | PostgreSQL (Neon) + Prisma 6 |
| UI | Tailwind CSS, shadcn/ui, Recharts |
| Export | PptxGenJS, PDFKit |
| Voice | ElevenLabs Conversational AI |
| Google | Calendar API, Gmail API (googleapis) |
| Scraping | cheerio (sreality.cz, bezrealitky.cz) |
| Hosting | Vercel (with cron jobs) |

## Quick Start

```bash
git clone <repo-url>
cd backoffice-agent
npm install
cp .env.example .env.local    # Fill in: DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY
npm run db:migrate
npm run db:seed
npm run dev                    # → http://localhost:3000
```

Minimum required env vars: `DATABASE_URL`, `DIRECT_URL`, `ANTHROPIC_API_KEY`. Google and ElevenLabs features are optional.

## Application Pages

| Page | URL | Purpose |
|------|-----|---------|
| Chat | `/` | Main AI interface — split-screen with results panel |
| Správa (Data Management) | `/sprava` | Direct CRUD for all entities — tables, forms, filters |
| Automatizace (Dashboard) | `/dashboard` | Monitoring jobs + voice call logs |

## Example Conversations

**Morning briefing**: "Jaký je stav operativy?" → Agent runs health scan, renovation check, overdue tasks → Returns 0–100 score with prioritized issues.

**Book a showing**: "Naplánuj prohlídku bytu na Vinohradech na příští úterý" → Agent finds property, checks calendar, offers time slots, creates showing + calendar event + invitation email draft.

**Investor report**: "Připrav přehled pro investory" → Agent pulls portfolio data, calculates ROI, generates report, creates PPTX presentation with charts.

**Market check**: "Co je nového na trhu v Praze 2?" → Agent checks monitoring results, scores listings by relevance, presents top opportunities with prices and links.

## Documentation

### Technical (English)

| Document | Description |
|----------|-------------|
| [Architecture](./technical/architecture.md) | System design, request flow, design decisions, limitations |
| [Backend](./technical/backend.md) | API routes, streaming, export system, system prompt |
| [Frontend](./technical/frontend.md) | Components, tabs, charts, state management, design system |
| [Database](./technical/database.md) | 15 models, 15 enums, relationships, query layer, seed data |
| [Tools](./technical/tools.md) | All 45 tools by category, type system, how to add new tools |
| [Integrations](./technical/integrations.md) | Google Calendar/Gmail, ElevenLabs, scrapers, n8n, cron |
| [Deployment](./technical/deployment.md) | Environment variables, Vercel setup, Neon DB, local dev |

### User Documentation (Czech)

| Document | Description |
|----------|-------------|
| [Jak to funguje](./user/how-it-works.md) | Jak systém funguje, vysvětlení UI |
| [Funkce](./user/features.md) | Přehled všech funkcí |
| [Použití](./user/use-cases.md) | Praktické scénáře krok za krokem |
| [Co agent umí](./user/agent-capabilities.md) | Schopnosti agenta podle typů dotazů |
| [FAQ](./user/faq.md) | Časté otázky |

## Demo Presentation Guide

When presenting this project:

1. **Start with the morning briefing** — shows multi-tool orchestration and health scoring
2. **Show a booking workflow** — demonstrates calendar integration and email drafts
3. **Generate a report + PPTX** — highlights export capabilities
4. **Visit /sprava** — shows the data management layer
5. **Check /dashboard** — shows monitoring automation
6. **Ask about market listings** — demonstrates real scraping + analysis

Key points to emphasize:
- All data comes from real tools, not LLM hallucination
- Emails are drafts only — human-in-the-loop safety
- 45 tools with typed results — not a generic chatbot
- Czech language throughout — localized for the target market
- Explainability panel — shows exactly what data was accessed
