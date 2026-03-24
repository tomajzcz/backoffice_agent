import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { NextRequest } from "next/server"
import { agentTools } from "@/lib/agent/tools"
import { getSystemPrompt } from "@/lib/agent/prompts"
import { logAgentRun } from "@/lib/agent/run-logger"
import type { ToolCallLog } from "@/types/agent"

// Critical: without this, Vercel cuts streaming at 10s
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json()

  const toolCallLog: ToolCallLog[] = []

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: getSystemPrompt(),
    messages,
    tools: agentTools,
    // Critical: without maxSteps, LLM issues tool calls but never responds with text
    maxSteps: 10,
    onStepFinish: ({ toolCalls }) => {
      for (const call of toolCalls ?? []) {
        toolCallLog.push({
          toolName: call.toolName,
          params: call.args as Record<string, unknown>,
          startedAt: Date.now(),
        })
      }
    },
    onFinish: async ({ text }) => {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m: { role: string }) => m.role === "user")
      const userQuery =
        typeof lastUserMessage?.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage?.content ?? "")

      // Fire-and-forget — never block the stream response
      logAgentRun({
        sessionId: sessionId ?? "anonymous",
        userQuery,
        toolsCalledJson: toolCallLog,
        outputSummary: text?.slice(0, 500) ?? null,
      }).catch(console.error)
    },
  })

  return result.toDataStreamResponse()
}
