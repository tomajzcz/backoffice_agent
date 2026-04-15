"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface LineData {
  name: string
  leady: number
  prodeje: number
}

interface Props {
  data: LineData[]
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2.5 shadow-xl text-xs space-y-1.5">
      <p className="font-medium text-foreground font-mono">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">
            {p.name === "leady" ? "Leady" : "Prodeje"}:
          </span>
          <span className="font-mono font-medium" style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div className="flex gap-4 justify-center mt-1">
      {payload?.map((entry: { value: string; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-0.5 rounded" style={{ background: entry.color, display: "inline-block" }} />
          {entry.value === "leady" ? "Leady" : "Prodeje"}
        </div>
      ))}
    </div>
  )
}

export function LeadsSalesLineChart({ data, title }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-64 rounded-md shimmer" />
  }

  return (
    <div className="w-full">
      {title && (
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(240,5%,55%)", fontSize: 11, fontFamily: "Outfit" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(240,5%,45%)", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Line
            type="monotone"
            dataKey="leady"
            stroke="hsl(38,92%,50%)"
            strokeWidth={2}
            dot={{ fill: "hsl(38,92%,50%)", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(38,92%,60%)" }}
          />
          <Line
            type="monotone"
            dataKey="prodeje"
            stroke="hsl(160,84%,39%)"
            strokeWidth={2}
            dot={{ fill: "hsl(160,84%,39%)", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(160,84%,50%)" }}
            strokeDasharray="0"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
