import { AutomationsClient } from "./components/AutomationsClient"
import {
  listJobsAction,
  listCallLogsAction,
  listReportRunsAction,
  getAutomationConfigAction,
} from "./actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [jobs, callLogs, callsConfig, reportRuns, reportConfig] = await Promise.all([
    listJobsAction(),
    listCallLogsAction({ limit: 20, offset: 0, sortBy: "createdAt", sortOrder: "desc" }),
    getAutomationConfigAction("daily_reminder_calls"),
    listReportRunsAction({ limit: 20, offset: 0 }),
    getAutomationConfigAction("weekly_executive_report"),
  ])
  return (
    <AutomationsClient
      initialJobs={jobs}
      initialCallLogs={callLogs}
      initialCallsConfig={callsConfig}
      initialReportRuns={reportRuns}
      initialReportConfig={reportConfig}
    />
  )
}
