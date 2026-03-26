# Frontend Component and UI Documentation

This document covers the frontend architecture, component hierarchy, design system, and state management of the Back Office Agent application.

---

## 1. Layout System

### Root Layout (`app/layout.tsx`)

The root layout sets `lang="cs"` for Czech locale and applies a permanent `dark` class on `<html>`. The body uses `antialiased overflow-hidden` to prevent page-level scrolling. Fonts are loaded via Google Fonts in `globals.css`:

- **Syne** (weights 400--800) -- headings, brand text
- **Outfit** (weights 300--600) -- body text, default font
- **JetBrains Mono** (weights 400--500) -- code, monospace labels, timestamps

No authentication wrapper or provider context exists at the root level.

### Main Chat Page (`app/page.tsx`)

The main page is a client component (`"use client"`) that renders the split-screen layout:

```
AppLayout
  +-- Sidebar (220px fixed)
  +-- main (flex-1)
        +-- div.flex.h-full
              +-- ChatPanel (400px fixed, shrink-0)
              +-- ResultsPanel (flex-1, min-w-0)
```

The `useChat` hook from `ai/react` serves as the single source of truth for all chat state. A stable `sessionId` is generated via `useRef(crypto.randomUUID())` and passed in the request body.

### AppLayout (`components/layout/AppLayout.tsx`)

A thin wrapper that composes `Sidebar` with a flex container. Used by all three pages: `/` (chat), `/sprava` (data management), and `/dashboard` (automations).

```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
    {children}
  </main>
</div>
```

### Sidebar (`components/layout/Sidebar.tsx`)

A 220px-wide fixed sidebar with three navigation items:

| Route        | Label         | Icon             |
|--------------|---------------|------------------|
| `/`          | Chat          | MessageSquare    |
| `/sprava`    | Sprava dat    | Database         |
| `/dashboard` | Automatizace  | LayoutDashboard  |

Active route detection uses exact match for `/` and `startsWith` for other routes. The sidebar includes a brand header ("Back Office Agent / Realitni operativa") with a `Building2` icon and a footer with a green pulsing "online" status indicator.

---

## 2. Component Tree

```
app/layout.tsx (RootLayout)
|
+-- app/page.tsx (Home) ........................ "use client"
|   +-- AppLayout
|   |   +-- Sidebar
|   +-- ChatPanel
|   |   +-- MessageList
|   |   |   +-- ScrollArea
|   |   |   +-- MessageBubble (per message)
|   |   |       +-- ToolCallIndicator (per tool call)
|   |   |       +-- ReactMarkdown (assistant text)
|   |   +-- SuggestedPrompts (8 prompts, collapsible)
|   |   +-- ChatInput
|   |       +-- MicButton
|   +-- ResultsPanel
|       +-- ExportButtons (CSV + PDF)
|       +-- Tabs (6 tabs)
|           +-- AnswerTab
|           |   +-- ReactMarkdown
|           |   +-- ExplainabilitySection
|           +-- DataTab (~1377 lines, handles 40+ tool results)
|           +-- ChartTab
|           |   +-- ClientSourcesBarChart (Recharts BarChart)
|           |   +-- LeadsSalesLineChart (Recharts LineChart)
|           |   +-- WeeklyKPIsBarChart (Recharts BarChart)
|           +-- ReportTab
|           +-- EmailDraftTab
|           +-- LogsTab
|           +-- EmptyState (shared placeholder)
|
+-- app/sprava/page.tsx (SpravaPage) .......... Server Component
|   +-- AppLayout + Sidebar
|   +-- SpravaClient .......................... "use client"
|       +-- Tabs (9 entity tabs)
|       +-- EntityTable (sort, filter, paginate)
|       +-- PropertyForm / ClientForm / LeadForm / DealForm
|       +-- ShowingForm / TaskForm / InvestorForm
|       +-- DocumentForm / RenovationForm
|       +-- DeleteConfirmDialog
|
+-- app/sprava/rekonstrukce/[id]/page.tsx ..... Server Component
|   +-- AppLayout + Sidebar
|   +-- RenovationDetailClient ................ "use client"
|
+-- app/dashboard/page.tsx (DashboardPage) .... Server Component
    +-- AutomationsClient ..................... "use client"
        +-- AppLayout + Sidebar
        +-- Tabs (3 tabs)
            +-- MonitoringTab
            |   +-- JobForm
            +-- ReminderCallsTab
            |   +-- AutomationSettingsDialog
            +-- OtherAutomationsTab
                +-- AutomationSettingsDialog
```

