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
  Legend,
} from "recharts"

interface KPIData {
  name: string
  leady: number
  klienti: number
  obchody: number
}

interface Props {
  data: KPIData[]
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-card px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null
  return (
    <div className="flex gap-4 justify-center mt-1">
      {payload.map((p: { value: string; color: string }) => (
        <div key={p.value} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: p.color }} />
          <span className="text-[11px] text-muted-foreground/70 capitalize">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyKPIsBarChart({ data, title }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-64 rounded-md shimmer" />
  }

  return (
    <div className="w-full">
      {title && (
        <p
          className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(240,5%,55%)", fontSize: 10, fontFamily: "Outfit" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "hsl(240,5%,45%)", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="leady" name="Leady" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} maxBarSize={18} opacity={0.85} />
          <Bar dataKey="klienti" name="Klienti" fill="hsl(258, 90%, 66%)" radius={[2, 2, 0, 0]} maxBarSize={18} opacity={0.85} />
          <Bar dataKey="obchody" name="Obchody" fill="hsl(160, 84%, 39%)" radius={[2, 2, 0, 0]} maxBarSize={18} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
