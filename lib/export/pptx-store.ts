/**
 * File-system-based store for generated PPTX files.
 * Uses /tmp so the buffer is shared across all Next.js API routes
 * (unlike a module-level Map which is isolated per-route bundle).
 * Tokens expire after 10 minutes.
 */
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const TTL_MS = 10 * 60 * 1000 // 10 minutes
const PREFIX = "pptx-"

function tokenPath(token: string): string {
  // Sanitize token to prevent path traversal
  const safe = token.replace(/[^a-zA-Z0-9-]/g, "")
  return join(tmpdir(), `${PREFIX}${safe}`)
}

export function storePptx(buffer: Buffer): string {
  const token = crypto.randomUUID()
  const meta = { expiresAt: Date.now() + TTL_MS }
  writeFileSync(tokenPath(token), buffer)
  writeFileSync(tokenPath(token) + ".json", JSON.stringify(meta))
  return token
}

export function getPptx(token: string): Buffer | null {
  const path = tokenPath(token)
  const metaPath = path + ".json"
  if (!existsSync(path) || !existsSync(metaPath)) return null

  try {
    const meta = JSON.parse(readFileSync(metaPath, "utf-8"))
    if (meta.expiresAt < Date.now()) {
      unlinkSync(path)
      unlinkSync(metaPath)
      return null
    }
    return readFileSync(path)
  } catch {
    return null
  }
}
