import { google } from "googleapis"
import { getGoogleClient } from "@/lib/google/auth"
import { assertAllowedRecipient } from "@/lib/security/email-allowlist"
import type { ScrapedListing } from "./types"

function formatPrice(price: number | null): string {
  if (!price) return "—"
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(price)
}

function buildHtmlEmail(jobName: string, results: ScrapedListing[]): string {
  const rows = results.map((r) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">
        <a href="${r.url}" style="color:#d97706;text-decoration:none;font-weight:500;">${r.title}</a>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap;">${formatPrice(r.price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.disposition ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.areaM2 ? `${r.areaM2} m²` : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;">${r.source}</td>
    </tr>
  `).join("")

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;">
      <h2 style="color:#1a1a1a;margin-bottom:4px;">Monitoring: ${jobName}</h2>
      <p style="color:#666;margin-top:0;">Nalezeno <strong>${results.length}</strong> nových nabídek</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Nabídka</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Cena</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Dispozice</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Plocha</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #ddd;">Zdroj</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#999;font-size:12px;margin-top:16px;">
        Odesláno automaticky z Back Office Operations Agent
      </p>
    </div>
  `
}

/**
 * Send monitoring results email directly (not as draft).
 */
export async function sendMonitoringEmail(
  toEmail: string,
  jobName: string,
  results: ScrapedListing[],
): Promise<void> {
  if (results.length === 0) return

  if (/[\r\n]/.test(toEmail) || /[\r\n]/.test(jobName)) {
    throw new Error("Neplatný znak v poli To/Subject")
  }
  assertAllowedRecipient(toEmail)

  const auth = getGoogleClient()
  if (!auth) {
    console.warn("[notify] Google API not configured, skipping email")
    return
  }

  const gmail = google.gmail({ version: "v1", auth })
  const subject = `Monitoring ${jobName}: ${results.length} nových nabídek`
  const htmlBody = buildHtmlEmail(jobName, results)

  const mimeMessage = [
    `To: ${toEmail}`,
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

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  })
}
