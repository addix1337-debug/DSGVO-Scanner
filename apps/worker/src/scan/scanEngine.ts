import { chromium } from 'playwright'
import dns from 'dns/promises'
import type { ScanResult, ScanErrorCode } from '@dsgvo/db'

// ---------------------------------------------------------------------------
// ScanError — typed error with machine-readable code
// ---------------------------------------------------------------------------

export class ScanError extends Error {
  constructor(
    public readonly code: ScanErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ScanError'
  }
}

/** Format for storage in scans.error_message — parsed by web UI */
export function formatScanError(code: ScanErrorCode, message: string): string {
  return `${code}: ${message}`
}

// ---------------------------------------------------------------------------
// SSRF / Private-IP Protection
// ---------------------------------------------------------------------------

function isPrivateIp(ip: string): boolean {
  const ipv4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 0) return true
    if (a === 100 && b >= 64 && b <= 127) return true
  }
  if (ip === '::1') return true
  if (ip.toLowerCase().startsWith('fc00:')) return true
  if (ip.toLowerCase().startsWith('fe80:')) return true
  return false
}

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') return true
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true
  if (hostname.endsWith('.localhost')) return true

  const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) return isPrivateIp(hostname)

  return false
}

function isIpLiteral(hostname: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true
  if (hostname.startsWith('[') || hostname.includes(':')) return true
  return false
}

function normalizeUrl(raw: string): URL {
  const str = raw.trim()
  const withProto =
    str.startsWith('http://') || str.startsWith('https://') ? str : `https://${str}`

  let url: URL
  try {
    url = new URL(withProto)
  } catch {
    throw new ScanError('blocked_url', `Ungültige URL: "${raw}"`)
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ScanError('blocked_url', `Protokoll nicht erlaubt: ${url.protocol}`)
  }

  if (url.username || url.password) {
    throw new ScanError('blocked_url', 'URLs mit eingebetteten Zugangsdaten sind nicht erlaubt')
  }

  if (isIpLiteral(url.hostname)) {
    throw new ScanError('blocked_url', `Direkte IP-Adressen sind nicht erlaubt: ${url.hostname}`)
  }

  if (isPrivateHost(url.hostname)) {
    throw new ScanError('blocked_url', `Private/lokale Adresse blockiert: "${url.hostname}"`)
  }

  return url
}

// ---------------------------------------------------------------------------
// DNS Rebind Check (second layer after URL validation)
// ---------------------------------------------------------------------------

