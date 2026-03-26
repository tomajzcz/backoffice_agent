# Integrations

External services connected to the application.

## Google Calendar

**Files**: `lib/google/auth.ts`, `lib/google/calendar.ts`

### OAuth Setup
- OAuth2 client initialized from `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- Singleton pattern: global storage in development, new instance in production
- Uses `googleapis` library

### Features

| Function | Description |
|----------|-------------|
| `getCalendarAvailability` | Queries freebusy API, computes free slots within business hours (9–18h, Mon–Fri, 30min minimum). Timezone: Europe/Prague |
| `createCalendarEvent` | Creates event with summary, start/end, optional attendees. Can link to a Showing record via `googleCalendarEventId` |
| `updateCalendarEvent` | Updates event details. Syncs with Showing record if linked |
| `deleteCalendarEvent` | Deletes event. If linked to a Showing, the showing status is updated |
| `listCalendarEvents` | Retrieves events in a date range |

### Calendar ↔ Showing Sync
When a showing is created via the agent, the tool also creates a calendar event and stores the `googleCalendarEventId` on the Showing record. Updates and cancellations cascade between the two.

## Gmail

**Files**: `lib/google/auth.ts`, tools in `lib/agent/tools/createGmailDraft.ts` and `lib/agent/tools/sendPresentationEmail.ts`

### Safety Model: Draft-Only

The agent **never sends emails directly**. The workflow:

1. Agent calls `createGmailDraft` → creates draft with HTML body, subject, recipient
2. Frontend renders draft in Email tab → user reviews content
3. User clicks "Approve" → `POST /api/email/approve` → draft is saved to Gmail drafts folder
4. User sends the email manually from Gmail

This human-in-the-loop ensures the AI never sends external communications autonomously.

### Email Features
- HTML email bodies with Czech content
- UTF-8 base64 subject encoding (for Czech diacritics)
- Attachment support via multipart/mixed MIME (used for PPTX presentations)

## ElevenLabs (Voice Calls)

**Files**: `lib/integrations/elevenlabs.ts`, `app/api/cron/daily-reminder-calls/route.ts`

### Setup
- Requires: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID`
- Uses ElevenLabs Conversational AI API (`/v1/convai/twilio/outbound-call`)

### How It Works
1. Vercel cron fires at 5 AM daily (`/api/cron/daily-reminder-calls`)
2. Queries all showings scheduled for today with status `SCHEDULED`
3. Checks `CallLog` to avoid duplicate calls (idempotent by `[showingId, callDate]`)
4. Normalizes Czech phone numbers to E.164 format:
   - `+420XXXXXXXXX` → kept as-is
   - `00420XXXXXXXXX` → normalized
   - `XXXXXXXXX` (9 digits) → prepends `+420`
5. Initiates outbound voice call with dynamic variables:
   - `customer_name`, `email`, `phone`
   - `property_address`, `showing_time`, `showing_date`
6. Creates `CallLog` record (PENDING → INITIATED or FAILED)

### Phone Number Normalization
`lib/utils/phone.ts` — `normalizePhoneE164()` handles common Czech phone formats.

## Web Scrapers

**Files**: `lib/scraper/` — `index.ts`, `sreality.ts`, `bezrealitky.ts`, `dedup.ts`, `notify.ts`, `localities.ts`, `types.ts`

### Supported Sources

| Source | Method | File |
|--------|--------|------|
| **sreality.cz** | JSON API (`/api/cs/v2/estates`) | `sreality.ts` |
| **bezrealitky.cz** | HTML scraping with cheerio | `bezrealitky.ts` |

### Scraper Configuration

```typescript
type JobConfig = {
  sources?: string[]       // ['sreality', 'bezrealitky']
  districts?: string[]     // Prague districts
  types?: string[]         // Property types
  dispositions?: string[]  // e.g., '2+kk', '3+1'
  priceMin?: number
  priceMax?: number
  areaMin?: number
  areaMax?: number
}
```

### Scraping Flow

1. **Cron trigger** (`/api/cron/monitoring`, 5 AM Mon–Fri) or **manual trigger** (`triggerMonitoringJob` tool)
2. Load active `ScheduledJob` records with their `configJson`
3. `runScraper(config)` → runs sreality + bezrealitky in parallel
4. Results normalized to `ScrapedListing`:
   ```typescript
   { source, title, url, price, district, disposition, areaM2 }
   ```
5. Deduplicated by URL (`dedup.ts` — `filterNewListings()` checks against existing `MonitoringResult` URLs)
6. New listings saved to `MonitoringResult` with score and `isNew: true`
7. Email notification sent if `notifyEmail` is configured on the job

### Locality Resolution
`localities.ts` maps Czech district names (Praha 1, Vinohrady, Karlin, etc.) to API IDs used by sreality.cz.

## n8n Webhook

**Files**: `app/api/n8n-webhook/route.ts`, `lib/n8n/`

### Purpose
Alternative to built-in scrapers. n8n workflows can push monitoring results to the application via webhook.

### Endpoint
```
POST /api/n8n-webhook
Headers: { "X-Webhook-Secret": "<N8N_WEBHOOK_SECRET>" }
Body: { jobId, results: ScrapedListing[] }
```

### Authentication
Secret-based — the `X-Webhook-Secret` header must match `N8N_WEBHOOK_SECRET` environment variable.

### What It Does
1. Validates secret
2. Saves results to `MonitoringResult` table
3. Updates `lastRunAt` on the associated `ScheduledJob`

This is optional — the app functions fully without n8n using Vercel cron + built-in scrapers.

## Vercel Cron Jobs

Defined in `vercel.json`:

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| Market monitoring | `0 5 * * 1-5` (5 AM Mon–Fri) | `/api/cron/monitoring` | Run scrapers, save new listings |
| Reminder calls | `0 5 * * *` (5 AM daily) | `/api/cron/daily-reminder-calls` | Voice call showing reminders |

Both have `maxDuration: 60` seconds and are authenticated via Vercel's `CRON_SECRET` bearer token (auto-injected by Vercel).

## See Also

- [Tools](./tools.md) — which tools use which integration
- [Backend](./backend.md) — API routes for cron and webhooks
- [Deployment](./deployment.md) — environment variables for each integration
