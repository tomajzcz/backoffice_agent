"use client"

import { Sidebar } from "./Sidebar"

interface Props {
  children: React.ReactNode
}

export function AppLayout({ children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
