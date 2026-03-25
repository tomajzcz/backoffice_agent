import { tool } from "ai"
import { z } from "zod"
import { createTask } from "@/lib/db/queries/tasks"
import type { CreateAgentTaskResult } from "@/types/agent"

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Nízká",
  MEDIUM: "Střední",
  HIGH: "Vysoká",
  URGENT: "Urgentní",
}

export const createAgentTaskTool = tool({
  description:
    "Uloží nový úkol do systému pro Pepu. Použij po nalezení problémů (např. chybějící data o rekonstrukci), " +
    "nebo když Pepa chce zaznamenat follow-up akci. " +
    "Vždy nabídni uložení úkolu po scanu nebo analýze, která odhalí akční body.",
  parameters: z.object({
    title: z.string().describe("Název úkolu (stručný, max 100 znaků)"),
    description: z.string().optional().describe("Volitelný detailní popis úkolu"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .default("MEDIUM")
      .describe("Priorita úkolu: LOW, MEDIUM, HIGH nebo URGENT"),
    dueDate: z
      .string()
      .optional()
      .describe("Termín splnění ve formátu ISO 8601 (YYYY-MM-DD), volitelné"),
    assignee: z
      .string()
      .optional()
      .describe("Zodpovědná osoba (např. Pepa, Martin)"),
    propertyId: z
      .number()
      .int()
      .optional()
      .describe("ID nemovitosti, ke které se úkol váže"),
    dealId: z
      .number()
      .int()
      .optional()
      .describe("ID obchodu, ke kterému se úkol váže"),
    renovationId: z
      .number()
      .int()
      .optional()
      .describe("ID rekonstrukce, ke které se úkol váže"),
    sourceQuery: z
      .string()
      .optional()
      .describe("Původní dotaz, ze kterého úkol vznikl"),
  }),
  execute: async ({ title, description, priority, dueDate, assignee, propertyId, dealId, renovationId, sourceQuery }): Promise<CreateAgentTaskResult> => {
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined

    const task = await createTask({
      title,
      description,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      dueDate: parsedDueDate,
      assignee,
      propertyId,
      dealId,
      renovationId,
      sourceQuery,
    })

    return {
      toolName: "createAgentTask",
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      priorityLabel: PRIORITY_LABELS[task.priority] ?? task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assignee: task.assignee ?? null,
      propertyAddress: task.propertyAddress ?? null,
      dealId: task.dealId ?? null,
      chartType: "none",
    }
  },
})
