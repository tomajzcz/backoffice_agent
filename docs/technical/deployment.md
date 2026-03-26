# Deployment

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `DIRECT_URL` | Neon direct connection (migrations) | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | `sk-ant-...` |

### Google Integration (optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_REFRESH_TOKEN` | Refresh token for Calendar + Gmail access |

Google integration requires a Google Cloud project with Calendar API and Gmail API enabled. The refresh token grants offline access to one Google account.

### Monitoring & n8n (optional)

| Variable | Description |
|----------|-------------|
| `N8N_BASE_URL` | n8n instance URL (for webhook triggers) |
| `N8N_WEBHOOK_SECRET` | Secret for authenticating n8n webhook calls |

### Voice Calls (optional)

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | Conversational AI agent ID |
| `ELEVENLABS_PHONE_NUMBER_ID` | Phone number ID for outbound calls |

### Auto-injected by Vercel

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Bearer token for authenticating cron job requests |

## Vercel Deployment

### Setup

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Next.js and builds

### Build Pipeline

```
npm install
  → postinstall: prisma generate    (auto-generates Prisma client)
next build                           (compiles App Router pages + API routes)
```

### Runtime Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Framework | Next.js (auto-detected) | |
| Node.js | 20.x | |
| Build command | `next build` | |
| Install command | `npm install` | Triggers postinstall → prisma generate |
| Output directory | `.next` | |

### Function Limits

| Endpoint | maxDuration | Notes |
|----------|-------------|-------|
| `/api/chat` | 120s | Requires Vercel Pro plan |
| `/api/cron/monitoring` | 60s | Vercel cron limit |
| `/api/cron/daily-reminder-calls` | 60s | Vercel cron limit |
| All other routes | 10s (default) | |

### Cron Jobs

Defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monitoring",
      "schedule": "0 5 * * 1-5"
    },
    {
      "path": "/api/cron/daily-reminder-calls",
      "schedule": "0 5 * * *"
    }
  ]
}
```

Cron jobs are authenticated automatically by Vercel via `CRON_SECRET` bearer token.

## Database (Neon)

### Setup

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Create a database
3. Copy pooled connection string → `DATABASE_URL`
4. Copy direct connection string → `DIRECT_URL`

### Initial Setup

```bash
npm run db:migrate    # Apply all migrations
npm run db:seed       # Populate with test data
```

### Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run db:migrate    # Creates migration file + applies
npm run db:generate   # Regenerates Prisma client
```

To start from scratch:

```bash
npm run db:reset      # Drops all tables, re-migrates, re-seeds
```

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Neon remote DB)

### Quick Start

```bash
git clone <repo-url>
cd backoffice-agent
npm install                # Installs deps + generates Prisma client
cp .env.example .env.local # Fill in your env vars
npm run db:migrate         # Apply migrations
npm run db:seed            # Populate test data
npm run dev                # Start dev server at localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create + apply migration |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Destructive reset + re-seed |
| `npm run db:studio` | Open Prisma Studio GUI |

### Prisma Studio

```bash
npm run db:studio     # Opens visual DB browser at localhost:5555
```

Useful for inspecting and editing data during development.

## Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| **In-memory file storage** | PPTX/PDF tokens lost on serverless cold start | Download immediately after generation |
| **Single Google account** | Calendar/Gmail bound to one user | Multi-tenant OAuth not implemented |
| **No authentication** | Any visitor has full access | Deploy on private network or add auth |
| **Scraper fragility** | HTML structure changes break bezrealitky parser | Monitor for parse errors, update selectors |
| **Vercel function timeout** | Complex multi-tool chains may timeout at 120s | Reduce maxSteps or optimize tool execution |
| **Cron timezone** | Vercel cron runs in UTC | Schedule accounts for CET/CEST offset |

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3 |
| React | React | 19 |
| Language | TypeScript | 5 |
| AI | Anthropic Claude (via @ai-sdk/anthropic) | claude-sonnet-4-6 |
| AI SDK | Vercel AI SDK | 4.3 |
| Database | PostgreSQL (Neon) via Prisma | Prisma 6.5 |
| UI | Tailwind CSS + shadcn/ui + Radix UI | Tailwind 3.4 |
| Charts | Recharts | 2.15 |
| Icons | lucide-react | 0.483 |
| Markdown | react-markdown + remark-gfm | 9.0 |
| PPTX | PptxGenJS | 4.0 |
| PDF | PDFKit | 0.18 |
| Scraping | cheerio | 1.2 |
| Voice | ElevenLabs API | — |
| Google | googleapis | 171.4 |
| Validation | Zod | 3.24 |
| Hosting | Vercel | — |
| Database Hosting | Neon | — |

## See Also

- [Architecture](./architecture.md) — system design and limitations
- [Integrations](./integrations.md) — what each env var enables
- [Database](./database.md) — Neon setup and migration workflow