---

## 3. Chat Panel Components

### ChatPanel (`components/chat/ChatPanel.tsx`)

The top-level chat container. Filters out `role="tool"` messages from the visible list (tool results are displayed in the Results panel instead). Composes four child sections vertically:

1. **Header** -- "Konverzace" title with message count
2. **MessageList** -- scrollable message area
3. **SuggestedPrompts** -- visible only when conversation is empty
4. **ChatInput** -- text input with mic and send buttons

When a suggested prompt is selected, the component sets the input value and programmatically submits after a 50ms delay using a synthetic `FormEvent`.

### MessageList (`components/chat/MessageList.tsx`)

Wraps messages in a `ScrollArea` with auto-scroll behavior. A `useEffect` scrolls `bottomRef` into view (smooth) whenever `messages` or `isLoading` changes. When the list is empty, it renders a centered welcome state with the "B" brand icon and the text "Jak ti mohu pomoci?" (How can I help you?).

### MessageBubble (`components/chat/MessageBubble.tsx`)

Renders a single message with role-based styling:

- **User messages**: Right-aligned, amber-tinted border (`bg-primary/8`), rounded with `rounded-tr-md` for the speech-bubble effect. Timestamp in `cs-CZ` format below.
- **Assistant messages**: Left-aligned with an "A" avatar badge. Renders `ToolCallIndicator` for each tool call, then the text content via `ReactMarkdown` with `remarkGfm`. When loading with no content yet, displays a blinking amber cursor.
- **Tool messages**: Filtered out (returns `null`).

Content extraction handles both string content and the AI SDK v4 content array format (filtering for `type === "text"` and `type === "tool-call"` parts).

### ChatInput (`components/chat/ChatInput.tsx`)

An auto-resizing `<textarea>` (max height 128px) with:

- **Send button**: Amber primary button, disabled when loading or input is empty. Shows a spinning `Loader2` icon during loading.
- **MicButton**: Conditionally rendered when the Web Speech API is supported. Integrates with `useSpeechRecognition` hook.
- **Keyboard shortcuts**: Enter to submit, Shift+Enter for newline.
- **Speech recognition integration**: Maintains a `baseInputRef` to snapshot the text before dictation starts, then appends interim/final transcripts to that base.

Hint text below the input: "Enter odeslat / Shift+Enter novy radek / Mikrofon diktovat".

### SuggestedPrompts (`components/chat/SuggestedPrompts.tsx`)

Displays 8 predefined Czech prompts when the conversation is empty. Shows 4 by default with a "Zobrazit vice" (Show more) toggle button to expand. Each prompt has an associated Lucide icon:

| Icon         | Prompt (Czech)                                           |
|--------------|----------------------------------------------------------|
| Sunrise      | Ranni briefing -- jaky je operativni stav firmy?         |
| Building2    | Kolik bytu je aktualne v rekonstrukci? Jsou nejake zasekle? |
| AlertCircle  | Jake ukoly jsou po terminu?                              |
| TrendingUp   | Jaka je ocekavana ziskovost nasich nemovitosti?          |
| User         | Priprav prehled pro investora Novaka                     |
| FileSearch   | Kde mame nejvetsi mezery v datech a dokumentaci?         |
| BarChart2    | Analyzuj nove nabidky z monitoringu Holesovic            |
| BarChart2    | Ukaz mi vyvoj leadu a prodeju za poslednich 6 mesicu    |

### ToolCallIndicator (`components/chat/ToolCallIndicator.tsx`)

Inline indicator rendered within assistant messages when a tool is being called. Shows a spinning `Loader2` while loading, or a `Wrench` icon when complete. Uses JetBrains Mono font. Has a `TOOL_LABELS` map for Czech-friendly labels (e.g., `queryNewClients` -> "Nacitam klienty z databaze...").

### MicButton (`components/chat/MicButton.tsx`)

A small (28x28px) button with four visual states driven by `SpeechStatus`:

