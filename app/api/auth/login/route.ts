import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { SESSION_COOKIE } from "@/lib/security/session"
import { rateLimit } from "@/lib/security/ratelimit"

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { key: "login", limit: 10, windowMs: 60_000 })
  if (!rl.ok) return rl.response

  const secret = process.env.APP_SESSION_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "APP_SESSION_SECRET is not configured" },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const password = typeof (body as { password?: unknown })?.password === "string"
    ? (body as { password: string }).password
    : ""

  const a = Buffer.from(password)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set({
    name: SESSION_COOKIE,
    value: secret,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
