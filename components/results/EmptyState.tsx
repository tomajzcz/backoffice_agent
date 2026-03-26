import type { LucideIcon } from "lucide-react"

interface Props {
  icon: LucideIcon
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground/70">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/50 max-w-[240px]">{description}</p>
        )}
      </div>
    </div>
  )
}