| Status             | Icon   | Style                              |
|--------------------|--------|------------------------------------|
| `idle`             | Mic    | Secondary background               |
| `listening`        | Mic    | Primary glow, `animate-pulse-mic`  |
| `permission-denied`| MicOff | Destructive tint, disabled         |
| `error`            | MicOff | Secondary, clickable to retry      |
| `unsupported`      | --     | Not rendered                       |

---

## 4. Results Panel

### ResultsPanel (`components/results/ResultsPanel.tsx`)

The right-hand panel with a header, tab bar, and scrollable content area. Contains 6 tabs:

| Tab Key   | Label    | Icon           | Czech Label |
|-----------|----------|----------------|-------------|
| `odpoved` | Answer   | MessageSquare  | Odpoved     |
| `data`    | Data     | Table2         | Data        |
| `graf`    | Chart    | BarChart2      | Graf        |
| `zprava`  | Report   | FileText       | Zprava      |
| `email`   | Email    | Mail           | Email       |
| `logy`    | Logs     | Activity       | Logy        |

**Auto-switching logic** (via `useEffect` on `latestToolResult`):

- `generateReport`, `generatePresentation` -> `zprava` tab
- `createGmailDraft`, `prepareEmailDraft`, `sendPresentationEmail` -> `email` tab
- CRUD operations, calendar events, property details, monitoring results, `getRenovationDetail` -> `data` tab
- All other tools (analytics, scans) -> `graf` tab

The header displays a dynamic subtitle via `getResultSubtitle()` which handles all 40+ tool result types, plus the active tool name as a monospace badge and `ExportButtons`.

### AnswerTab (`components/results/AnswerTab.tsx`)

Renders the last assistant message's text content using `ReactMarkdown` with `remarkGfm` inside the custom `prose-agent` CSS class. Below the answer, conditionally renders `ExplainabilitySection` if explainability data is available.

### DataTab (`components/results/DataTab.tsx`)

The largest component at approximately 1,377 lines. Contains custom table renderings for every tool result type that produces structured data. Features include:

- Per-tool-result custom table layouts with Czech column headers
- Status badges using `STATUS_COLORS` mapping
- Currency formatting via `formatCZK()`
- Date formatting in `cs-CZ` locale
- KPI summary cards (grid layout with large numbers)
- Inline action buttons (e.g., "Ulozit vsechny jako ukoly" for scan results)
- Staggered row animations (`animationDelay`)
- Imports `ACQUISITION_SOURCE_LABELS`, `CLIENT_SEGMENT_LABELS`, `STATUS_COLORS` from `lib/constants/labels`

Tool results handled include: `queryNewClients`, `queryLeadsSalesTimeline`, `scanMissingRenovationData`, `createAgentTask`, `queryWeeklyKPIs`, `getPropertyDetails`, `getPropertyDocuments`, `listScheduledJobs`, `getMonitoringResults`, `triggerMonitoringJob`, all CRUD list/create/update results, calendar events, `scanOverdueTasks`, `scanOperationalHealth`, `calculatePropertyProfitability`, `getInvestorOverview`, `scanMissingDocuments`, `analyzeNewListings`, `queryActiveRenovations`, `getRenovationDetail`, `scanRenovationHealth`, and more.

### ChartTab (`components/results/ChartTab.tsx`)

Routes tool results to the appropriate Recharts chart component:

| Tool Result                       | Chart Component          | Chart Type      |
|-----------------------------------|--------------------------|-----------------|
| `queryNewClients`                 | ClientSourcesBarChart    | Bar             |
| `queryLeadsSalesTimeline`         | LeadsSalesLineChart      | Line            |
| `scanMissingRenovationData`       | ClientSourcesBarChart    | Bar             |
| `queryWeeklyKPIs`                 | WeeklyKPIsBarChart       | Grouped Bar     |
| `queryPropertiesByLifecycle`      | ClientSourcesBarChart    | Bar             |
| `scanOverdueTasks`                | ClientSourcesBarChart    | Bar             |
| `scanOperationalHealth`           | ClientSourcesBarChart    | Bar (+ score)   |
| `calculatePropertyProfitability`  | ClientSourcesBarChart    | Bar (+ ROI)     |
| `getInvestorOverview`             | ClientSourcesBarChart    | Bar             |
| `scanMissingDocuments`            | ClientSourcesBarChart    | Bar             |
| `analyzeNewListings`              | ClientSourcesBarChart    | Bar             |

