// ---------------------------------------------------------------------------
// Shared URL validation — used in both client components and server API routes.
// The worker has its own equivalent layer (defense in depth).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Private-host detection (hostname strings)
// ---------------------------------------------------------------------------

function isPrivateHost(hostname: string): boolean {
  const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return true                          // 10.0.0.0/8
    if (a === 127) return true                         // 127.0.0.0/8 (loopback)
    if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
    if (a === 192 && b === 168) return true             // 192.168.0.0/16
    if (a === 169 && b === 254) return true             // 169.254.0.0/16 (link-local)
    if (a === 0) return true
    if (a === 100 && b >= 64 && b <= 127) return true  // 100.64.0.0/10 (shared)
  }

  if (hostname === '::1') return true
  if (hostname.toLowerCase().startsWith('fc00:')) return true
  if (hostname.toLowerCase().startsWith('fe80:')) return true
  if (hostname === 'localhost' || hostname === '0.0.0.0') return true
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true
  if (hostname.endsWith('.localhost')) return true

  return false
}

// ---------------------------------------------------------------------------
// IP literal detection
//
// Decision: ALL direct IP addresses are blocked, not just private ones.
// Reasoning:
//   - Legitimate public websites use domain names, not bare IPs.
//   - Public IP literals could target cloud-metadata endpoints (169.254.169.254)
//     which are reachable even from public networks inside VMs.
//   - Simplifies security reasoning: one rule, no exceptions.
// ---------------------------------------------------------------------------

function isIpLiteral(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true
  // IPv6 (bracketed form: [::1], [2001:db8::1])
  if (hostname.startsWith('[')) return true
  // Bare IPv6 without brackets (rare in URLs but possible)
  if (hostname.includes(':')) return true
  return false
}

// ---------------------------------------------------------------------------
// Allowed ports
//
// Only 80 and 443 are allowed by default.
// Set ALLOW_DEV_PORTS=true in .env.local to also allow 8080 and 8443.
// This env var is server-side only (no NEXT_PUBLIC_ prefix).
// ---------------------------------------------------------------------------

function isPortAllowed(port: string, protocol: string): boolean {
  if (!port) return true // default port for the protocol — always OK

  const n = parseInt(port, 10)
  if (n === 80 || n === 443) return true

  const isDefaultPort =
    (protocol === 'http:' && n === 80) || (protocol === 'https:' && n === 443)
  if (isDefaultPort) return true

  if (typeof process !== 'undefined' && process.env?.ALLOW_DEV_PORTS === 'true') {
    if (n === 8080 || n === 8443) return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ValidateResult = { ok: true; url: URL } | { ok: false; error: string }

export function validateUrl(raw: string): ValidateResult {
  const str = raw.trim()
  if (!str) return { ok: false, error: 'Bitte eine URL eingeben' }

  const withProto =
    str.startsWith('http://') || str.startsWith('https://') ? str : `https://${str}`

  let url: URL
  try {
    url = new URL(withProto)
  } catch {
    return { ok: false, error: `Ungültige URL: "${raw}"` }
  }

  // Protocol
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Nur HTTP und HTTPS sind erlaubt' }
  }

  // Embedded credentials (user:pass@host)
  if (url.username || url.password) {
    return {
      ok: false,
      error: 'URLs mit eingebetteten Zugangsdaten (user:pass@host) sind nicht erlaubt',
    }
  }

  // Port
  if (!isPortAllowed(url.port, url.protocol)) {
    return {
      ok: false,
      error: `Port ${url.port} ist nicht erlaubt. Erlaubt: 80, 443${
        typeof process !== 'undefined' && process.env?.ALLOW_DEV_PORTS === 'true'
          ? ', 8080, 8443'
          : ''
      }.`,
    }
  }

  // IP literals (all blocked — see decision above)
  if (isIpLiteral(url.hostname)) {
    return {
      ok: false,
      error:
        'Direkte IP-Adressen sind nicht erlaubt. Bitte einen Domainnamen eingeben (z.B. example.com).',
    }
  }

  // Private/local hostnames
  if (isPrivateHost(url.hostname)) {
    return { ok: false, error: 'Lokale und private Adressen werden nicht gescannt' }
  }

  return { ok: true, url }
}
