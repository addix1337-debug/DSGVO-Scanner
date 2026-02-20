import { NextRequest, NextResponse } from 'next/server'
import { validateUrl } from '@/lib/validateUrl'
import { getServerSupabase } from '@/lib/supabase'
import { checkDnsRebind } from '@/lib/ssrfGuard'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import type { ScanStatus } from '@dsgvo/db'

const IDEMPOTENCY_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers)

  // ---------------------------------------------------------------------------
  // 1. Rate limiting
  // ---------------------------------------------------------------------------
  const rl = checkRateLimit(clientIp)
  if (!rl.allowed) {
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000)

    const message =
      rl.reason === 'cooldown'
        ? `Bitte ${retryAfterSec} Sekunden warten bevor ein neuer Scan gestartet wird.`
        : `Zu viele Scans. Bitte in ${Math.ceil(retryAfterSec / 60)} Minuten erneut versuchen.`

    console.warn(`[rate-limit] IP=${clientIp} reason=${rl.reason} retryAfter=${retryAfterSec}s`)

    return NextResponse.json({ error: message }, {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
      },
    })
  }

  // ---------------------------------------------------------------------------
  // 2. Parse + validate URL
  // ---------------------------------------------------------------------------
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const rawUrl =
    body && typeof body === 'object' && 'url' in body ? (body as { url: unknown }).url : undefined

  if (typeof rawUrl !== 'string') {
    return NextResponse.json({ error: '"url" (string) ist erforderlich' }, { status: 400 })
  }

  const validated = validateUrl(rawUrl)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const normalizedUrl = validated.url.toString()

  // ---------------------------------------------------------------------------
  // 3. DNS rebind protection (server-side, async)
  // ---------------------------------------------------------------------------
  const dnsCheck = await checkDnsRebind(validated.url.hostname)
  if (!dnsCheck.safe) {
    const status = dnsCheck.code === 'dns_failed' ? 400 : 403
    return NextResponse.json({ error: dnsCheck.reason }, { status })
  }

  // ---------------------------------------------------------------------------
  // 4. Idempotency — reuse recent scan (same IP + URL within 2 min)
  // ---------------------------------------------------------------------------
  const supabase = getServerSupabase()
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString()

  const { data: existing } = await supabase
    .from('scans')
    .select('id, status')
    .eq('url', normalizedUrl)
    .eq('requester_ip', clientIp)
    .gt('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const row = existing as { id: string; status: string }
    return NextResponse.json({ scanId: row.id, reused: true }, { status: 200 })
  }

  // ---------------------------------------------------------------------------
  // 5. Create new scan record
  // ---------------------------------------------------------------------------
  const insertPayload: { url: string; status: ScanStatus; requester_ip: string } = {
    url: normalizedUrl,
    status: 'queued',
    requester_ip: clientIp,
  }

  const { data, error: dbError } = await supabase
    .from('scans')
    .insert(insertPayload)
    .select('id')
    .single()

  if (dbError || !data) {
    console.error('Supabase insert error:', dbError)
    return NextResponse.json({ error: 'Datenbankfehler beim Anlegen des Scans' }, { status: 500 })
  }

  const scanId = (data as { id: string }).id

  // ---------------------------------------------------------------------------
  // 6. Trigger worker
  // ---------------------------------------------------------------------------
  const workerUrl = process.env.WORKER_URL ?? 'http://localhost:3001'
  try {
    const workerRes = await fetch(`${workerUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanId }),
      signal: AbortSignal.timeout(5_000),
    })
    if (!workerRes.ok) {
      console.error(`[worker] HTTP ${workerRes.status} for scanId=${scanId}`)
    }
  } catch (err) {
    console.error(`[worker] Nicht erreichbar für scanId=${scanId}:`, err)
  }

  return NextResponse.json({ scanId }, { status: 201 })
}
