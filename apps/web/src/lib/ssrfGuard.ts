/**
 * Server-side SSRF DNS Rebind Protection
 *
 * Problem: A hostname like "evil.com" could initially pass validateUrl() because
 * it looks like a legitimate domain. But it might resolve to a private IP
 * (10.x.x.x, 127.x.x.x, etc.) — a classic DNS rebinding attack.
 *
 * Solution: Resolve ALL A/AAAA records for the hostname and reject if ANY
 * resolved IP is in a private/reserved range.
 *
 * This runs server-side only (in API routes). Never import in client components.
 */

import dns from 'dns/promises'

// Same ranges as validateUrl.ts — kept in sync manually (no shared dep to avoid
// bundler complications between server-only and client code).
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

async function resolveIps(hostname: string): Promise<string[]> {
  const ips: string[] = []

  await Promise.allSettled([
    dns.resolve4(hostname).then((addrs) => ips.push(...addrs)),
    dns.resolve6(hostname).then((addrs) => ips.push(...addrs)),
  ])

  return ips
}

export type DnsGuardResult =
  | { safe: true }
  | { safe: false; code: 'dns_failed' | 'blocked_url'; reason: string }

/**
 * Resolves hostname and checks all IPs against private ranges.
 * Times out after 5 seconds to not block the API route indefinitely.
 */
export async function checkDnsRebind(hostname: string): Promise<DnsGuardResult> {
  const DNS_TIMEOUT_MS = 5_000

  let ips: string[]

  try {
    ips = await Promise.race([
      resolveIps(hostname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS_TIMEOUT')), DNS_TIMEOUT_MS)
      ),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    if (msg === 'DNS_TIMEOUT') {
      return {
        safe: false,
        code: 'dns_failed',
        reason: `DNS-Timeout: Hostname "${hostname}" konnte nicht rechtzeitig aufgelöst werden`,
      }
    }

    return {
      safe: false,
      code: 'dns_failed',
      reason: `DNS-Fehler: Hostname "${hostname}" konnte nicht aufgelöst werden (${msg})`,
    }
  }

  if (ips.length === 0) {
    return {
      safe: false,
      code: 'dns_failed',
      reason: `DNS-Fehler: Keine IP-Adressen für "${hostname}" gefunden`,
    }
  }

  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      return {
        safe: false,
        code: 'blocked_url',
        reason: `Blockiert: "${hostname}" löst auf private IP-Adresse auf (${ip})`,
      }
    }
  }

  return { safe: true }
}
