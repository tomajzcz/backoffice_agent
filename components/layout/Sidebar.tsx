"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, MessageSquare, Database, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/sprava", label: "Správa dat", icon: Database },
  { href: "/dashboard", label: "Automatizace", icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] shrink-0 h-screen flex flex-col bg-[hsl(var(--surface-1))] border-r border-border/40">
      {/* Brand */}
      <Link href="/" className="px-4 py-4 flex items-center gap-3 hover:bg-accent/30 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1
            className="text-sm font-semibold text-foreground leading-none"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Back Office Agent
          </h1>
          <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">
            Realitní operativa
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-foreground border-l-2 border-primary ml-0 pl-[10px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent ml-0 pl-[10px]"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span
            className="text-[10px] text-emerald-400/80"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            online
          </span>
        </div>
      </div>
    </aside>
  )
}
