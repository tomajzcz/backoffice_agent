/**
 * Twilio SMS integration — sends confirmation messages to clients.
 *
 * Required env vars:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER  (E.164, e.g. +420...)
 */

export interface SendSmsParams {
  to: string // E.164 format
  body: string
}

export interface SendSmsResult {
  messageSid: string
  status: string
}

/**
 * Build and send a showing confirmation SMS to a client.
 */
export async function sendShowingConfirmationSms(params: {
  clientName: string
  clientPhone: string
  propertyAddress: string
  scheduledAt: string
}): Promise<SendSmsResult> {
  const dateFormatted = new Date(params.scheduledAt).toLocaleString("cs-CZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Prague",
  })
  const body =
    `Dobrý den, ${params.clientName}. ` +
    `Vaše prohlídka nemovitosti na adrese ${params.propertyAddress} ` +
    `je naplánována na ${dateFormatted}. ` +
    `Těšíme se na Vás!`
  return sendSms({ to: params.clientPhone, body })
}

/**
 * Build and send a showing cancellation SMS to a client.
 */
export async function sendShowingCancellationSms(params: {
  clientName: string
  clientPhone: string
  propertyAddress: string
  scheduledAt: string
}): Promise<SendSmsResult> {
  const dateFormatted = new Date(params.scheduledAt).toLocaleString("cs-CZ", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Prague",
  })
  const body =
    `Dobrý den, ${params.clientName}. ` +
    `Vaše prohlídka nemovitosti na adrese ${params.propertyAddress} ` +
    `plánovaná na ${dateFormatted} byla zrušena. ` +
    `Omlouváme se za komplikace. V případě dotazů nás neváhejte kontaktovat.`
  return sendSms({ to: params.clientPhone, body })
}

/**
 * Send an SMS via Twilio REST API.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  if (!accountSid) {
    throw new Error(
      "Twilio není nakonfigurováno. Nastav TWILIO_ACCOUNT_SID v .env.local",
    )
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    throw new Error(
      "Twilio není nakonfigurováno. Nastav TWILIO_AUTH_TOKEN v .env.local",
    )
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) {
    throw new Error(
      "Twilio není nakonfigurováno. Nastav TWILIO_PHONE_NUMBER v .env.local",
    )
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const body = new URLSearchParams({
    To: params.to,
    From: fromNumber,
    Body: params.body,
  })

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(
      `Twilio API selhalo: ${response.status} ${response.statusText} — ${errorText.slice(0, 500)}`,
    )
  }

  const data = await response.json()

  return {
    messageSid: data.sid ?? "",
    status: data.status ?? "queued",
  }
}