Several chart results also include supplementary data below the chart: percentage breakdowns with progress bars, legends, KPI summaries, or stalled-property warnings.

### ReportTab (`components/results/ReportTab.tsx`)

Handles two result types:

- **`generateReport`**: Renders a markdown report using `ReactMarkdown` with title and generation date.
- **`generatePresentation`**: Shows a centered PPTX download card with:
  - Download button (primary amber)
  - "Poslat emailem" (Send by email) button that expands an inline email form
  - Email form with address input, send button, success/error states
  - The email send calls `/api/export/pptx/send-email` with the download token

### EmailDraftTab (`components/results/EmailDraftTab.tsx`)

Implements a three-button approval workflow for email drafts:

1. **Schvalit a ulozit jako draft** (Approve) -- calls `POST /api/email/approve`, saves as Gmail draft
2. **Upravit navrh** (Edit) -- toggles inline editing of subject and body
3. **Zamitnout** (Reject) -- sets rejected state

States: `pending` -> `editing` (toggle) -> `approving` (loading) -> `approved` (success with draft ID) or `rejected`.

Handles both `prepareEmailDraft` (pre-approval) and `createGmailDraft` (already committed, shows success directly). Email body is rendered via `dangerouslySetInnerHTML` in view mode, or as a `<textarea>` in edit mode.

### ExplainabilitySection (`components/results/ExplainabilitySection.tsx`)

A collapsible section titled "Jak jsem k tomu dosel" (How I arrived at this). Displays audit metadata from `ExplainabilityData` in five categories:

- **Pouzite nastroje** (Tools used) -- tool labels with parameter badges
- **Zdroje dat** (Data sources) -- primary-colored badges
- **Pocet zaznamu** (Record counts) -- monospace counts
- **Aplikovane filtry** (Applied filters) -- key-value badges
- **Omezeni** (Limitations) -- warning-colored list items

### ExportButtons (`components/results/ExportButtons.tsx`)

Conditionally renders CSV and PDF export buttons in the results header. Uses `getCSVConfig()` and `getPDFTableConfig()` from `lib/export/csv-configs` and `lib/export/pdf-configs` to determine availability per tool.

- **CSV**: Client-side generation via `downloadCSV()`. Extracts data from the tool result using config-defined `dataExtractor` and `rowMapper`.
- **PDF**: Server-side generation via `POST /api/export/pdf`. Returns a download token, then opens the download URL in a new tab.

### EmptyState (`components/results/EmptyState.tsx`)

A shared placeholder component used across all tabs when no data is available. Accepts a Lucide icon, title, and optional description. Renders centered with fade-in animation.

### LogsTab (`components/results/LogsTab.tsx`)

Fetches the 15 most recent agent runs from `GET /api/agent-runs?limit=15` on mount. Each run displays:

- User query (truncated to 2 lines)
- Relative timestamp ("prave ted", "pred 5 min", "pred 2 h")
- Tool call badges with Czech labels from a `TOOL_LABELS` map

Includes a refresh button. Shows shimmer skeletons during loading.

---

## 5. Chart Components (`components/charts/`)

All chart components share common patterns:

- Client-side only rendering (shimmer placeholder until `useEffect` sets `mounted = true`)
- `ResponsiveContainer` with 100% width and fixed height (220--240px)
- Styled for dark theme: transparent grid lines, muted axis ticks, dark tooltips with card borders
- Custom tooltip components
- Outfit font for axis labels, JetBrains Mono for numeric ticks

### ClientSourcesBarChart

A vertical bar chart using Recharts `BarChart`. Data format: `{ name: string; pocet: number }`. Bars are amber-colored (`hsl(38, 92%, 50%)`) with the maximum value highlighted brighter. Rounded top corners (radius `[3, 3, 0, 0]`), max bar width 52px. Used as the default bar chart for many tool results beyond client sources (lifecycle stages, overdue tasks, profitability, investor portfolios, missing documents, new listings).

### LeadsSalesLineChart

