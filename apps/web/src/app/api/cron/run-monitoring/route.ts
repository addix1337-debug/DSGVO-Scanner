/**
 * GET /api/cron/run-monitoring
 *
 * Processes monitored sites that are due for a re-check (last_checked_at > 24h ago).
 * Protected by Bearer token (MONITOR_CRON_SECRET).
 *
 * Call with:
 *   curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/run-monitoring
 *
 * For Vercel Cron: add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/run-monitoring", "schedule": "0 8 * * *" }] }
 *   Vercel automatically passes CRON_SECRET as Authorization header.
 *
 * Limitations (MVP):
 *   - Processes max 5 sites per run to prevent handler timeouts
 *   - Each site scan is awaited (sequential polling) — suitable for local/VPS,
 *     not ideal for large-scale (use a job queue then)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { diffScans } from '@/lib/diff'
import { sendAlertEmail } from '@/lib/email'
import type { ScanResult, MonitoredSite } from '@dsgvo/db'

const MAX_SITES_PER_RUN = 5
const SCAN_POLL_TIMEOUT_MS = 90_000
const SCAN_POLL_INTERVAL_MS = 2_000
const WINDOW_24H_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.MONITOR_CRON_SECRET
  if (!secret) {
    // If no secret is configured, only allow in development
    return process.env.NODE_ENV !== 'production'
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// ---------------------------------------------------------------------------
// Poll Supabase until scan is terminal or timeout
// ---------------------------------------------------------------------------

async function waitForScan(
  scanId: string,
  timeoutMs: number
): Promise<{ id: string; status: string; result: ScanResult | null } | null> {
  const supabase = getServerSupabase()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('scans')
      .select('id, status, result')
      .eq('id', scanId)
      .single()

    if (data) {
      const row = data as { id: string; status: string; result: ScanResult | null }
      if (row.status === 'done' || row.status === 'error') return row
    }

    await new Promise((r) => setTimeout(r, SCAN_POLL_INTERVAL_MS))
  }

  return null // timed out
}

// ---------------------------------------------------------------------------
// Process one site
// ---------------------------------------------------------------------------

async function processSite(
  site: MonitoredSite
): Promise<{ status: 'ok' | 'error' | 'timeout'; detail?: string }> {
  const supabase = getServerSupabase()

  // 1. Create new queued scan
  const { data: newScanData, error: insertErr } = await supabase
    .from('scans')
    .insert({ url: site.url, status: 'queued' })
    .select('id')
    .single()

  if (insertErr || !newScanData) {
    return { status: 'error', detail: `Insert failed: ${insertErr?.message}` }
  }

  const newScanId = (newScanData as { id: string }).id

  // 2. Trigger worker (fire-and-forget from worker's perspective)
  const workerUrl = process.env.WORKER_URL ?? 'http://localhost:3001'
  try {
    await fetch(`${workerUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanId: newScanId }),
      signal: AbortSignal.timeout(5_000),
    })
  } catch (err) {
    console.error(`[cron] Worker nicht erreichbar für scanId=${newScanId}:`, err)
    return { status: 'error', detail: 'Worker not reachable' }
  }

  // 3. Always update last_checked_at (even if scan fails)
  await supabase
    .from('monitored_sites')
    .update({ last_checked_at: new Date().toISOString() })
    .eq('id', site.id)

  // 4. Wait for scan to complete
  const completed = await waitForScan(newScanId, SCAN_POLL_TIMEOUT_MS)

  if (!completed) {
    return { status: 'timeout', detail: `Scan ${newScanId} timed out after ${SCAN_POLL_TIMEOUT_MS / 1000}s` }
  }

  if (completed.status === 'error' || !completed.result) {
    return { status: 'error', detail: `Scan ended with status=${completed.status}` }
  }

  // 5. Update last_scan_id to new scan
  await supabase
    .from('monitored_sites')
    .update({ last_scan_id: newScanId })
    .eq('id', site.id)

  // 6. Load previous scan result for diff
  if (!site.last_scan_id) {
    // First successful scan — nothing to compare yet
    return { status: 'ok', detail: 'First scan — baseline set' }
  }

  const { data: prevData } = await supabase
    .from('scans')
    .select('result')
    .eq('id', site.last_scan_id)
    .single()

  if (!prevData) {
    return { status: 'ok', detail: 'Previous scan not found — baseline reset' }
  }

  const prevResult = (prevData as { result: ScanResult | null }).result
  if (!prevResult) {
    return { status: 'ok', detail: 'Previous scan had no result — baseline reset' }
  }

  // 7. Diff
  const diff = diffScans(prevResult, completed.result)

  if (!diff.hasChanges) {
    console.log(`[cron] No changes for ${site.url} (${site.email})`)
    return { status: 'ok', detail: 'No changes detected' }
  }

  // 8. Send alert email
  try {
    await sendAlertEmail({ to: site.email, url: site.url, scanId: newScanId, diff })
    console.log(`[cron] Alert sent to ${site.email} for ${site.url}`)
  } catch (err) {
    // Don't fail the whole job if email fails — log and continue
    console.error(`[cron] Email send failed for ${site.email}:`, err)
    return { status: 'error', detail: `Email failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  return { status: 'ok', detail: 'Alert sent' }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const threshold = new Date(Date.now() - WINDOW_24H_MS).toISOString()

  // Sites due for re-check: never checked OR last_checked_at > 24h ago
  const { data: sites, error: fetchErr } = await supabase
    .from('monitored_sites')
    .select('*')
    .or(`last_checked_at.is.null,last_checked_at.lt.${threshold}`)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(MAX_SITES_PER_RUN)

  if (fetchErr) {
    console.error('[cron] Failed to fetch monitored_sites:', fetchErr)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!sites?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Keine Sites fällig' })
  }

  console.log(`[cron] Processing ${sites.length} site(s)`)

  // Process sites sequentially to avoid hammering worker + Supabase in parallel
  const results: Array<{ url: string; email: string; status: string; detail?: string }> = []

  for (const site of sites as MonitoredSite[]) {
    const result = await processSite(site)
    results.push({ url: site.url, email: site.email, ...result })
    console.log(`[cron] ${site.url} → ${result.status}: ${result.detail ?? ''}`)
  }

  return NextResponse.json({ ok: true, processed: sites.length, results })
}
