import { DashboardClient } from "./components/DashboardClient"
import { listJobsAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const jobs = await listJobsAction()
  return <DashboardClient initialJobs={jobs} />
}
