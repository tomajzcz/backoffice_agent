import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Back Office Agent — Realitní operativa",
  description:
    "AI agent pro back office realitní firmy. Analýza dat, generování reportů, monitoring trhu.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className="dark">
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  )
}
