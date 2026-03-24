"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface BarData {
  name: string
  pocet: number
}

interface Props {
  data: BarData[]
  title?: string
}

const AMBER = "hsl(38, 92%, 50%)"
const AMBER_DIM = "hsl(38, 92%, 40%)"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-amber-400 font-mono">
        {payload[0].value} {payload[0].value === 1 ? "klient" : payload[0].value < 5 ? "klienti" : "klientů"}
      </p>
    </div>
  )
}

export function ClientSourcesBarChart({ data, title }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="h-64 rounded-md shimmer" />
    )
  }

  const maxVal = Math.max(...data.map((d) => d.pocet))

  return (
    <div className="w-full">
      {title && (
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium"
           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="pocet" radius={[3, 3, 0, 0]} maxBarSize={52}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.pocet === maxVal ? AMBER : AMBER_DIM}
                opacity={0.85 + (entry.pocet / maxVal) * 0.15}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
