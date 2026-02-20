import 'dotenv/config'
import Fastify from 'fastify'
import { getScanById, markScanRunning, markScanDone, markScanError } from './db/scansRepo'
import { runScan, ScanError, formatScanError } from './scan/scanEngine'
import type { ScanErrorCode } from '@dsgvo/db'

const SCAN_TIMEOUT_MS = 70_000

const app = Fastify({ logger: true })

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/health', async () => {
  return { status: 'ok', service: 'dsgvo-worker' }
})

app.post<{ Body: { scanId?: string } }>('/run', async (request, reply) => {
  const { scanId } = request.body ?? {}

  if (!scanId || typeof scanId !== 'string') {
    return reply.code(400).send({ error: 'scanId (string) ist erforderlich' })
  }

  // Fire-and-forget: respond immediately, run scan in background
  runScanJob(scanId).catch((err: unknown) => {
    app.log.error({ scanId, err }, 'Unbehandelter Fehler im Scan-Job')
  })

  return { ok: true, scanId }
})

// ---------------------------------------------------------------------------
// Scan Job
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new ScanError('navigation_timeout', `Gesamt-Timeout von ${ms / 1000}s überschritten`)),
        ms
      )
    ),
  ])
}

/** Classify generic errors that aren't already ScanErrors */
function classifyError(err: unknown): { code: ScanErrorCode; message: string } {
  if (err instanceof ScanError) {
    return { code: err.code, message: err.message }
  }

  const msg = err instanceof Error ? err.message : String(err)

  if (msg.toLowerCase().includes('timeout')) {
    return { code: 'navigation_timeout', message: msg }
  }
  if (
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    msg.toLowerCase().includes('dns')
  ) {
    return { code: 'dns_failed', message: msg }
  }
  if (msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('blockiert')) {
    return { code: 'blocked_url', message: msg }
  }

  return { code: 'unknown', message: msg }
}

async function runScanJob(scanId: string): Promise<void> {
  // 1. Load scan record
  let scan: Awaited<ReturnType<typeof getScanById>>
  try {
    scan = await getScanById(scanId)
  } catch (err) {
    app.log.error({ scanId, err }, 'Scan-Datensatz konnte nicht geladen werden')
    return
  }

  // 2. Mark as running
  try {
    await markScanRunning(scanId)
  } catch (err) {
    app.log.error({ scanId, err }, 'markScanRunning fehlgeschlagen')
    return
  }

  app.log.info({ scanId, url: scan.url }, 'Scan gestartet')
  const jobStart = Date.now()

  // 3. Run with overall timeout
  try {
    const result = await withTimeout(runScan(scan.url), SCAN_TIMEOUT_MS)

    await markScanDone(scanId, result)

    app.log.info(
      {
        scanId,
        durationMs: Date.now() - jobStart,
        googleFontsUsed: result.googleFontsUsed,
        googleAnalyticsDetected: result.googleAnalyticsDetected,
        facebookPixelDetected: result.facebookPixelDetected,
        trackingCookiesSet: result.trackingCookiesSet,
        externalDomains: result.externalDomains.length,
        cookies: result.cookies.length,
      },
      'Scan erfolgreich abgeschlossen'
    )
  } catch (err) {
    const { code, message } = classifyError(err)
    const stored = formatScanError(code, message)

    app.log.error({ scanId, code, message, durationMs: Date.now() - jobStart }, 'Scan fehlgeschlagen')
    await markScanError(scanId, stored)
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
