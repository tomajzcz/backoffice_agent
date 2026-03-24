import { prisma } from "@/lib/db/prisma"
import type { ToolCallLog } from "@/types/agent"

interface LogAgentRunParams {
  sessionId: string
  userQuery: string
  toolsCalledJson: ToolCallLog[]
  outputSummary: string | null
}

export async function logAgentRun(params: LogAgentRunParams): Promise<void> {
  await prisma.agentRun.create({
    data: {
      sessionId: params.sessionId,
      userQuery: params.userQuery.slice(0, 1000), // cap at 1000 chars
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toolsCalledJson: params.toolsCalledJson as any,
      outputSummary: params.outputSummary,
    },
  })
}
