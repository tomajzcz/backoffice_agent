import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

export type BearerCheck =
  | { ok: true }
  | { ok: false; response: NextResponse }

/**
 * Timing-safe Bearer / header secret check that fails CLOSED when the
 * environment variable is unset. Returns a NextResponse the caller can return
 * immediately when the check fails.
 */
export function requireBearer(
  req: NextRequest,
  envVar: string,
  opts: { header?: string; bearerPrefix?: boolean } = {},
): BearerCheck {
  const { header = "authorization", bearerPrefix = true } = opts
  const secret = process.env[envVar]
  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${envVar} is not configured` },
        { status: 500 },
      ),
    }
  }
  const received = req.headers.get(header) ?? ""
  const expected = bearerPrefix ? `Bearer ${secret}` : secret
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true }
}
