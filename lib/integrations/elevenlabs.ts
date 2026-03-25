/**
 * ElevenLabs Conversational AI — outbound call integration.
 *
 * Initiates voice calls via the ElevenLabs API for showing reminders.
 */

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

export interface OutboundCallParams {
  phoneNumber: string // E.164 format
  agentId: string
  dynamicVariables?: Record<string, string>
}

export interface OutboundCallResult {
  callId: string
  status: string
}

/**
 * Initiate an outbound phone call via ElevenLabs Conversational AI.
 *
 * Required env vars:
 * - ELEVENLABS_API_KEY
 * - ELEVENLABS_PHONE_NUMBER_ID
 */
export async function initiateOutboundCall(
  params: OutboundCallParams,
): Promise<OutboundCallResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error(
      "ElevenLabs API není nakonfigurováno. Nastav ELEVENLABS_API_KEY v .env.local",
    )
  }

  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID
  if (!phoneNumberId) {
    throw new Error(
      "ElevenLabs phone number není nakonfigurováno. Nastav ELEVENLABS_PHONE_NUMBER_ID v .env.local",
    )
  }

  const body: Record<string, unknown> = {
    agent_id: params.agentId,
    agent_phone_number_id: phoneNumberId,
    to_number: params.phoneNumber,
  }

  if (params.dynamicVariables && Object.keys(params.dynamicVariables).length > 0) {
    body.conversation_initiation_client_data = {
      dynamic_variables: params.dynamicVariables,
    }
  }

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/twilio/outbound-call`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(
      `ElevenLabs API selhalo: ${response.status} ${response.statusText} — ${errorText.slice(0, 500)}`,
    )
  }

  const data = await response.json()

  return {
    callId: data.call_id ?? data.id ?? "",
    status: data.status ?? "initiated",
  }
}
