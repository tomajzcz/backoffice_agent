import * as React from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  className?: string
}

function Separator({ orientation = "horizontal", className }: SeparatorProps) {
  return (
    <div
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "w-px",
        className
      )}
    />
  )
}

export { Separator }
