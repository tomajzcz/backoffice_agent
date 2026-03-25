import { tool } from "ai"
import { z } from "zod"
import type { PrepareEmailDraftResult } from "@/types/agent"

export const createGmailDraftTool = tool({
  description:
    "Připraví návrh emailu ke schválení uživatelem (neodesílá ho a neukládá do Gmailu). " +
    "Použij pro přípravu komunikace s klienty — např. pozvánka na prohlídku, follow-up, nabídka. " +
    "Před použitím si zjisti detail nemovitosti (getPropertyDetails) a volné termíny (getCalendarAvailability) " +
    "pro relevantní kontext emailu. Uživatel musí návrh schválit před uložením do Gmailu.",
  parameters: z.object({
    to: z.string().email().describe("Email příjemce"),
    subject: z.string().describe("Předmět emailu"),
    body: z
      .string()
      .describe("Tělo emailu v HTML formátu. Použij <p>, <br>, <strong>, <ul>/<li> pro formátování."),
  }),
  execute: async ({ to, subject, body }): Promise<PrepareEmailDraftResult> => {
    return {
      toolName: "prepareEmailDraft",
      to,
      subject,
      bodyHtml: body,
      bodyPreview: body.replace(/<[^>]*>/g, "").slice(0, 200),
      preparedAt: new Date().toISOString(),
      chartType: "none",
    }
  },
})
