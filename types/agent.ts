// ─── Tool result types ────────────────────────────────────────────────────────
// Shared between tool execute() functions and frontend components

export type ChartType = "bar" | "line" | "none"

export interface QueryNewClientsResult {
  toolName: "queryNewClients"
  totalClients: number
  period: string // "Q1 2025"
  bySource: Array<{
    source: string
    sourceLabel: string
    count: number
    percentage: number
  }>
  clients: Array<{
    id: number
    name: string
    email: string
    phone: string | null
    source: string
    sourceLabel: string
    segment: string
    segmentLabel: string
    createdAt: string
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface QueryLeadsSalesTimelineResult {
  toolName: "queryLeadsSalesTimeline"
  monthsBack: number
  totalLeads: number
  totalSold: number
  conversionRate: number // percentage
  timeline: Array<{
    month: string
    monthLabel: string
    leads: number
    converted: number
    soldProperties: number
  }>
  chartType: "line"
  chartData: Array<{
    name: string    // monthLabel
    leady: number
    prodeje: number
  }>
}

export interface ScanMissingRenovationResult {
  toolName: "scanMissingRenovationData"
  totalCount: number
  properties: Array<{
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    areaM2: number
    yearBuilt: number | null
  }>
  byDistrict: Array<{ district: string; count: number }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface CreateAgentTaskResult {
  toolName: "createAgentTask"
  taskId: number
  title: string
  priority: string
  priorityLabel: string
  dueDate: string | null
  assignee: string | null
  propertyAddress: string | null
  dealId: number | null
  chartType: "none"
}

export interface QueryWeeklyKPIsResult {
  toolName: "queryWeeklyKPIs"
  weeksBack: number
  weeks: Array<{
    weekStart: string
    weekLabel: string
    newLeads: number
    newClients: number
    propertiesListed: number
    dealsClosed: number
    revenue: number
  }>
  trends: {
    leadsChange: number
    clientsChange: number
    revenueChange: number
    dealsChange: number
  }
  totals: {
    totalLeads: number
    totalClients: number
    totalDeals: number
    totalRevenue: number
  }
  chartType: "bar"
  chartData: Array<{
    name: string
    leady: number
    klienti: number
    obchody: number
  }>
}

export interface GenerateReportResult {
  toolName: "generateReport"
  reportType: "weekly_summary" | "renovation_scan"
  title: string
  markdown: string
  generatedAt: string
  chartType: "none"
}

export interface GeneratePresentationResult {
  toolName: "generatePresentation"
  downloadUrl: string
  slideCount: number
  title: string
  chartType: "none"
}

export interface GetCalendarAvailabilityResult {
  toolName: "getCalendarAvailability"
  dateRangeStart: string
  dateRangeEnd: string
  totalFreeSlots: number
  freeSlots: Array<{
    date: string
    dateLabel: string
    start: string
    end: string
    durationMinutes: number
  }>
  byDate: Array<{ date: string; dateLabel: string; slotsCount: number }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface CreateCalendarEventResult {
  toolName: "createCalendarEvent"
  event: {
    googleEventId: string
    summary: string
    start: string
    end: string
    location: string | null
    htmlLink: string
    description: string | null
  }
  linkedShowingId: number | null
  chartType: "none"
}

export interface UpdateCalendarEventResult {
  toolName: "updateCalendarEvent"
  event: {
    googleEventId: string
    summary: string
    start: string
    end: string
    location: string | null
  }
  updatedFields: string[]
  linkedShowingId: number | null
  chartType: "none"
}

export interface DeleteCalendarEventResult {
  toolName: "deleteCalendarEvent"
  googleEventId: string
  deleted: boolean
  message: string
  linkedShowingId: number | null
  chartType: "none"
}

export interface ListCalendarEventsResult {
  toolName: "listCalendarEvents"
  dateRangeStart: string
  dateRangeEnd: string
  totalEvents: number
  events: Array<{
    googleEventId: string
    summary: string
    start: string
    end: string
    location: string | null
    description: string | null
    status: string
    htmlLink: string
  }>
  chartType: "none"
}

export interface GetPropertyDetailsResult {
  toolName: "getPropertyDetails"
  property: {
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    areaM2: number
    yearBuilt: number | null
    lastRenovationYear: number | null
    renovationNotes: string | null
    lifecycleStage: string | null
    lifecycleStageLabel: string | null
    stageChangedAt: string | null
    purchasePrice: number | null
    renovationCost: number | null
    expectedSalePrice: number | null
    documentCount: number
    taskCount: number
    ownerName: string | null
    ownerEmail: string | null
    ownerPhone: string | null
  }
  chartType: "none"
}

export interface CreateGmailDraftResult {
  toolName: "createGmailDraft"
  draftId: string
  to: string
  subject: string
  bodyPreview: string
  bodyHtml: string
  savedAt: string
  chartType: "none"
}

export interface SendPresentationEmailResult {
  toolName: "sendPresentationEmail"
  messageId: string
  to: string
  subject: string
  title: string
  sentAt: string
  chartType: "none"
}

export interface ListScheduledJobsResult {
  toolName: "listScheduledJobs"
  totalJobs: number
  jobs: Array<{
    id: number
    name: string
    description: string | null
    cronExpr: string
    status: string
    lastRunAt: string | null
    nextRunAt: string | null
    resultsCount: number
  }>
  chartType: "none"
}

export interface TriggerMonitoringJobResult {
  toolName: "triggerMonitoringJob"
  jobId: number
  jobName: string
  triggered: boolean
  message: string
  triggeredAt: string
  chartType: "none"
}

export interface GetMonitoringResultsResult {
  toolName: "getMonitoringResults"
  jobId: number
  jobName: string
  days: number
  totalResults: number
  newResults: number
  results: Array<{
    id: number
    source: string
    title: string
    url: string
    price: number | null
    district: string | null
    disposition: string | null
    foundAt: string
    isNew: boolean
  }>
  chartType: "none"
}

// ─── CRUD result types ────────────────────────────────────────────────────────

// Properties
export interface ListPropertiesResult {
  toolName: "listProperties"
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  properties: Array<{
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    lifecycleStage: string | null
    lifecycleStageLabel: string | null
    areaM2: number
    disposition: string | null
    yearBuilt: number | null
    ownerName: string | null
    createdAt: string
  }>
  chartType: "none"
}

export interface CreatePropertyResult {
  toolName: "createProperty"
  property: {
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    areaM2: number
  }
  chartType: "none"
}

export interface UpdatePropertyResult {
  toolName: "updateProperty"
  property: {
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    areaM2: number
  }
  updatedFields: string[]
  chartType: "none"
}

// Clients
export interface ListClientsResult {
  toolName: "listClients"
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  clients: Array<{
    id: number
    name: string
    email: string
    phone: string | null
    acquisitionSource: string
    sourceLabel: string
    segment: string
    segmentLabel: string
    createdAt: string
  }>
  chartType: "none"
}

export interface CreateClientResult {
  toolName: "createClient"
  client: {
    id: number
    name: string
    email: string
    segment: string
    segmentLabel: string
  }
  chartType: "none"
}

export interface UpdateClientResult {
  toolName: "updateClient"
  client: {
    id: number
    name: string
    email: string
    segment: string
    segmentLabel: string
  }
  updatedFields: string[]
  chartType: "none"
}

// Leads
export interface ListLeadsResult {
  toolName: "listLeads"
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  leads: Array<{
    id: number
    name: string
    email: string
    phone: string | null
    source: string
    sourceLabel: string
    status: string
    statusLabel: string
    propertyInterest: string | null
    createdAt: string
    convertedAt: string | null
  }>
  chartType: "none"
}

export interface CreateLeadResult {
  toolName: "createLead"
  lead: {
    id: number
    name: string
    email: string
    status: string
    statusLabel: string
  }
  chartType: "none"
}

export interface UpdateLeadResult {
  toolName: "updateLead"
  lead: {
    id: number
    name: string
    email: string
    status: string
    statusLabel: string
  }
  updatedFields: string[]
  chartType: "none"
}

// Deals
export interface ListDealsResult {
  toolName: "listDeals"
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  deals: Array<{
    id: number
    propertyAddress: string
    propertyDistrict: string
    clientName: string
    status: string
    statusLabel: string
    value: number
    closedAt: string | null
    createdAt: string
  }>
  chartType: "none"
}

export interface CreateDealResult {
  toolName: "createDeal"
  deal: {
    id: number
    propertyAddress: string
    clientName: string
    status: string
    statusLabel: string
    value: number
  }
  chartType: "none"
}

export interface UpdateDealResult {
  toolName: "updateDeal"
  deal: {
    id: number
    propertyAddress: string
    clientName: string
    status: string
    statusLabel: string
    value: number
  }
  updatedFields: string[]
  chartType: "none"
}

// Showings
export interface ListShowingsResult {
  toolName: "listShowings"
  totalCount: number
  limit: number
  offset: number
  hasMore: boolean
  showings: Array<{
    id: number
    propertyAddress: string
    propertyDistrict: string
    clientName: string
    scheduledAt: string
    status: string
    statusLabel: string
    notes: string | null
    googleCalendarEventId: string | null
  }>
  chartType: "none"
}

export interface CreateShowingResult {
  toolName: "createShowing"
  showing: {
    id: number
    propertyAddress: string
    clientName: string
    scheduledAt: string
    status: string
    statusLabel: string
    googleCalendarEventId: string | null
  }
  chartType: "none"
}

export interface UpdateShowingResult {
  toolName: "updateShowing"
  showing: {
    id: number
    propertyAddress: string
    clientName: string
    scheduledAt: string
    status: string
    statusLabel: string
    googleCalendarEventId: string | null
  }
  updatedFields: string[]
  chartType: "none"
}

// ─── New operational tool results ─────────────────────────────────────────────

export interface QueryPropertiesByLifecycleResult {
  toolName: "queryPropertiesByLifecycle"
  totalCount: number
  filterStage: string | null
  filterDistrict: string | null
  stalledProperties: Array<{
    id: number
    address: string
    district: string
    lifecycleStage: string
    lifecycleStageLabel: string
    daysInStage: number
  }>
  properties: Array<{
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    price: number
    status: string
    statusLabel: string
    lifecycleStage: string
    lifecycleStageLabel: string
    stageChangedAt: string | null
    daysInStage: number
    areaM2: number
    disposition: string | null
    ownerName: string | null
  }>
  byStage: Array<{ stage: string; stageLabel: string; count: number }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface ScanOverdueTasksResult {
  toolName: "scanOverdueTasks"
  totalOverdue: number
  totalDueSoon: number
  overdueTasks: Array<{
    id: number
    title: string
    description: string | null
    priority: string
    priorityLabel: string
    dueDate: string
    daysOverdue: number
    status: string
    statusLabel: string
    assignee: string | null
    propertyAddress: string | null
    propertyId: number | null
    dealId: number | null
  }>
  dueSoonTasks: Array<{
    id: number
    title: string
    priority: string
    priorityLabel: string
    dueDate: string
    daysUntilDue: number
    assignee: string | null
    propertyAddress: string | null
  }>
  byPriority: Array<{ priority: string; priorityLabel: string; count: number }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface ScanOperationalHealthResult {
  toolName: "scanOperationalHealth"
  overallScore: number
  totalIssues: number
  categories: Array<{
    category: string
    categoryLabel: string
    severity: "high" | "medium" | "low"
    count: number
    items: Array<{
      id: number
      label: string
      detail: string
    }>
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface CalculatePropertyProfitabilityResult {
  toolName: "calculatePropertyProfitability"
  totalProperties: number
  totalInvestment: number
  totalExpectedRevenue: number
  totalPotentialProfit: number
  averageROI: number
  properties: Array<{
    id: number
    address: string
    district: string
    type: string
    typeLabel: string
    purchasePrice: number
    renovationCost: number
    expectedSalePrice: number
    totalInvestment: number
    potentialProfit: number
    roi: number
    lifecycleStage: string | null
    lifecycleStageLabel: string | null
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface GetInvestorOverviewResult {
  toolName: "getInvestorOverview"
  totalInvestors: number
  totalPortfolioValue: number
  totalInvested: number
  investors: Array<{
    id: number
    name: string
    email: string
    company: string | null
    propertyCount: number
    totalInvested: number
    totalCurrentValue: number
    properties: Array<{
      id: number
      address: string
      district: string
      lifecycleStage: string | null
      lifecycleStageLabel: string | null
      investedAmount: number | null
      currentValue: number
    }>
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface GetPropertyDocumentsResult {
  toolName: "getPropertyDocuments"
  propertyId: number
  propertyAddress: string
  totalDocuments: number
  documents: Array<{
    id: number
    type: string
    typeLabel: string
    name: string
    url: string | null
    uploadedAt: string
    notes: string | null
  }>
  chartType: "none"
}

export interface ScanMissingDocumentsResult {
  toolName: "scanMissingDocuments"
  totalPropertiesChecked: number
  totalWithMissingDocs: number
  properties: Array<{
    id: number
    address: string
    district: string
    status: string
    statusLabel: string
    lifecycleStage: string | null
    lifecycleStageLabel: string | null
    existingDocs: string[]
    missingDocs: string[]
    missingDocLabels: string[]
    completeness: number
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export interface AnalyzeNewListingsResult {
  toolName: "analyzeNewListings"
  jobId: number
  jobName: string
  days: number
  totalResults: number
  marketStats: {
    avgPrice: number
    avgPricePerM2: number
    priceRange: { min: number; max: number }
    medianPrice: number
  }
  topListings: Array<{
    id: number
    source: string
    title: string
    url: string
    price: number | null
    pricePerM2: number | null
    district: string | null
    disposition: string | null
    areaM2: number | null
    score: number
    scoreReason: string | null
    foundAt: string
    isNew: boolean
  }>
  byDisposition: Array<{
    disposition: string
    count: number
    avgPrice: number
  }>
  chartType: "bar"
  chartData: Array<{ name: string; pocet: number }>
}

export type AgentToolResult =
  | QueryNewClientsResult
  | QueryLeadsSalesTimelineResult
  | ScanMissingRenovationResult
  | CreateAgentTaskResult
  | QueryWeeklyKPIsResult
  | GenerateReportResult
  | GeneratePresentationResult
  | GetCalendarAvailabilityResult
  | CreateCalendarEventResult
  | UpdateCalendarEventResult
  | DeleteCalendarEventResult
  | ListCalendarEventsResult
  | GetPropertyDetailsResult
  | CreateGmailDraftResult
  | SendPresentationEmailResult
  | ListScheduledJobsResult
  | TriggerMonitoringJobResult
  | GetMonitoringResultsResult
  | ListPropertiesResult
  | CreatePropertyResult
  | UpdatePropertyResult
  | ListClientsResult
  | CreateClientResult
  | UpdateClientResult
  | ListLeadsResult
  | CreateLeadResult
  | UpdateLeadResult
  | ListDealsResult
  | CreateDealResult
  | UpdateDealResult
  | ListShowingsResult
  | CreateShowingResult
  | UpdateShowingResult
  | PrepareEmailDraftResult
  | QueryPropertiesByLifecycleResult
  | ScanOverdueTasksResult
  | ScanOperationalHealthResult
  | CalculatePropertyProfitabilityResult
  | GetInvestorOverviewResult
  | GetPropertyDocumentsResult
  | ScanMissingDocumentsResult
  | AnalyzeNewListingsResult

// ─── Email approval ──────────────────────────────────────────────────────────

export interface PrepareEmailDraftResult {
  toolName: "prepareEmailDraft"
  to: string
  subject: string
  bodyHtml: string
  bodyPreview: string
  preparedAt: string
  chartType: "none"
}

// ─── Explainability ─────────────────────────────────────────────────────────

export interface ExplainabilityData {
  type: "explainability"
  turnId: string
  toolsUsed: Array<{
    toolName: string
    toolLabel: string
    params: Record<string, unknown>
    durationMs?: number
  }>
  dataSources: string[]
  recordCounts: Record<string, number>
  filters: Record<string, string>
  limitations: string[]
  timestamp: string
}

// ─── Agent run log ────────────────────────────────────────────────────────────

export interface AgentRunRecord {
  id: number
  sessionId: string
  userQuery: string
  toolsCalledJson: ToolCallLog[]
  outputSummary: string | null
  createdAt: string
}

export interface ToolCallLog {
  toolName: string
  params: Record<string, unknown>
  startedAt?: number
}
