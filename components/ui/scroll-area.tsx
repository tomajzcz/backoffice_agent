import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
}

function ScrollArea({ children, className }: ScrollAreaProps) {
  return (
    <div className={cn("overflow-auto scrollbar-thin", className)}>
      {children}
    </div>
  )
}

export { ScrollArea }
