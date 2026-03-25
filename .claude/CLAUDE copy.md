# Back Office Operations Agent

## Project Context

Soutěžní projekt pro výběrové řízení s Vojtou Žižkou (pozice "AI génius"). Cílem je postavit **Back Office Operations Agenta** pro fiktivní realitní firmu a nasadit ho na Vercel. Porotě bude odevzdáno URL na nasazené UI + krátké demo video.

**Pepa** = fiktivní back office manager, pro jehož práci je agent určen. Zadání pochází od Vojty Žižky.

---

## Cíl projektu

Postavit AI agenta s chatovým UI, který umí:

1. Analytické dotazy nad daty (klienti Q1, leady vs. prodeje 6M, grafy)
2. Operativní scan dat (nemovitosti s chybějící rekonstrukcí)
3. Generování výstupů (weekly report, 3-slide prezentace)
4. Komunikaci (draft emailu s termínem prohlídky z Google Calendar)
5. Plánované monitoring tasky (realitní servery Praha Holešovice každé ráno)

---

## Architektura

```
┌─────────────────────────────────────────────┐
│           Next.js App (Vercel)              │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Chat UI    │  │  Results Panel       │ │
│  │  (streaming) │  │  tabs: Answer/Chart  │ │
│  │              │  │  /Draft/Report/Tasks │ │
│  └──────┬───────┘  └──────────────────────┘ │
│         │                                   │
│  ┌──────▼──────────────────────────────┐    │
│  │        Agent Orchestrator           │    │
│  │     (Vercel AI SDK + tool calls)    │    │
│  └──────┬──────────────────────────────┘    │
└─────────┼───────────────────────────────────┘
          │ tools
    ┌─────▼──────────────────────────────────┐
    │              Tool Layer                │
    │  analytics_query | data_quality_scan   │
    │  calendar_availability | gmail_draft   │
    │  report_generator | pptx_export        │
    │  scheduled_jobs_manager                │
    └──────┬─────────────────┬───────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────────┐
    │  Postgres   │   │  n8n (webhooks) │
    │  (Neon)     │   │  schedulery     │
    └─────────────┘   └─────────────────┘
           │
    ┌──────▼──────────────────────────────┐
    │  Google APIs (Calendar + Gmail)     │
    └─────────────────────────────────────┘
```

---

## Tech Stack

| Vrstva     | Technologie                                                        |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui       |
| AI         | Vercel AI SDK (`ai` package), claude-sonnet-4-6 model              |
| Charts     | Recharts nebo ECharts (strukturovaná data z toolů, ne LLM obrázky) |
| Backend    | Next.js API routes / server actions                                |
| DB         | Postgres na Neon (nebo Supabase), Prisma nebo Drizzle ORM          |
| Embeddings | pgvector (volitelné, pro doc search)                               |
| Workflow   | n8n (self-hosted nebo Render/Railway)                              |
| Email/Cal  | Google Gmail API + Google Calendar API                             |
| PPTX       | PptxGenJS                                                          |
| Hosting    | Vercel (frontend + API)                                            |

---

## Databázové schéma (hlavní tabulky)

```sql
-- Klienti
clients (id, name, email, phone, acquisition_source, created_at, segment)

-- Leady
leads (id, name, email, phone, source, status, property_interest, created_at, converted_at)

-- Nemovitosti
properties (id, address, district, type, price, status, area_m2,
            year_built, last_renovation_year, renovation_notes,
            owner_id, created_at)

-- Obchody
deals (id, property_id, client_id, status, value, closed_at, created_at)

-- Prohlídky
showings (id, property_id, client_id, scheduled_at, status, notes)

-- Týdenní KPI snapshoty
weekly_reports (id, week_start, new_leads, new_clients, properties_listed,
                deals_closed, revenue, created_at)

-- Tasky vygenerované agentem
agent_tasks (id, title, description, status, priority, due_date,
             source_query, created_at)

-- Scheduled monitoring joby
scheduled_jobs (id, name, description, cron_expr, last_run_at,
                next_run_at, status, config_json)

-- Výsledky monitoringu
monitoring_results (id, job_id, source, title, url, price, district,
                    disposition, found_at, is_new)

-- Run logy agenta
agent_runs (id, session_id, user_query, tools_called_json,
            output_summary, created_at)
```

