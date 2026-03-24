import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: process.env.DATABASE_URL,
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
