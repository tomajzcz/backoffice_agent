import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)

  const runs = await prisma.agentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      sessionId: true,
      userQuery: true,
      toolsCalledJson: true,
      outputSummary: true,
      createdAt: true,
    },
  })

  return NextResponse.json(runs)
}
