/**
 * Shared filename utilities for exports (used both client-side and server-side).
 */

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ _-]/g, "").slice(0, 100)
}

export function buildTimestampedFilename(prefix: string, ext: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  return `${sanitizeFilename(prefix)}-${ts}.${ext}`
}