---

## Agent Tools (seznam)

Každý tool je Next.js server-side funkce volaná přes Vercel AI SDK tool calling:

### Datové / analytické tooly

- `queryNewClients(quarter, year)` → clients za kvartál + acquisition_source breakdown
- `queryLeadsSalesTimeline(months)` → měsíční agregace leads vs. deals
- `queryWeeklyKPIs(weeksBack)` → weekly_reports za posledních N týdnů
- `scanMissingRenovationData()` → properties kde chybí renovation data

### Komunikační tooly

- `getCalendarAvailability(dateRangeStart, dateRangeEnd)` → Google Calendar free slots
- `createGmailDraft(to, subject, body)` → uloží draft do Gmailu
- `getPropertyDetails(propertyId)` → detail nemovitosti pro kontext emailu

### Generování výstupů

- `generateReport(type, data)` → Markdown/HTML report
- `generatePresentation(slides[])` → PptxGenJS výstup, vrátí download link
- `exportTableToCSV(data)` → CSV export

### Workflow / monitoring

- `createAgentTask(title, description, priority, dueDate)` → uloží task
- `listScheduledJobs()` → přehled monitoring jobů
- `triggerMonitoringJob(jobId)` → spustí okamžitě přes n8n webhook
- `getMonitoringResults(jobId, days)` → výsledky monitoring jobu

---

## Struktura projektu (složky)

```
backoffice_agent/
├── app/
│   ├── page.tsx                    # hlavní chat UI
│   ├── layout.tsx
│   ├── api/
│   │   ├── chat/route.ts           # AI SDK streaming endpoint
│   │   └── export/
│   │       ├── pptx/route.ts
│   │       └── csv/route.ts
│   ├── dashboard/page.tsx          # scheduled jobs + monitoring
│   └── tasks/page.tsx              # agent task list
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ToolCallIndicator.tsx
│   ├── results/
│   │   ├── ResultsPanel.tsx        # tabs: Answer/Chart/Draft/Report/Tasks
│   │   ├── ChartView.tsx
│   │   ├── TableView.tsx
│   │   ├── EmailDraftView.tsx
│   │   └── ReportView.tsx
│   └── ui/                         # shadcn komponenty
├── lib/
│   ├── agent/
│   │   ├── tools.ts                # definice všech toolů
│   │   ├── prompts.ts              # system prompt agenta
│   │   └── schemas.ts              # Zod schémata pro tool params
│   ├── db/
│   │   ├── schema.ts               # Drizzle/Prisma schema
│   │   ├── queries.ts              # DB query funkce
│   │   └── seed.ts                 # seed script pro demo data
│   ├── google/
│   │   ├── calendar.ts             # Google Calendar API wrapper
│   │   └── gmail.ts                # Gmail API wrapper
│   └── export/
│       ├── pptx.ts                 # PptxGenJS wrapper
│       └── report.ts               # Markdown/HTML report generator
├── prisma/                         # nebo drizzle/
│   └── schema.prisma
├── scripts/
│   └── seed-db.ts                  # generování demo dat
├── n8n-workflows/                  # exportované n8n workflow JSONy
│   ├── morning-monitoring.json
│   └── weekly-digest.json
└── CLAUDE.md
```

---

## System prompt agenta

