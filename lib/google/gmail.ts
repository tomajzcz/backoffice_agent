import { google } from "googleapis"
import { getGoogleClient } from "./auth"
import { assertAllowedRecipient } from "@/lib/security/email-allowlist"

export interface DraftResult {
  draftId: string
  messageId: string
}

function assertSafeHeader(value: string, field: string): void {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Neplatný znak v poli ${field}`)
  }
}

function encodeMimeBase64Url(mimeMessage: string): string {
  return Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function buildAttachmentMime(
  to: string,
  subject: string,
  htmlBody: string,
  attachment: { filename: string; mimeType: string; content: Buffer },
): string {
  const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`
  return [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
    "",
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}`,
    `Content-Disposition: attachment; filename="${attachment.filename}"`,
    "Content-Transfer-Encoding: base64",
    "",
    attachment.content.toString("base64"),
    "",
    `--${boundary}--`,
  ].join("\r\n")
}

function buildSimpleMime(to: string, subject: string, htmlBody: string): string {
  return [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlBody, "utf-8").toString("base64"),
  ].join("\r\n")
}

/**
 * Sends an email with an attachment. Guarded by the recipient allowlist.
 * Prefer `saveDraftWithAttachment` unless the send is explicitly intended.
 */
export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  htmlBody: string,
  attachment: { filename: string; mimeType: string; content: Buffer },
): Promise<{ messageId: string }> {
  assertSafeHeader(to, "To")
  assertSafeHeader(subject, "Subject")
  assertSafeHeader(attachment.filename, "filename")
  assertAllowedRecipient(to)

  const auth = getGoogleClient()
  if (!auth) {
    throw new Error("Google API není nakonfigurováno. Nastav GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_REFRESH_TOKEN v .env.local")
  }

  const gmail = google.gmail({ version: "v1", auth })
  const mimeMessage = buildAttachmentMime(to, subject, htmlBody, attachment)
  const encodedMessage = encodeMimeBase64Url(mimeMessage)

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  })

  return { messageId: response.data.id ?? "" }
}

/**
 * Saves a Gmail DRAFT with an attachment (no auto-send). Guarded by the
 * recipient allowlist so the draft cannot be addressed to arbitrary recipients.
 */
export async function saveDraftWithAttachment(
  to: string,
  subject: string,
  htmlBody: string,
  attachment: { filename: string; mimeType: string; content: Buffer },
): Promise<DraftResult> {
  assertSafeHeader(to, "To")
  assertSafeHeader(subject, "Subject")
  assertSafeHeader(attachment.filename, "filename")
  assertAllowedRecipient(to)

  const auth = getGoogleClient()
  if (!auth) {
    throw new Error("Google API není nakonfigurováno. Nastav GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_REFRESH_TOKEN v .env.local")
  }

  const gmail = google.gmail({ version: "v1", auth })
  const mimeMessage = buildAttachmentMime(to, subject, htmlBody, attachment)
  const encodedMessage = encodeMimeBase64Url(mimeMessage)

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw: encodedMessage } },
  })

  return {
    draftId: response.data.id!,
    messageId: response.data.message?.id ?? "",
  }
}

export async function saveDraft(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<DraftResult> {
  assertSafeHeader(to, "To")
  assertSafeHeader(subject, "Subject")
  assertAllowedRecipient(to)

  const auth = getGoogleClient()
  if (!auth) {
    throw new Error("Google API není nakonfigurováno. Nastav GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_REFRESH_TOKEN v .env.local")
  }

  const gmail = google.gmail({ version: "v1", auth })
  const mimeMessage = buildSimpleMime(to, subject, htmlBody)
  const encodedMessage = encodeMimeBase64Url(mimeMessage)

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw: encodedMessage } },
  })

  return {
    draftId: response.data.id!,
    messageId: response.data.message?.id ?? "",
  }
}
