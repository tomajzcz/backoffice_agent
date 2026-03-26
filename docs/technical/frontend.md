# Frontend

Next.js 15 App Router with React 19. Split-screen layout with dark enterprise theme.

## Layout System

**Root layout** (`app/layout.tsx`):
- `<html lang="cs" className="dark">` — Czech language, dark mode enforced
- Three Google Fonts: Syne (headings), Outfit (body), JetBrains Mono (monospace)
- Global CSS in `app/globals.css`

**Main page** (`app/page.tsx`):
- `flex h-screen overflow-hidden` — full viewport, no page scroll
- Left: `ChatPanel` (400px fixed width)
- Right: `ResultsPanel` (flex-1, fills remaining space)
- State managed via `useChat` from `ai/react`
- Session ID: `crypto.randomUUID()` in `useRef` for stable logging

## Component Tree

```
app/page.tsx
├── ChatPanel
│   ├── SystemStatus (online indicator)
│   ├── Navigation (links to /sprava and /dashboard)
│   ├── MessageList
│   │   └── MessageBubble[] (user + assistant)
│   │       └── ToolCallIndicator (loading state per tool)
│   ├── SuggestedPrompts (empty state, 8 Czech prompts)
│   └── ChatInput
│       └── MicButton (speech recognition)
└── ResultsPanel
    ├── Header (tool name badge + context summary)
    ├── TabBar (6 tabs)
    └── Tab Content
        ├── AnswerTab → ExplainabilitySection
        ├── DataTab (per-tool table rendering)
        ├── ChartTab
        │   ├── ClientSourcesBarChart
        │   ├── LeadsSalesLineChart
        │   └── WeeklyKPIsBarChart
        ├── ReportTab (markdown + export buttons)
        ├── EmailDraftTab (HTML preview + approve)
        └── LogsTab (agent run history)
```

## Chat Panel Components

### ChatPanel (`components/chat/ChatPanel.tsx`)
Container with header (logo + navigation), message list, suggested prompts (shown when empty), and input area.

### MessageList (`components/chat/MessageList.tsx`)
Scrollable area with auto-scroll to bottom on new messages. Filters out `role="tool"` messages (those render in Results panel).

### MessageBubble (`components/chat/MessageBubble.tsx`)
- **User messages**: Right-aligned, primary/10 background
- **Assistant messages**: Left-aligned with "A" avatar, card background
- Text rendered via `react-markdown` with GitHub Flavored Markdown
- Tool calls shown as `ToolCallIndicator` components (spinner + Czech tool label)
- Streaming cursor (blinking animation) when assistant is typing

### ChatInput (`components/chat/ChatInput.tsx`)
- Auto-resizing textarea (max 128px height)
- Enter to send, Shift+Enter for newline
- Disabled during loading
- MicButton for voice input

### SuggestedPrompts (`components/chat/SuggestedPrompts.tsx`)
8 hardcoded Czech prompts shown when no messages exist:
- "Ranní briefing — jaký je stav operativy?"
- "Kolik máme nových klientů tento kvartál?"
- "Naplánuj prohlídku bytu na Vinohradech"
- etc.

Clicking a prompt sets the input and auto-submits.

### MicButton + useSpeechRecognition (`hooks/useSpeechRecognition.ts`)
Browser Speech Recognition API with Czech locale (`cs-CZ`). Returns `onInterim` (live transcript) and `onFinal` (committed words). Hidden if browser doesn't support it.

## Results Panel

### Tab Auto-Switching (`components/results/ResultsPanel.tsx`)

When a new `latestToolResult` arrives, `useEffect` switches the active tab:

| Tool Names | Tab |
|------------|-----|
| `generateReport`, `generatePresentation` | Zpráva |
| `createGmailDraft`, `sendPresentationEmail` | Email |
| All CRUD tools, `getPropertyDetails`, `getPropertyDocuments`, calendar CRUD, monitoring data, `getRenovationDetail` | Data |
| Everything else (analytics, scans, availability) | Graf |

### Context Header

Displays a contextual summary per tool result. Examples:
- `queryNewClients` → "45 klientů · Q1 2025"
- `scanOperationalHealth` → "Zdraví: 72/100 · 8 problémů"
- `createShowing` → "Prohlídka #12 naplánována"

### AnswerTab (`components/results/AnswerTab.tsx`)
Renders the last assistant text message via `react-markdown`. Includes collapsible `ExplainabilitySection` showing tools used, data sources, record counts, and filters.

### DataTab (`components/results/DataTab.tsx`)
The largest component (~63KB). Renders different table layouts per tool type:
- CRUD results: sortable tables with action buttons
- Property details: card layout with related entities
- Calendar events: event list with times
- Monitoring results: scored listing cards

Includes `ExportButtons` for CSV and PDF download.