```
Jsi Back Office Operations Agent pro realitní firmu. Pomáháš Pepovi, back office managerovi, s:
- analýzou dat o klientech, leadech, nemovitostech a obchodech
- hledáním provozních mezer a chybějících dat
- přípravou komunikace (e-maily, drafty)
- generováním reportů a prezentací
- plánovaným monitoringem realitního trhu

Vždy používej dostupné tooly pro práci s reálnými daty. Nikdy nevymýšlej čísla.
Na dotazy odpovídej česky, strukturovaně. Pokud generuješ graf, vrať strukturovaná data pro frontend renderer.
Pokud navrhneš úkol nebo follow-up akci, nabídni jeho uložení přes createAgentTask.
```

---

## Demo data (seed)

Seed skript vygeneruje věrohodná data:

- **150 leadů** (leden 2025 – březen 2026, zdroje: sreality, bezrealitky, doporučení, web, inzerce)
- **45 klientů** (konvertovaní z leadů)
- **55 nemovitostí** (Praha + okolí, různé dispozice, ~15 záměrně bez renovation dat)
- **22 dealů** (closed i in-progress)
- **40 prohlídek**
- **18 weekly_report snapshotů** (posledních 18 týdnů)
- **2 scheduled monitoring joby** (Praha Holešovice, Praha Žižkov)
- **5–10 monitoring výsledků** simulující ranní digest

---

## Prioritní pořadí buildování

### Den 1 – Základ

1. Next.js projekt + Vercel deploy
2. DB schema + seed data
3. Chat UI (shadcn, streaming)
4. Základní tool: `queryNewClients` + výstup v tabulce
5. CI: každý push → auto-deploy na Vercel

### Den 2 – Analytics + Operations

6. `queryLeadsSalesTimeline` + line chart (Recharts)
7. `scanMissingRenovationData` + task list výstup
8. `generateReport` + weekly summary
9. `queryWeeklyKPIs`

### Den 3 – Komunikace + Monitoring

10. Google Calendar API + `getCalendarAvailability`
11. Gmail API + `createGmailDraft`
12. Email draft UI preview + „Save draft" CTA
13. workflow pro ranní monitoring
14. Scheduled jobs page v UI

### Den 4 – Export + Polish + Video

15. PptxGenJS prezentace
16. PDF/CSV export
17. Runs log (které tooly agent použil)
18. Approval flow pro email (schválení před uložením)
19. „Explain how I got this answer" feature
20. Demo video

---

## Klíčové rozhodnutí a důvody

| Rozhodnutí                                         | Důvod                                              |
| -------------------------------------------------- | -------------------------------------------------- |
| Graf renderuje frontend z dat, ne LLM jako obrázek | Přesnější, rychlejší, product-grade                |
| n8n jen pro scheduler/workflow, ne jako hlavní UI  | UI/product experience musí být vlastní appka       |
| Demo draft emailu, neodesílat rovnou               | Bezpečnější a profesionálnější pro demo            |
| Strukturovaná data z toolů → Zod schémata          | Type safety + lepší error handling                 |
| pgvector jen pokud zbyde čas                       | Risk/reward: embeddings nejsou v zadání explicitně |
| Seed data věrohodná a relačně konzistentní         | Grafy a reporty musí vypadat jako reálná firma     |

---

## Prostředí a secrets

Potřebné env proměnné (`.env.local`):

```
DATABASE_URL=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

---

## Deployment

- **Frontend + API**: Vercel (automatický deploy z main branch)
- **DB**: Neon (free tier stačí pro demo)
- **Env vars**: nastavit v Vercel dashboard

---

## Kritéria úspěchu (co porota hodnotí)

- [ ] Funguje end-to-end (reálné tooly, ne fake odpovědi)
- [ ] Jasný business leverage (Pepa ušetří hodiny práce)
- [ ] UI působí jako produkt (ne chatbot demo)
- [ ] Grafy a reporty jsou skutečné výstupy
- [ ] Workflow a schedule jsou skutečně zapojené (n8n)
- [ ] Google integrace (Calendar + Gmail) funkční
- [ ] Export prezentace funguje
- [ ] Demo video je přesvědčivé (problém → řešení → live demo → architektura)
