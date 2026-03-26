import { notFound } from "next/navigation"
import { getRenovationDetailAction } from "../../actions"
import { RenovationDetailClient } from "./RenovationDetailClient"
import { AppLayout } from "@/components/layout/AppLayout"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function RenovationDetailPage({ params }: Props) {
  const { id } = await params
  const renovationId = parseInt(id, 10)
  if (isNaN(renovationId)) notFound()

  const data = await getRenovationDetailAction(renovationId)
  if (!data) notFound()

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <RenovationDetailClient renovation={data} />
      </div>
    </AppLayout>
  )
}
