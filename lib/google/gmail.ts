import { google } from "googleapis"
import { getGoogleClient } from "./auth"

export interface DraftResult {
  draftId: string
  messageId: string
}

export async function saveDraft(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<DraftResult> {
  const auth = getGoogleClient()
  if (!auth) {
    throw new Error("Google API není nakonfigurováno. Nastav GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_REFRESH_TOKEN v .env.local")
  }

  const gmail = google.gmail({ version: "v1", auth })

  // Build MIME message
  const mimeMessage = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
  ].join("\r\n")

  const encodedMessage = Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encodedMessage,
      },
    },
  })

  return {
    draftId: response.data.id!,
    messageId: response.data.message?.id ?? "",
  }
}
