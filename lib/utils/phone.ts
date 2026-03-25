/**
 * Normalize a phone number to E.164 format.
 *
 * Handles common Czech formats:
 * - "+420 777 111 222" → "+420777111222"
 * - "777 111 222"      → "+420777111222"
 * - "00420777111222"    → "+420777111222"
 * - "+420777111222"     → "+420777111222" (already normalized)
 *
 * Non-Czech international numbers (e.g. +49...) are accepted as-is
 * if they match E.164 length constraints.
 *
 * Returns null if the phone is null, empty, or invalid.
 */
export function normalizePhoneE164(phone: string | null | undefined): string | null {
  if (!phone || phone.trim().length === 0) return null

  // Strip whitespace, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "")

  // Handle "00420..." international dialing prefix
  if (cleaned.startsWith("00420")) {
    cleaned = "+420" + cleaned.slice(5)
  }

  // Handle 9-digit Czech numbers without country code (starting with 6 or 7)
  if (/^[67]\d{8}$/.test(cleaned)) {
    cleaned = "+420" + cleaned
  }

  // Valid Czech number: +420 followed by 9 digits
  if (/^\+420\d{9}$/.test(cleaned)) {
    return cleaned
  }

  // Accept other valid international E.164 numbers
  if (/^\+\d{10,15}$/.test(cleaned)) {
    return cleaned
  }

  return null
}
