import { AutomationsClient } from "./components/AutomationsClient"
import { listJobsAction, listCallLogsAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [jobs, callLogs] = await Promise.all([
    listJobsAction(),
    listCallLogsAction({ limit: 20, offset: 0, sortBy: "createdAt", sortOrder: "desc" }),
  ])
  return <AutomationsClient initialJobs={jobs} initialCallLogs={callLogs} />
}
