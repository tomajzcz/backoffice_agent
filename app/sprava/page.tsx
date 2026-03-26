import { Building2 } from "lucide-react"
import { listPropertiesAction } from "./actions"
import { SpravaClient } from "./components/SpravaClient"
import { AppLayout } from "@/components/layout/AppLayout"

export const dynamic = "force-dynamic"

export default async function SpravaPage() {
  const initialProperties = await listPropertiesAction({
    limit: 20,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        {/* Header */}
        <header className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                Správa dat
              </h1>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Nemovitosti, klienti, leady, obchody, prohlídky
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          <SpravaClient initialProperties={initialProperties} />
        </main>
      </div>
    </AppLayout>
  )
}
