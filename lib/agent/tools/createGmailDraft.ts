import { tool } from "ai"
import { z } from "zod"
import { saveDraft } from "@/lib/google/gmail"
import type { CreateGmailDraftResult } from "@/types/agent"

export const createGmailDraftTool = tool({
  description:
    "Uloží draft emailu do Gmailu (neodesílá ho). " +
    "Použij pro přípravu komunikace s klienty — např. pozvánka na prohlídku, follow-up, nabídka. " +
    "Před použitím si zjisti detail nemovitosti (getPropertyDetails) a volné termíny (getCalendarAvailability) " +
    "pro relevantní kontext emailu.",
  parameters: z.object({
    to: z.string().email().describe("Email příjemce"),
    subject: z.string().describe("Předmět emailu"),
    body: z
      .string()
      .describe("Tělo emailu v HTML formátu. Použij <p>, <br>, <strong>, <ul>/<li> pro formátování."),
  }),
  execute: async ({ to, subject, body }): Promise<CreateGmailDraftResult> => {
    const result = await saveDraft(to, subject, body)

    return {
      toolName: "createGmailDraft",
      draftId: result.draftId,
      to,
      subject,
      bodyPreview: body.replace(/<[^>]*>/g, "").slice(0, 200),
      bodyHtml: body,
      savedAt: new Date().toISOString(),
      chartType: "none",
    }
  },
})
