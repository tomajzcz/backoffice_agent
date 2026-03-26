import { streamText, StreamData } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { NextRequest } from "next/server"
import { agentTools } from "@/lib/agent/tools"
import { selectTools } from "@/lib/agent/tool-selector"
import { getSystemPrompt } from "@/lib/agent/prompts"
import { logAgentRun } from "@/lib/agent/run-logger"
import { buildExplainability } from "@/lib/agent/explainability"
import type { ToolCallLog } from "@/types/agent"

// Critical: without this, Vercel cuts streaming at 10s
export const maxDuration = 120

// Array keys in tool results that can grow large
const TRIMMABLE_ARRAYS = [
  "properties", "clients", "leads", "deals", "showings",
  "events", "results", "investors", "renovations",
  "overdueTasks", "dueSoonTasks", "categories", "topListings",
  "weeks", "timeline", "byDistrict", "byPhase", "bySource",
  "byDisposition", "byStage", "byPriority", "freeSlots", "byDate",
  "jobs", "documents", "tasks", "issues",
]

/**
 * Trim a tool result object: strip base64, truncate text, cap arrays.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimToolResult(result: Record<string, unknown>): Record<string, unknown> {
  const trimmed = { ...result }
  // Strip base64 data URLs (PPTX, images, etc.)
  if (typeof trimmed.downloadUrl === "string" && (trimmed.downloadUrl as string).startsWith("data:")) {
    trimmed.downloadUrl = "[file already delivered to client]"
  }
  // Truncate large markdown (reports)
  if (typeof trimmed.markdown === "string" && (trimmed.markdown as string).length > 500) {
    trimmed.markdown = (trimmed.markdown as string).slice(0, 500) + "\n...[truncated]"
  }
  // Truncate large HTML bodies (email drafts)
  if (typeof trimmed.bodyHtml === "string" && (trimmed.bodyHtml as string).length > 500) {
    trimmed.bodyHtml = (trimmed.bodyHtml as string).slice(0, 500) + "...[truncated]"
  }
  // Strip chartData entirely (frontend already rendered it)
  if (Array.isArray(trimmed.chartData)) {
    trimmed.chartData = []
  }
  // Cap large arrays to 3 items + preserve count
  for (const key of TRIMMABLE_ARRAYS) {
    if (Array.isArray(trimmed[key]) && (trimmed[key] as unknown[]).length > 3) {
      const arr = trimmed[key] as unknown[]
      trimmed[key] = arr.slice(0, 3)
      trimmed[`_${key}Total`] = arr.length
    }
  }
  return trimmed
}

/**
 * Strip large payloads from previous tool results and limit history length
 * to prevent conversation history from bloating on subsequent messages.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimMessageHistory(messages: any[]): any[] {
  // Keep only last 20 messages to cap history tokens
  const recent = messages.slice(-20)

  return recent.map((msg) => {
    if (msg.role !== "assistant") return msg

    // Handle toolInvocations array (AI SDK v4 format)
    if (Array.isArray(msg.toolInvocations)) {
      return {
        ...msg,
        toolInvocations: msg.toolInvocations.map((inv: Record<string, unknown>) => {
          if (inv.state !== "result" || !inv.result) {
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
          return { ...inv, result: trimToolResult(inv.result as Record<string, unknown>) }
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
          return { ...part, result: trimToolResult(part.result as Record<string, unknown>) }
        }),
      }
    }

    return msg
  })
}

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json()

  const trimmedMessages = trimMessageHistory(messages)

  // Select only relevant tools based on the user's latest message
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")
  const userQuery = typeof lastUserMsg?.content === "string"
    ? lastUserMsg.content
    : JSON.stringify(lastUserMsg?.content ?? "")
  const selectedTools = selectTools(userQuery, agentTools)

  const toolCallLog: ToolCallLog[] = []
  const recordCounts: Record<string, number> = {}
  const streamData = new StreamData()

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: getSystemPrompt(),
    messages: trimmedMessages,
    tools: selectedTools,
    maxRetries: 1,
    // Critical: without maxSteps, LLM issues tool calls but never responds with text
    maxSteps: 5,
    onStepFinish: ({ toolCalls, toolResults }) => {
      for (const call of toolCalls ?? []) {
        if (!call) continue
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
