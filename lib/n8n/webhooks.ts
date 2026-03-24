export async function triggerN8nWorkflow(
  webhookPath: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; message: string }> {
  const baseUrl = process.env.N8N_BASE_URL
  const secret = process.env.N8N_WEBHOOK_SECRET

  if (!baseUrl) {
    return {
      success: false,
      message: "n8n není nakonfigurováno. Nastav N8N_BASE_URL v .env.local",
    }
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${webhookPath.replace(/^\//, "")}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return {
      success: false,
      message: `n8n webhook selhal: ${response.status} ${response.statusText}`,
    }
  }

  return { success: true, message: "Workflow spuštěn úspěšně" }
}
