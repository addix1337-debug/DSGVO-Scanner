import type { ScanResult } from '@dsgvo/db'

// ---------------------------------------------------------------------------
// Diff Detection
//
// Only reports things that got WORSE (new risks appearing).
// Improvements (tracker removed, imprint reappearing) are NOT alerted —
// no need to bother the user with good news.
// ---------------------------------------------------------------------------

export interface ScanDiff {
  hasChanges: boolean
  newExternalDomains: string[]
  newTrackingFlags: string[]   // human-readable flag names
  newCookies: string[]          // cookie names
}

export function diffScans(prev: ScanResult, next: ScanResult): ScanDiff {
  // New external domains (domains in next that weren't in prev)
  const prevDomains = new Set(prev.externalDomains)
  const newExternalDomains = next.externalDomains.filter((d) => !prevDomains.has(d))

  // New tracking flags (only flags that flipped false → true)
  const newTrackingFlags: string[] = []
  if (!prev.googleFontsUsed && next.googleFontsUsed) {
    newTrackingFlags.push('Google Fonts (externe Anfragen erkannt)')
  }
  if (!prev.googleAnalyticsDetected && next.googleAnalyticsDetected) {
    newTrackingFlags.push('Google Analytics / Tag Manager erkannt')
  }
  if (!prev.facebookPixelDetected && next.facebookPixelDetected) {
    newTrackingFlags.push('Facebook Pixel erkannt')
  }
  if (!prev.trackingCookiesSet && next.trackingCookiesSet) {
    newTrackingFlags.push('Tracking-Cookies werden gesetzt (_ga, _gid, _fbp)')
  }
  // Warn if legal pages disappeared
  if (prev.hasImprint && !next.hasImprint) {
    newTrackingFlags.push('Impressum nicht mehr auffindbar')
  }
  if (prev.hasPrivacyPolicy && !next.hasPrivacyPolicy) {
    newTrackingFlags.push('Datenschutzerklärung nicht mehr auffindbar')
  }

  // New cookies by name (cookies in next that weren't in prev)
  const prevCookieNames = new Set(prev.cookies.map((c) => c.name))
  const newCookies = next.cookies
    .filter((c) => !prevCookieNames.has(c.name))
    .map((c) => `${c.name} (${c.domain})`)

  const hasChanges =
    newExternalDomains.length > 0 || newTrackingFlags.length > 0 || newCookies.length > 0

  return { hasChanges, newExternalDomains, newTrackingFlags, newCookies }
}
