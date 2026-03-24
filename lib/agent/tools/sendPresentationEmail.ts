import { tool } from "ai"
import { z } from "zod"
import { sendEmailWithAttachment } from "@/lib/google/gmail"
import { getPptx } from "@/lib/export/pptx-store"
import type { SendPresentationEmailResult } from "@/types/agent"

export const sendPresentationEmailTool = tool({
  description:
    "Odešle vygenerovanou PPTX prezentaci jako přílohu emailu. " +
    "Vyžaduje pptxToken z předchozího generatePresentation výsledku — " +
    "extrahuj ho z downloadUrl query parametru 'token'. " +
    "Pokud prezentace ještě nebyla vygenerována, nejdříve ji vygeneruj přes generatePresentation.",
  parameters: z.object({
    to: z.string().email().describe("Email příjemce"),
    subject: z
      .string()
      .default("Prezentace - Back Office Report")
      .describe("Předmět emailu"),
    body: z
      .string()
      .default("<p>Dobrý den,</p><p>v příloze najdete prezentaci.</p><p>S pozdravem,<br>Back Office Agent</p>")
      .describe("Tělo emailu v HTML formátu"),
    pptxToken: z
      .string()
      .describe("Token z downloadUrl předchozího generatePresentation výsledku (query parametr 'token')"),
    filename: z
      .string()
      .default("prezentace")
      .describe("Název souboru přílohy bez přípony"),
  }),
  execute: async ({ to, subject, body, pptxToken, filename }): Promise<SendPresentationEmailResult> => {
   try {
    const buffer = getPptx(pptxToken)
    if (!buffer) {
      return {
        toolName: "sendPresentationEmail",
        messageId: "",
        to,
        subject,
        title: filename,
        sentAt: new Date().toISOString(),
        chartType: "none",
      }
    }

    const result = await sendEmailWithAttachment(to, subject, body, {
      filename: `${filename}.pptx`,
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      content: buffer,
    })

    return {
      toolName: "sendPresentationEmail",
      messageId: result.messageId,
      to,
      subject,
      title: filename,
      sentAt: new Date().toISOString(),
      chartType: "none",
    }
   } catch (err) {
    console.error("[sendPresentationEmail] error:", err)
    return {
      toolName: "sendPresentationEmail",
      messageId: "",
      to,
      subject,
      title: filename,
      sentAt: new Date().toISOString(),
      chartType: "none",
    }
   }
  },
})
