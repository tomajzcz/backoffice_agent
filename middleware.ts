import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, isValidSessionCookie } from "@/lib/security/session"

// Public routes: anything below is accessible WITHOUT a session cookie.
// Cron + webhook endpoints enforce their own shared-secret checks.
const PUBLIC_EXACT = new Set<string>([
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/cron/monitoring",
  "/api/cron/daily-reminder-calls",
  "/api/cron/weekly-report",
  "/api/n8n-webhook",
])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next()

  const cookie = req.cookies.get(SESSION_COOKIE)?.value
  if (isValidSessionCookie(cookie)) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("from", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|.*\\..*).*)"],
}