A dual-line chart showing leads (amber) vs. sales (emerald `hsl(160, 84%, 39%)`) over time. Data format: `{ name: string; leady: number; prodeje: number }`. Uses `monotone` curve type with dot markers (r=3) and active dots (r=5). Custom legend component with colored line indicators.

### WeeklyKPIsBarChart

A grouped bar chart with three series:

| Series   | Color                     | DataKey   |
|----------|---------------------------|-----------|
| Leady    | amber `hsl(38, 92%, 50%)` | `leady`   |
| Klienti  | violet `hsl(258, 90%, 66%)`| `klienti` |
| Obchody  | emerald `hsl(160, 84%, 39%)`| `obchody`|

Data format: `{ name: string; leady: number; klienti: number; obchody: number }`. Max bar size of 18px with rounded top corners. Height 240px.

---

## 6. Data Management Page (`/sprava`)

### Server Component (`app/sprava/page.tsx`)

Uses `export const dynamic = "force-dynamic"` to disable static generation. Pre-fetches the initial 20 properties via `listPropertiesAction()` and passes them to `SpravaClient`. Wrapped in `AppLayout` with a sticky header ("Sprava dat" / "Nemovitosti, klienti, leady, obchody, prohlidky").

### SpravaClient (`app/sprava/components/SpravaClient.tsx`)

The main client component managing 9 entity tabs:

| Tab Key        | Entity       | Default Sort    | Columns                                               |
|----------------|--------------|-----------------|--------------------------------------------------------|
| `properties`   | Nemovitosti  | `createdAt`     | ID, Adresa, Ctvrt, Typ, Cena, Plocha, Status, Faze, Dispozice |
| `clients`      | Klienti      | `createdAt`     | ID, Jmeno, Email, Telefon, Zdroj, Segment, Datum      |
| `leads`        | Leady        | `createdAt`     | ID, Jmeno, Email, Zdroj, Status, Zajem, Datum         |
| `deals`        | Obchody      | `createdAt`     | ID, Nemovitost, Klient, Status, Hodnota, Uzavreno, Vytvoreno |
| `showings`     | Prohlidky    | `scheduledAt`   | ID, Nemovitost, Klient, Datum, Status, Poznamky       |
| `tasks`        | Ukoly        | `createdAt`     | ID, Nazev, Status, Priorita, Termin, Zodpovedny, Nemovitost, Vytvoreno |
| `investors`    | Investori    | `name`          | ID, Jmeno, Email, Telefon, Spolecnost, Nemovitosti, Investovano, Hodnota portfolia |
| `documents`    | Dokumenty    | `uploadedAt`    | ID, Nemovitost, Typ, Nazev, Odkaz, Nahrano            |
| `renovations`  | Rekonstrukce | `startedAt`     | ID, Nemovitost, Ctvrt, Faze, Status, Zacatek, Plan. konec, Zpozdeni, Dalsi krok, Ukolu, Po terminu, Vlastnik |

Each tab has independent state (`TabState`): items, total count, page, sortBy, sortOrder, search query, and a `loaded` flag. Data is loaded lazily when a tab is first activated using `useTransition` for non-blocking updates. Page size is 20 items.

All CRUD operations use server actions imported from `app/sprava/actions.ts`. Column definitions use a declarative `Column[]` format with support for types: `text`, `number`, `currency`, `date`, `badge`, `id`, `link`.

### EntityTable (`app/sprava/components/EntityTable.tsx`)

A generic table component with:

- **Sorting**: Clickable column headers with `ChevronUp`/`ChevronDown`/`ChevronsUpDown` icons
- **Cell rendering**: Handles `id` (mono), `currency` (amber, formatted CZK), `number` (mono), `date` (cs-CZ locale with date-only or datetime formatting), `link` (external "Otevrit" link), `badge` (colored per `STATUS_COLORS` mapping with label lookup)
- **Row actions**: `DropdownMenu` with Edit (Pencil) and Delete (Trash2) items
- **Pagination**: Page navigation with `ChevronLeft`/`ChevronRight` buttons, total count display
- **Row click handler**: Optional, used for navigating to renovation detail pages

### Entity Forms

Dialog-based form components for each entity type, all in `app/sprava/components/`:

