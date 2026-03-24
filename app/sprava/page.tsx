import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"
import { listPropertiesAction } from "./actions"
import { SpravaClient } from "./components/SpravaClient"

export const dynamic = "force-dynamic"

export default async function SpravaPage() {
  const initialProperties = await listPropertiesAction({
    limit: 20,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  return (
    <div className="h-screen overflow-auto bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
                Správa dat
              </h1>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Nemovitosti, klienti, leady, obchody, prohlídky
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-primary/80 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zpět na chat
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <SpravaClient initialProperties={initialProperties} />
      </main>
    </div>
  )
}
