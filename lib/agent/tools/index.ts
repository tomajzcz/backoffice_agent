import { queryNewClientsTool } from "./queryNewClients"
import { queryLeadsSalesTimelineTool } from "./queryLeadsSalesTimeline"
import { scanMissingRenovationDataTool } from "./scanMissingRenovationData"
import { createAgentTaskTool } from "./createAgentTask"
import { queryWeeklyKPIsTool } from "./queryWeeklyKPIs"
import { generateReportTool } from "./generateReport"
import { generatePresentationTool } from "./generatePresentation"
import { getCalendarAvailabilityTool } from "./getCalendarAvailability"
import { createCalendarEventTool } from "./createCalendarEvent"
import { updateCalendarEventTool } from "./updateCalendarEvent"
import { deleteCalendarEventTool } from "./deleteCalendarEvent"
import { listCalendarEventsTool } from "./listCalendarEvents"
import { getPropertyDetailsTool } from "./getPropertyDetails"
import { createGmailDraftTool } from "./createGmailDraft"
import { listScheduledJobsTool } from "./listScheduledJobs"
import { triggerMonitoringJobTool } from "./triggerMonitoringJob"
import { getMonitoringResultsTool } from "./getMonitoringResults"
import { createMonitoringJobTool } from "./createMonitoringJob"
// CRUD tools
import { listPropertiesTool } from "./listProperties"
import { createPropertyTool } from "./createProperty"
import { updatePropertyTool } from "./updateProperty"
import { listClientsTool } from "./listClients"
import { createClientTool } from "./createClient"
import { updateClientTool } from "./updateClient"
import { listLeadsTool } from "./listLeads"
import { createLeadTool } from "./createLead"
import { updateLeadTool } from "./updateLead"
import { listDealsTool } from "./listDeals"
import { createDealTool } from "./createDeal"
import { updateDealTool } from "./updateDeal"
import { listShowingsTool } from "./listShowings"
import { createShowingTool } from "./createShowing"
import { updateShowingTool } from "./updateShowing"

export const agentTools = {
  queryNewClients: queryNewClientsTool,
  queryLeadsSalesTimeline: queryLeadsSalesTimelineTool,
  scanMissingRenovationData: scanMissingRenovationDataTool,
  createAgentTask: createAgentTaskTool,
  queryWeeklyKPIs: queryWeeklyKPIsTool,
  generateReport: generateReportTool,
  generatePresentation: generatePresentationTool,
  getCalendarAvailability: getCalendarAvailabilityTool,
  createCalendarEvent: createCalendarEventTool,
  updateCalendarEvent: updateCalendarEventTool,
  deleteCalendarEvent: deleteCalendarEventTool,
  listCalendarEvents: listCalendarEventsTool,
  getPropertyDetails: getPropertyDetailsTool,
  createGmailDraft: createGmailDraftTool,
  listScheduledJobs: listScheduledJobsTool,
  triggerMonitoringJob: triggerMonitoringJobTool,
  getMonitoringResults: getMonitoringResultsTool,
  createMonitoringJob: createMonitoringJobTool,
  // CRUD tools
  listProperties: listPropertiesTool,
  createProperty: createPropertyTool,
  updateProperty: updatePropertyTool,
  listClients: listClientsTool,
  createClient: createClientTool,
  updateClient: updateClientTool,
  listLeads: listLeadsTool,
  createLead: createLeadTool,
  updateLead: updateLeadTool,
  listDeals: listDealsTool,
  createDeal: createDealTool,
  updateDeal: updateDealTool,
  listShowings: listShowingsTool,
  createShowing: createShowingTool,
  updateShowing: updateShowingTool,
} as const

export type AgentToolName = keyof typeof agentTools