async function checkDns(hostname: string): Promise<void> {
  const ips: string[] = []

  await Promise.allSettled([
    dns.resolve4(hostname).then((addrs) => ips.push(...addrs)),
    dns.resolve6(hostname).then((addrs) => ips.push(...addrs)),
  ])

  if (ips.length === 0) {
    throw new ScanError('dns_failed', `DNS-Auflösung fehlgeschlagen: Keine Einträge für "${hostname}"`)
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      throw new ScanError(
        'blocked_url',
        `DNS-Rebind blockiert: "${hostname}" löst auf private IP auf (${ip})`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

function extractHostname(urlStr: string): string | null {
  try {
    return new URL(urlStr).hostname
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Scan Engine
// ---------------------------------------------------------------------------

export async function runScan(rawUrl: string): Promise<ScanResult> {
  const startedAt = Date.now()
  const targetUrl = normalizeUrl(rawUrl)
  const targetHost = targetUrl.hostname

  // DNS rebind check before opening browser
  await checkDns(targetHost)

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 DSGVO-Scanner/1.0',
      locale: 'de-DE',
    })

    // Timeouts
    context.setDefaultNavigationTimeout(45_000)
    context.setDefaultTimeout(10_000)

    const page = await context.newPage()

    // Block large media resources (video/audio) — they add no value for
    // tracker detection but consume significant bandwidth and time.
    // Scripts, CSS, images, fonts are ALLOWED so tracker detection works.
    await context.route('**/*', (route) => {
      if (route.request().resourceType() === 'media') {
        route.abort()
      } else {
        route.continue()
      }
    })

    // Collect all outgoing request URLs
    const requestUrls: string[] = []
    page.on('request', (req) => {
      requestUrls.push(req.url())
    })

    // Navigate
    let httpStatus: number | null = null
    try {
      const response = await page.goto(targetUrl.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      })
      httpStatus = response?.status() ?? null
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('timeout')) {
        throw new ScanError('navigation_timeout', `Seite hat nicht rechtzeitig geantwortet: ${msg}`)
      }
      if (msg.includes('net::ERR_NAME_NOT_RESOLVED') || msg.includes('ENOTFOUND')) {
        throw new ScanError('dns_failed', `Domain nicht erreichbar: ${msg}`)
      }
      throw new ScanError('playwright_failed', `Navigation fehlgeschlagen: ${msg}`)
    }

    // Post-redirect validation — check if we landed on a private address
    const finalUrl = page.url()
    try {
      const finalParsed = new URL(finalUrl)
      if (isPrivateHost(finalParsed.hostname) || isIpLiteral(finalParsed.hostname)) {
        throw new ScanError('blocked_url', `Redirect zu blockierter Adresse: ${finalUrl}`)
      }
    } catch (err) {
      if (err instanceof ScanError) throw err
      // URL parse error on finalUrl — ignore
    }

    // Wait for lazy-loaded trackers
    await page.waitForTimeout(15_000)

    // Cookies
    const rawCookies = await context.cookies()
    const cookies = rawCookies.map((c) => ({
      name: c.name,
      domain: c.domain,
      value: c.value,
    }))

    // HTML analysis
    const html = await page.content()
    const lowerHtml = html.toLowerCase()

    const hasImprint =
      lowerHtml.includes('>impressum<') ||
      lowerHtml.includes('href="/impressum') ||
      lowerHtml.includes('href="./impressum') ||
      />\s*impressum\s*</.test(lowerHtml)

    const hasPrivacyPolicy =
      lowerHtml.includes('>datenschutz<') ||
      lowerHtml.includes('href="/datenschutz') ||
      lowerHtml.includes('href="./datenschutz') ||
      lowerHtml.includes('datenschutzerklärung') ||
      lowerHtml.includes('datenschutzerkl&auml;rung') ||
      />\s*datenschutz\s*</.test(lowerHtml)

    // External domains
    const externalDomains = [
      ...new Set(
        requestUrls
          .map(extractHostname)
          .filter(
            (h): h is string =>
              h !== null &&
              h !== '' &&
              h !== targetHost &&
              h.replace(/^www\./, '') !== targetHost.replace(/^www\./, '')
          )
      ),
    ].sort()

    // Detection flags
    const urlBlob = requestUrls.join('\n')

    const googleFontsUsed =
      urlBlob.includes('fonts.googleapis.com') || urlBlob.includes('fonts.gstatic.com')

    const googleAnalyticsDetected =
      urlBlob.includes('googletagmanager.com') ||
      urlBlob.includes('google-analytics.com') ||
      urlBlob.includes('gtag/js')

    const facebookPixelDetected =
      urlBlob.includes('connect.facebook.net') || urlBlob.includes('fbevents.js')

    const TRACKING_PREFIXES = ['_ga', '_gid', '_fbp', '_fbc']
    const trackingCookiesSet = cookies.some((c) =>
      TRACKING_PREFIXES.some((p) => c.name.startsWith(p))
    )

    const scanDurationMs = Date.now() - startedAt

    return {
      googleFontsUsed,
      googleAnalyticsDetected,
      facebookPixelDetected,
      trackingCookiesSet,
      hasImprint,
      hasPrivacyPolicy,
      externalDomains,
      cookies,
      meta: {
        finalUrl,
        httpStatus,
        scanDurationMs,
        requestsCount: requestUrls.length,
        externalDomainsCount: externalDomains.length,
        cookiesCount: cookies.length,
      },
    }
  } finally {
    // Always close — even on ScanError, timeout, or any other throw
    await browser.close()
  }
}
