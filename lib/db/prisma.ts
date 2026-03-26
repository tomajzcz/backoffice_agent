import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!)
  // Increase connection pool for serverless (default is 5 / 15s timeout)
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "10")
  }
  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "30")
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: url.toString(),
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Graceful shutdown — close connection on process exit to avoid stale connections
function handleShutdown() {
  prisma.$disconnect().catch(console.error)
}

if (typeof process !== "undefined") {
  process.on("beforeExit", handleShutdown)
}
