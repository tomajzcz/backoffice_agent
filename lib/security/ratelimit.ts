import { NextResponse, type NextRequest } from "next/server"

type Bucket = { timestamps: number[] }
const BUCKETS = new Map<string, Bucket>()

function getClientId(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real
  return "anon"
}

export function rateLimit(
  req: NextRequest,
  opts: { key: string; limit: number; windowMs: number },
): { ok: true } | { ok: false; response: NextResponse } {
  const clientId = getClientId(req)
  const bucketKey = `${opts.key}:${clientId}`
  const now = Date.now()
  const cutoff = now - opts.windowMs

  const bucket = BUCKETS.get(bucketKey) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter(t => t > cutoff)

  if (bucket.timestamps.length >= opts.limit) {
    BUCKETS.set(bucketKey, bucket)
    const retryAfterSec = Math.ceil((bucket.timestamps[0]! + opts.windowMs - now) / 1000)
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Příliš mnoho požadavků, zkus to za chvíli." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSec)) } },
      ),
    }
  }

  bucket.timestamps.push(now)
  BUCKETS.set(bucketKey, bucket)

  if (BUCKETS.size > 10000) {
    for (const [k, v] of BUCKETS) {
      if (v.timestamps.length === 0 || v.timestamps[v.timestamps.length - 1]! < cutoff) {
        BUCKETS.delete(k)
      }
    }
  }

  return { ok: true }
}