- `PropertyForm.tsx` -- properties
- `ClientForm.tsx` -- clients
- `LeadForm.tsx` -- leads
- `DealForm.tsx` -- deals
- `ShowingForm.tsx` -- showings (includes `CalendarConflictInfo` for scheduling conflicts)
- `TaskForm.tsx` -- tasks
- `InvestorForm.tsx` -- investors
- `DocumentForm.tsx` -- documents
- `RenovationForm.tsx` -- renovations

### DeleteConfirmDialog (`app/sprava/components/DeleteConfirmDialog.tsx`)

An `AlertDialog` confirming record deletion. Used across all entity types.

### Renovation Detail Page (`/sprava/rekonstrukce/[id]`)

A server component that fetches renovation data via `getRenovationDetailAction()` and passes it to `RenovationDetailClient`. Uses `notFound()` for invalid or missing IDs.

---

## 7. Dashboard Page (`/dashboard`)

### Server Component (`app/dashboard/page.tsx`)

Pre-fetches data in parallel via `Promise.all`:

- Monitoring jobs list
- Call logs (20 most recent)
- Daily reminder calls automation config
- Report runs (20 most recent)
- Weekly executive report automation config

### AutomationsClient (`app/dashboard/components/AutomationsClient.tsx`)

Renders 3 tabs within `AppLayout`:

| Tab Key        | Label                | Component           |
|----------------|----------------------|---------------------|
| `monitoring`   | Monitoring           | MonitoringTab       |
| `calls`        | Pripominkove hovory  | ReminderCallsTab    |
| `automations`  | Ostatni automatizace | OtherAutomationsTab |

### MonitoringTab (`app/dashboard/components/MonitoringTab.tsx`)

Manages web scraping jobs (Sreality, Bezrealitky). Features:

- Job list with status badges (ACTIVE = emerald, PAUSED = amber, ERROR = red)
- Create/edit job via `JobForm` dialog
- Toggle job active/paused
- Manual trigger ("Run now") with loading state
- Delete job
- Job config display (price range, districts, disposition filters)

### ReminderCallsTab (`app/dashboard/components/ReminderCallsTab.tsx`)

Displays ElevenLabs reminder call logs with:

- Status-colored badges (PENDING = amber, INITIATED = emerald, FAILED = red, NO_PHONE/SKIPPED = muted)
- Manual trigger button to run reminder calls
- Pagination (20 items per page)
- `AutomationSettingsDialog` for configuring the daily schedule
- Toggle to enable/disable the automation

### OtherAutomationsTab (`app/dashboard/components/OtherAutomationsTab.tsx`)

Shows weekly executive report runs with:

- Status badges (RUNNING = amber, SUCCESS = emerald, FAILED = red)
- Duration display (ms or seconds)
- Trigger type labels (Cron vs. Manualni)
- Manual trigger button and `AutomationSettingsDialog`

---

## 8. State Management

### Primary State: `useChat`

The `useChat` hook from `ai/react` is the single source of truth for the chat page. It provides:

- `messages` -- full message history
- `input` / `setInput` -- controlled input state
- `isLoading` -- streaming state
- `handleSubmit` -- form submission handler
- `handleInputChange` -- input change handler (event-based)
- `append` -- programmatic message submission (used by inline action buttons in DataTab)
- `error` -- error state
- `data` -- stream annotations (used for explainability)

### Derived State

Two `useMemo` computations derive display data from messages:

- **`latestToolResult`**: Walks messages backward, finds the last assistant message with `toolInvocations`, returns the last invocation with `state === "result"`. Typed as `AgentToolResult | null`.
- **`latestExplainability`**: Walks the `data` array backward, finds the last entry with `type === "explainability"`. Typed as `ExplainabilityData | null`.

### Side Effects

- **Tab auto-switching**: `useEffect` in `ResultsPanel` watches `latestToolResult` and switches the active tab based on tool name.
- **Auto-scroll**: `useEffect` in `MessageList` scrolls to bottom when messages or isLoading change.
- **Lazy data loading**: `useCallback` + `useTransition` in `SpravaClient` triggers data fetch when a tab is first activated.

### Refs

- `sessionId` (`useRef` in Home): Stable session ID that survives re-renders, generated with `crypto.randomUUID()`.
- `baseInputRef` (`useRef` in ChatInput): Snapshots input text before speech recognition starts to enable appending.
- `bottomRef` (`useRef` in MessageList): Scroll anchor element.
- `recognitionRef` (`useRef` in useSpeechRecognition): Web Speech API instance.
- `onInterimRef` / `onFinalRef` (`useRef` in useSpeechRecognition): Stable callback references to avoid recreation.

