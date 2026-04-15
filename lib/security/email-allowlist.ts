const RAW = process.env.EMAIL_ALLOWLIST ?? ""
const ENTRIES = RAW.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)

/**
 * Entries may be:
 *   - full address:  pepa@firma.cz
 *   - domain:        @firma.cz
 * If the env var is empty, every recipient is REJECTED (fail closed).
 */
export function isRecipientAllowed(to: string): boolean {
  if (ENTRIES.length === 0) return false
  const addr = to.trim().toLowerCase()
  if (ENTRIES.includes(addr)) return true
  const at = addr.indexOf("@")
  if (at < 0) return false
  const domain = "@" + addr.slice(at + 1)
  return ENTRIES.includes(domain)
}

export function assertAllowedRecipient(to: string): void {
  if (!isRecipientAllowed(to)) {
    throw new Error("Příjemce není v povoleném seznamu (EMAIL_ALLOWLIST)")
  }
}
