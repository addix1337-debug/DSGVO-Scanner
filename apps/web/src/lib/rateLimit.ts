/**
 * Simple in-memory rate limiter for POST /api/scan.
 *
 * Trade-offs (MVP decision):
 *   ✅ Works correctly in single-process deployments (local dev, single VPS/container)
 *   ❌ Does NOT work in serverless/edge environments where each invocation is a
 *      separate process with no shared memory (e.g., Vercel serverless functions).
 *      For Vercel: replace with @upstash/ratelimit + Redis, or Vercel KV.
 *
 * IP resolution:
 *   - Local dev: falls back to "dev" (no proxy headers)
 *   - Behind reverse proxy (nginx, Vercel): reads x-forwarded-for (first IP)
 *   - Production recommendation: configure trusted proxy so x-forwarded-for
 *     is not spoofable (nginx: set_real_ip_from + real_ip_header)
 */

const WINDOW_MS = 10 * 60 * 1000  // 10 minutes
const MAX_REQUESTS = 10           // per IP per window
const COOLDOWN_MS = 10 * 1000    // min gap between scans from same IP (10s)

interface Entry {
  count: number
  resetAt: number       // when the window resets
  lastScanAt: number    // timestamp of last accepted scan
}

const store = new Map<string, Entry>()

// Periodic cleanup — prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 5 * 60 * 1000).unref() // .unref() so this timer doesn't keep the process alive

// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number       // Unix ms — use for Retry-After header
  reason?: 'window_exceeded' | 'cooldown'
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  let entry = store.get(ip)

  // New window or expired
  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + WINDOW_MS, lastScanAt: now }
    store.set(ip, entry)
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: entry.resetAt }
  }

  // Cooldown check (10s between scans)
  if (now - entry.lastScanAt < COOLDOWN_MS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.lastScanAt + COOLDOWN_MS,
      reason: 'cooldown',
    }
  }

  // Window limit check
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, reason: 'window_exceeded' }
  }

  entry.count++
  entry.lastScanAt = now
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}

// ---------------------------------------------------------------------------

export function getClientIp(headers: Headers): string {
  // x-forwarded-for is set by reverse proxies and Vercel
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // May be comma-separated list: "client, proxy1, proxy2" — take first
    return forwarded.split(',')[0].trim()
  }

  // Fallback for local dev (no proxy)
  return 'dev'
}
