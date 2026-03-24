import { prisma } from "@/lib/db/prisma"

export async function createTask(params: {
  title: string
  description?: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: Date
  sourceQuery?: string
}): Promise<{ id: number; title: string; priority: string; dueDate: Date | null }> {
  const task = await prisma.agentTask.create({
    data: {
      title: params.title,
      description: params.description ?? null,
      priority: params.priority,
      dueDate: params.dueDate ?? null,
      sourceQuery: params.sourceQuery ?? null,
      status: "OPEN",
    },
  })

  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    dueDate: task.dueDate,
  }
}
