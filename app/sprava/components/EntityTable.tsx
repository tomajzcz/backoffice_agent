"use client"

import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STATUS_COLORS } from "@/lib/constants/labels"
import { formatCZK } from "@/lib/utils"

export interface Column {
  key: string
  label: string
  sortable?: boolean
  type?: "text" | "number" | "currency" | "date" | "badge" | "id"
  labelMap?: Record<string, string>
  className?: string
}

interface Props {
  columns: Column[]
  data: Record<string, unknown>[]
  sortBy: string
  sortOrder: "asc" | "desc"
  onSort: (key: string) => void
  onEdit: (row: Record<string, unknown>) => void
  onDelete: (row: Record<string, unknown>) => void
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("cs-CZ", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== column) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
  return sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
}

function CellValue({ column, value }: { column: Column; value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground/30">—</span>

  switch (column.type) {
    case "id":
      return <span className="text-muted-foreground/50 font-mono">{String(value)}</span>
    case "currency":
      return <span className="text-amber-400 font-mono font-medium">{formatCZK(value as number)}</span>
    case "number":
      return <span className="font-mono">{String(value)}</span>
    case "date":
      return <span className="text-muted-foreground/60 font-mono">{String(value).includes("T") && String(value).includes(":") ? formatDateTime(String(value)) : formatDate(String(value))}</span>
    case "badge": {
      const label = column.labelMap?.[String(value)] ?? String(value)
      const color = STATUS_COLORS[String(value)] ?? "text-muted-foreground border-border/40 bg-secondary/40"
      return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${color}`}>
          {label}
        </span>
      )
    }
    default:
      return <span className={column.className}>{String(value)}</span>
  }
}

export function EntityTable({
  columns, data, sortBy, sortOrder, onSort, onEdit, onDelete,
  page, totalPages, totalCount, onPageChange,
}: Props) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium ${
                    col.sortable ? "cursor-pointer hover:text-foreground/80 select-none" : ""
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon column={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
                  </span>
                </th>
              ))}
              <th className="w-10 py-2.5 px-3" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-muted-foreground/40">
                  Žádné záznamy
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={String(row.id)}
                  className="border-t border-border/20 hover:bg-secondary/20 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 px-3 max-w-[200px] truncate">
                      <CellValue column={col} value={row[col.key]} />
                    </td>
                  ))}
                  <td className="py-2 px-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Upravit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(row)} className="text-red-400 focus:text-red-400">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[10px] text-muted-foreground/50 font-mono">
            Celkem {totalCount} záznamů
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