### Custom Hooks

#### `useSpeechRecognition` (`hooks/useSpeechRecognition.ts`)

Wraps the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with:

- Language configuration (defaults to `cs-CZ` for Czech)
- `continuous: false`, `interimResults: true`, `maxAlternatives: 1`
- Interim and final transcript callbacks stored in refs to avoid recreating the recognition instance
- Status tracking: `idle`, `listening`, `unsupported`, `permission-denied`, `error`
- `startListening`, `stopListening`, `toggleListening` methods (all `useCallback`)
- Graceful error handling: silent return to idle on `no-speech` / `aborted`, explicit `permission-denied` state for blocked microphone
- Cleanup on unmount via `recognition.abort()`

Returns: `{ status, isListening, isSupported, startListening, stopListening, toggleListening }`.

### Data Management State (`/sprava`)

Uses `useTransition` for non-blocking server action calls. Each of the 9 entity tabs maintains independent `TabState` with items, pagination, sorting, and search. Form dialogs are controlled via `formOpen` / `editingRecord` state pairs. Delete confirmation via `deleteOpen` / `deletingRecord`. Form option dropdowns (property/client/deal lists) are fetched on demand via `getFormOptionsAction`.

### Dashboard State (`/dashboard`)

Each tab uses local `useState` with server action calls for data refresh. MonitoringTab tracks `runningJobId` for per-job loading states. ReminderCallsTab and OtherAutomationsTab track `running`, `runResult`, `error`, and `config` (toggle/settings) state independently.

---

## 9. Design System

### Color Palette

The application uses a dark navy theme defined as CSS custom properties in `app/globals.css`:

| Token             | HSL Value              | Hex Approx.  | Description              |
|-------------------|------------------------|--------------|--------------------------|
| `--background`    | `214 14% 5%`           | `#0B0F14`    | Dark navy base           |
| `--foreground`    | `210 20% 98%`          | `#F8FAFC`    | Near-white text          |
| `--card`          | `214 14% 7%`           | `#0F1419`    | Card background          |
| `--popover`       | `214 14% 8%`           | `#111820`    | Popover background       |
| `--primary`       | `38 92% 50%`           | `#f59e0b`    | Amber accent             |
| `--secondary`     | `214 12% 11%`          | `#161B22`    | Secondary surfaces       |
| `--muted`         | `214 12% 13%`          | `#1A2029`    | Muted surfaces           |
| `--accent`        | `214 12% 15%`          | `#1E2530`    | Accent surfaces          |
| `--border`        | `214 12% 16%`          | `#1F2937`    | Border color             |
| `--destructive`   | `0 72% 51%`            | --           | Error/danger             |

Chart palette variables: `--chart-1` (amber), `--chart-2` (emerald), `--chart-3` (sky), `--chart-4` (violet), `--chart-5` (red).

Additional custom tokens: `--surface-1` (`214 14% 9%`), `--surface-2` (`214 12% 13%`), `--surface-3` (`214 12% 17%`), `--amber`, `--emerald`.

The body has a subtle radial gradient overlay: `radial-gradient(ellipse 80% 50% at 50% -20%, primary/0.03, transparent)`.

### Typography

| Context    | Font Family    | CSS Selector          | Usage                                    |
|------------|----------------|-----------------------|------------------------------------------|
| Headings   | Syne           | `h1`--`h6`            | Panel titles, KPIs, brand name           |
| Body       | Outfit         | `html` (default)      | Paragraphs, labels, buttons, input text  |
| Monospace  | JetBrains Mono | `code, pre, .font-mono`| Timestamps, IDs, tool names, prices     |

The `prose-agent` CSS class provides Markdown rendering styles: `text-sm leading-relaxed`, Syne headings (h1 = `text-base`, h2 = `text-sm`, h3 = `text-xs uppercase tracking-wider`), Outfit body paragraphs, JetBrains Mono inline code with primary color, blockquotes with primary left border, and minimal table styling.

### Animations