### ChartTab (`components/results/ChartTab.tsx`)
Dispatches to the appropriate chart component based on `toolName`:
- `queryNewClients`, `scanMissingRenovationData` → `ClientSourcesBarChart`
- `queryLeadsSalesTimeline` → `LeadsSalesLineChart`
- `queryWeeklyKPIs` → `WeeklyKPIsBarChart`
- Other tools with `chartType !== "none"` → generic bar chart

### Chart Components (`components/charts/`)

All charts use Recharts with:
- Hydration guard: `useState(false)` → `useEffect(() => setMounted(true))` to avoid SSR mismatch
- Shimmer skeleton fallback while mounting
- `ResponsiveContainer` for responsive width
- Dark theme colors: amber (#f59e0b), emerald, sky, violet
- Custom tooltips and legends

| Component | Type | Data Shape |
|-----------|------|-----------|
| `ClientSourcesBarChart` | Vertical bar | `{ name, pocet }[]` |
| `LeadsSalesLineChart` | Dual line | `{ name, leady, prodeje }[]` |
| `WeeklyKPIsBarChart` | Grouped bar (3 series) | `{ name, leady, klienti, obchody }[]` |

### ReportTab (`components/results/ReportTab.tsx`)
Renders generated reports as Markdown. Includes:
- Download as PPTX (triggers `generatePresentation`)
- Export as PDF (POST to `/api/export/pdf`)

### EmailDraftTab (`components/results/EmailDraftTab.tsx`)
Shows email draft with HTML preview. Three actions:
- **Approve**: POST to `/api/email/approve` → saves to Gmail
- **Edit**: Opens editable view
- **Reject**: Dismisses the draft

### LogsTab (`components/results/LogsTab.tsx`)
Fetches from `GET /api/agent-runs` and displays chronological log of agent interactions with tools called and summaries.

## Data Management Page (`/sprava`)

**Server component** (`app/sprava/page.tsx`) with initial data fetch.

### SpravaClient (`app/sprava/components/SpravaClient.tsx`)
Client component with 8 tabs — one per entity type:
1. Nemovitosti (Properties)
2. Klienti (Clients)
3. Leady (Leads)
4. Obchody (Deals)
5. Prohlídky (Showings)
6. Úkoly (Tasks)
7. Investoři (Investors)
8. Dokumenty (Documents)

### EntityTable (`app/sprava/components/EntityTable.tsx`)
Reusable table with:
- Sortable columns (asc/desc toggle)
- Pagination (prev/next)
- Row hover effects
- Custom cell formatters: `currency` (CZK), `date` (Czech locale), `badge` (colored pills), `id` (monospace)
- Edit/Delete dropdown on each row

### Entity Forms
Dialog-based forms for each entity: `PropertyForm`, `ClientForm`, `LeadForm`, `DealForm`, `ShowingForm`, `TaskForm`, `InvestorForm`, `DocumentForm`. All use `FormData` extraction with async `onSave` callback to server actions.

**Server actions** (`app/sprava/actions.ts`): Prisma mutations for create/update/delete per entity.

## Dashboard Page (`/dashboard`)

**Server component** (`app/dashboard/page.tsx`) fetching monitoring jobs and call logs.

### AutomationsClient
Two tabs:
- **MonitoringTab**: List of monitoring jobs, manual trigger button, results display
- **ReminderCallsTab**: Table of call logs with status badges

## State Management

No external state management library. Everything derives from the `useChat` hook:

```typescript
const { messages, input, setInput, handleSubmit, isLoading, error, data } = useChat({
  api: "/api/chat",
  body: { sessionId },
})

// Derived state
const latestToolResult = useMemo(() => /* extract from last message.toolInvocations */)
const latestExplainability = useMemo(() => /* parse from data annotations */)
```

`messages` is the single source of truth. All UI state (active tab, displayed results, explainability) derives from it.

## Design System

### Colors (CSS Custom Properties)
- Background: `#0f0f11` (near-black)
- Foreground: `#f1f1f5` (off-white)
- Primary: amber `#f59e0b`
- Secondary: `#1f1f24`
- Muted foreground: medium gray
- Chart palette: amber, emerald, sky, violet, red

### Typography
- **Syne** (400–800): Headings — bold, geometric
- **Outfit** (300–600): Body text — clean sans-serif
- **JetBrains Mono** (400–500): Code, IDs, prices

### Animations
- `fadeIn` (0.3s): Opacity + translateY for message appearance
- `slideInRight` (0.25s): Panel transitions
- `blink` (1s): Streaming cursor
- `shimmer` (1.5s): Chart skeleton loaders
- `pulse-mic`: Microphone breathing effect

### Component Library
shadcn/ui primitives: Tabs, ScrollArea, Dialog, AlertDialog, Select, DropdownMenu, Button, Input, Textarea, Label, Badge, Separator. Config in `components.json`.

Icons: lucide-react.

## See Also

- [Architecture](./architecture.md) — layout and data flow overview
- [Tools](./tools.md) — chart data contracts
- [Backend](./backend.md) — API routes called by frontend
