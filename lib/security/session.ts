export const SESSION_COOKIE = "app_session"

/**
 * Constant-time string equality usable in the Next.js Edge runtime
 * (which forbids `node:crypto`).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function isValidSessionCookie(value: string | undefined | null): boolean {
  const secret = process.env.APP_SESSION_SECRET
  if (!secret) return false
  if (!value) return false
  return constantTimeEqual(value, secret)
}
