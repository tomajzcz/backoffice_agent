/**
 * Client-side CSV builder with proper escaping and Czech UTF-8 support.
 */

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVField).join(",")
  const dataLines = rows.map((row) => row.map(escapeCSVField).join(","))
  return [headerLine, ...dataLines].join("\n")
}

export function downloadCSV(headers: string[], rows: string[][], filename: string): void {
  const csv = buildCSV(headers, rows)
  // BOM for Excel to detect UTF-8 (critical for Czech diacritics)
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
