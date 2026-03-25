import { streamText, StreamData } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { NextRequest } from "next/server"
import { agentTools } from "@/lib/agent/tools"
import { getSystemPrompt } from "@/lib/agent/prompts"
import { logAgentRun } from "@/lib/agent/run-logger"
import { buildExplainability } from "@/lib/agent/explainability"
import type { ToolCallLog } from "@/types/agent"

// Critical: without this, Vercel cuts streaming at 10s
export const maxDuration = 120

/**
 * Strip large payloads (base64 data URLs, long markdown) from previous tool results
 * to prevent conversation history from bloating on subsequent messages.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimMessageHistory(messages: any[]): any[] {
  return messages.map((msg) => {
    if (msg.role !== "assistant") return msg

    // Handle toolInvocations array (AI SDK v4 format)
    if (Array.isArray(msg.toolInvocations)) {
      return {
        ...msg,
        toolInvocations: msg.toolInvocations.map((inv: Record<string, unknown>) => {
          if (inv.state !== "result" || !inv.result) {
            // Patch incomplete invocations so the AI SDK doesn't throw
            // AI_MessageConversionError on the next request
            return {
              ...inv,
              state: "result",
              result: {
                toolName: inv.toolName ?? "unknown",
                error: "Tool call did not complete. Please retry.",
                chartType: "none",
              },
            }
          }
          const result = inv.result as Record<string, unknown>
          const trimmed = { ...result }
          // Strip base64 data URLs (PPTX, images, etc.)
          if (typeof trimmed.downloadUrl === "string" && (trimmed.downloadUrl as string).startsWith("data:")) {
            trimmed.downloadUrl = "[file already delivered to client]"
          }
          // Truncate large markdown (reports)
          if (typeof trimmed.markdown === "string" && (trimmed.markdown as string).length > 500) {
            trimmed.markdown = (trimmed.markdown as string).slice(0, 500) + "\n...[truncated for context window]"
          }
          // Truncate large HTML bodies (email drafts)
          if (typeof trimmed.bodyHtml === "string" && (trimmed.bodyHtml as string).length > 500) {
            trimmed.bodyHtml = (trimmed.bodyHtml as string).slice(0, 500) + "...[truncated]"
          }
          return { ...inv, result: trimmed }
        }),
      }
    }

    // Handle content array format (tool-result parts)
    if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((part: Record<string, unknown>) => {
          if (part.type !== "tool-result" || !part.result) {
            if (part.type === "tool-result") {
              return {
                ...part,
                result: {
                  toolName: "unknown",
                  error: "Tool call did not complete. Please retry.",
                  chartType: "none",
                },
              }
            }
            return part
          }
          const result = part.result as Record<string, unknown>
          const trimmed = { ...result }
          if (typeof trimmed.downloadUrl === "string" && (trimmed.downloadUrl as string).startsWith("data:")) {
            trimmed.downloadUrl = "[file already delivered to client]"
          }
          if (typeof trimmed.markdown === "string" && (trimmed.markdown as string).length > 500) {
            trimmed.markdown = (trimmed.markdown as string).slice(0, 500) + "\n...[truncated for context window]"
          }
          if (typeof trimmed.bodyHtml === "string" && (trimmed.bodyHtml as string).length > 500) {
            trimmed.bodyHtml = (trimmed.bodyHtml as string).slice(0, 500) + "...[truncated]"
          }
          return { ...part, result: trimmed }
        }),
      }
    }

    return msg
  })
}

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json()

  const trimmedMessages = trimMessageHistory(messages)

  const toolCallLog: ToolCallLog[] = []
  const recordCounts: Record<string, number> = {}
  const streamData = new StreamData()

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: getSystemPrompt(),
    messages: trimmedMessages,
    tools: agentTools,
    // Critical: without maxSteps, LLM issues tool calls but never responds with text
    maxSteps: 10,
    onStepFinish: ({ toolCalls, toolResults }) => {
      for (const call of toolCalls ?? []) {
        toolCallLog.push({
          toolName: call.toolName,
          params: call.args as Record<string, unknown>,
          startedAt: Date.now(),
        })
      }
      // Capture record counts from tool results for explainability
      for (const res of toolResults ?? []) {
        if (res && typeof res === "object") {
          const r = res as Record<string, unknown>
          const name = r.toolName as string | undefined
          if (!name) continue
          if (typeof r.totalCount === "number") recordCounts[name] = r.totalCount
          if (typeof r.totalClients === "number") recordCounts[name] = r.totalClients
          if (typeof r.totalLeads === "number") recordCounts[name] = r.totalLeads
          if (typeof r.totalEvents === "number") recordCounts[name] = r.totalEvents
          if (typeof r.totalFreeSlots === "number") recordCounts[name] = r.totalFreeSlots
          if (typeof r.totalJobs === "number") recordCounts[name] = r.totalJobs
          if (typeof r.totalResults === "number") recordCounts[name] = r.totalResults
        }
      }
    },
    onFinish: async ({ text }) => {
      // Append explainability data if tools were called
      if (toolCallLog.length > 0) {
        const explainability = buildExplainability(toolCallLog, recordCounts)
        streamData.appendMessageAnnotation(JSON.parse(JSON.stringify(explainability)))
      }
      streamData.close()

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

  return result.toDataStreamResponse({ data: streamData })
}
