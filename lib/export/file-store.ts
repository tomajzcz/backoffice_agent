/**
 * Generic file store for temporary export files (PDF, PPTX, etc.).
 * Uses /tmp with token-based access and automatic expiry.
 */
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

const TTL_MS = 10 * 60 * 1000 // 10 minutes

function tokenPath(token: string, prefix: string): string {
  const safe = token.replace(/[^a-zA-Z0-9-]/g, "")
  return join(tmpdir(), `${prefix}${safe}`)
}

export function storeFile(buffer: Buffer, prefix: string): string {
  const token = crypto.randomUUID()
  const path = tokenPath(token, prefix)
  const meta = { expiresAt: Date.now() + TTL_MS }
  writeFileSync(path, buffer)
  writeFileSync(path + ".json", JSON.stringify(meta))
  return token
}

export function getFile(token: string, prefix: string): Buffer | null {
  const path = tokenPath(token, prefix)
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
