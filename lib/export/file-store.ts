/**
 * Generic file store for temporary export files (PDF, PPTX, etc.).
 * Uses the database (FileToken model) for cross-instance persistence on serverless.
 */
import { prisma } from "@/lib/db/prisma"

const TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function storeFile(buffer: Buffer, prefix: string): Promise<string> {
  const token = crypto.randomUUID()
  await prisma.fileToken.create({
    data: {
      token,
      prefix,
      data: buffer.toString("base64"),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  })
  return token
}

export async function getFile(token: string, prefix: string): Promise<Buffer | null> {
  const row = await prisma.fileToken.findUnique({ where: { token } })
  if (!row || row.prefix !== prefix) return null

  if (row.expiresAt < new Date()) {
    // Expired — clean up
    await prisma.fileToken.delete({ where: { token } }).catch(() => {})
    return null
  }

  return Buffer.from(row.data, "base64")
}