| Class                    | Keyframes       | Duration | Easing    | Use Case                     |
|--------------------------|-----------------|----------|-----------|------------------------------|
| `animate-fade-in`        | `fadeIn`        | 0.3s     | ease-out  | Messages, tab content, panels|
| `animate-slide-in-right` | `slideInRight`  | 0.25s    | ease-out  | Results appearing             |
| `animate-slide-in-left`  | `slideInLeft`   | 0.2s     | ease-out  | Left-side elements           |
| `animate-scale-in`       | `scaleIn`       | 0.15s    | ease-out  | Popovers, dialogs            |
| `animate-pulse-amber`    | `pulse-amber`   | 1.5s     | ease-in-out | Loading indicators         |
| `animate-blink`          | `blink`         | 1s       | step-end  | Typing cursor                |
| `animate-pulse-mic`      | `pulse-mic`     | 1.5s     | ease-out  | Active microphone glow ring  |
| `shimmer`                | `shimmer`       | 1.5s     | infinite  | Skeleton loading placeholders|

`fadeIn` combines opacity (0->1) with translateY (6px->0). `slideInRight` uses translateX (12px->0). `pulse-mic` animates a box-shadow ring from amber/0.45 to transparent.

### Utility Classes

- `scrollbar-thin` -- 4px thin scrollbar with transparent track and border-colored thumb
- `glow-primary` -- large amber box-shadow glow (20px + 40px spread)
- `glow-primary-sm` -- small amber box-shadow glow (12px spread)
- `glass` -- card/0.6 background with 12px backdrop blur

All interactive elements (`button`, `a`, `input`, `textarea`, `select`) have `transition-colors duration-150` by default.

### Component Library

Built on **shadcn/ui** with **Radix UI** primitives. Installed components in `components/ui/`:

| Component        | File                  | Usage                                    |
|------------------|-----------------------|------------------------------------------|
| AlertDialog      | `alert-dialog.tsx`    | Delete confirmation dialogs              |
| Badge            | `badge.tsx`           | Status indicators                        |
| Button           | `button.tsx`          | Primary actions, form submissions        |
| Dialog           | `dialog.tsx`          | Entity create/edit forms                 |
| DropdownMenu     | `dropdown-menu.tsx`   | Row action menus (edit/delete)           |
| Input            | `input.tsx`           | Form text fields                         |
| Label            | `label.tsx`           | Form field labels                        |
| ScrollArea       | `scroll-area.tsx`     | Chat message list, results panel         |
| Select           | `select.tsx`          | Enum field dropdowns                     |
| Separator        | `separator.tsx`       | Visual dividers between sections         |
| Tabs             | `tabs.tsx`            | Results panel tabs, entity tabs, dashboard tabs |
| Textarea         | `textarea.tsx`        | Multi-line form inputs                   |

Icons are from **Lucide React** throughout the application. Border radius is set to `0.625rem` globally via `--radius`.

### Status Badges

Status values are mapped to Tailwind color classes via `STATUS_COLORS` in `lib/constants/labels.ts`. Czech label maps exist for all Prisma enums:

- `PROPERTY_TYPE_LABELS` -- BYT/DUM/POZEMEK/KOMERCNI
- `PROPERTY_STATUS_LABELS` -- AVAILABLE/IN_NEGOTIATION/SOLD/RENTED/WITHDRAWN
- `LEAD_STATUS_LABELS` -- NEW/CONTACTED/QUALIFIED/CONVERTED/LOST
- `DEAL_STATUS_LABELS` -- IN_PROGRESS/CLOSED_WON/CLOSED_LOST
- `LIFECYCLE_STAGE_LABELS`, `ACQUISITION_SOURCE_LABELS`, `CLIENT_SEGMENT_LABELS`
- `SHOWING_STATUS_LABELS`, `TASK_PRIORITY_LABELS`, `TASK_STATUS_LABELS`
- `DOCUMENT_TYPE_LABELS`, `RENOVATION_PHASE_LABELS`, `RENOVATION_STATUS_LABELS`
- `CALL_STATUS_LABELS`

---

## 10. See Also

- [architecture.md](./architecture.md) -- System architecture and request flow
- [tools.md](./tools.md) -- Tool definitions and implementation details
- [backend.md](./backend.md) -- API routes, database, and server-side logic
