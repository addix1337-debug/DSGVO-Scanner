/**
 * /report/[host] – Public scan report for a domain.
 *
 * Server Component. Reads via service_role (server-only) + WHERE public=true.
 * ISR: revalidate every 5 minutes. Returns 404 if no public scan exists.
 * No client state — all report sub-components handle their own interactivity.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, RefreshCw, Shield, ExternalLink } from 'lucide-react'
import { seoMeta } from '@/lib/seoMeta'
import { getServerSupabase } from '@/lib/supabase'
import type { ScanResult } from '@dsgvo/db'
import { SummaryHero } from '@/components/report/SummaryHero'
import { FindingsAccordion } from '@/components/report/FindingsAccordion'
import { DomainsChips } from '@/components/report/DomainsChips'
import { CookiesTable } from '@/components/report/CookiesTable'
import { cn } from '@/lib/utils'

// ISR: cache page for 5 minutes, then revalidate in background
export const revalidate = 300

// ─────────────────────────────────────────────────────────────────────────────
// Host normalisation + validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a raw URL segment to a safe lowercase hostname.
 * Returns null if the input looks like anything other than a plain hostname.
 */
function normalizeHost(raw: string): string | null {
  try {
    // Decode percent-encoding (%2F etc.)
    const decoded = decodeURIComponent(raw).trim().toLowerCase()

    // Must not contain a slash (path), question mark (query), or @ (credentials)
    if (/[/?@#]/.test(decoded)) return null

    // Strip optional www. prefix
    const host = decoded.replace(/^www\./, '')

    // Allow only safe characters: letters, digits, hyphens, dots
    if (!/^[a-z0-9.-]+$/.test(host)) return null

    // Must look like a domain (at least one dot, e.g. "example.com")
    if (!host.includes('.')) return null

    // Must not start or end with a dot or hyphen
    if (/^[.-]|[.-]$/.test(host)) return null

    // Reasonable DNS length limit
    if (host.length > 253) return null

    return host
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DB helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PublicScanRow {
  id: string
  url: string
  created_at: string
  result: ScanResult
}

/**
 * Returns the most recent public+done scan for the given normalised hostname,
 * or null if none exists.
 *
 * Uses service_role (server-only). The WHERE public=true filter is both an
 * application-level guard and redundant with the RLS policy added in
 * migration 004_public_reports.sql.
 */
async function getPublicScan(host: string): Promise<PublicScanRow | null> {
  const supabase = getServerSupabase()

  // Match any URL whose host part equals `host` or `www.${host}`.
  // host is already validated to [a-z0-9.-] so no injection risk.
  const { data, error } = await supabase
    .from('scans')
    .select('id, url, created_at, result')
    .eq('public', true)
    .eq('status', 'done')
    .or(`url.ilike.%://${host}%,url.ilike.%://www.${host}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[report/[host]] Supabase error:', error.message)
    return null
  }

  if (!data || !data.result) return null

  return data as unknown as PublicScanRow
}

// ─────────────────────────────────────────────────────────────────────────────
// generateMetadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { host: string }
}): Promise<Metadata> {
  const host = normalizeHost(params.host)
  if (!host) return {}

  return seoMeta(
    `/report/${host}`,
    `DSGVO-Check für ${host} – Report & Risiken`,
    `Technischer DSGVO-Check für ${host}: Erkannte externe Dienste, Tracking-Indikatoren und Cookies. Kein Konto nötig.`,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function PublicReportPage({
  params,
}: {
  params: { host: string }
}) {
  const host = normalizeHost(params.host)
  if (!host) notFound()

  const scan = await getPublicScan(host!)
  if (!scan) notFound()

  // Normalise all JSONB fields defensively (DB might have partial data)
  const result: ScanResult = {
    googleFontsUsed:          scan.result.googleFontsUsed          ?? false,
    googleAnalyticsDetected:  scan.result.googleAnalyticsDetected  ?? false,
    facebookPixelDetected:    scan.result.facebookPixelDetected     ?? false,
    trackingCookiesSet:       scan.result.trackingCookiesSet        ?? false,
    hasImprint:               scan.result.hasImprint                ?? false,
    hasPrivacyPolicy:         scan.result.hasPrivacyPolicy          ?? false,
    externalDomains:          scan.result.externalDomains           ?? [],
    cookies:                  scan.result.cookies                   ?? [],
    meta:                     scan.result.meta                      ?? ({} as ScanResult['meta']),
  }

  const scannedAt = new Date(scan.created_at).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="pb-5 border-b border-zinc-200 space-y-1">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">
          Öffentlicher Report
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          DSGVO-Check für{' '}
          <a
            href={`https://${host}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500 transition-colors"
          >
            {host}
            <ExternalLink className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          </a>
        </h1>
        <p className="text-sm text-zinc-500">
          Letzter Scan: {scannedAt} &middot; Technischer Check, keine Rechtsberatung
        </p>
      </div>

      {/* ── 2-column layout (matches /scan/[id]) ──────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-5 items-start">

        {/* Left col: Summary + CTAs (sticky on desktop) */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
          <SummaryHero result={result} />

          {/* Primary CTA: scan own site */}
          <a
            href="/scan"
            className={cn(
              'flex items-center gap-3 w-full rounded-2xl border border-zinc-200 bg-white',
              'px-4 py-4 shadow-card hover:shadow-card-md hover:border-zinc-300',
              'transition-all duration-150 group',
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-700 transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 leading-tight">
                Eigene Website prüfen
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Kostenlos · ~15 Sekunden
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 flex-shrink-0 group-hover:text-zinc-700 transition-colors" />
          </a>
        </div>

        {/* Right col: Findings */}
        <div className="lg:col-span-3">
          <SectionHeader title="Risiken & Fixes" />
          <FindingsAccordion result={result} />
        </div>
      </div>

      {/* ── Full-width sections ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="Externe Dienste" count={result.externalDomains.length} />
        <DomainsChips domains={result.externalDomains} />
      </div>

      <div className="space-y-3">
        <SectionHeader title="Cookies" count={result.cookies.length} />
        <CookiesTable cookies={result.cookies} />
      </div>

      {/* ── Scan meta ─────────────────────────────────────────────────────── */}
      {result.meta?.scanDurationMs && (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-zinc-500 shadow-card">
          {result.meta.httpStatus && (
            <span>HTTP <span className="font-semibold text-zinc-700">{result.meta.httpStatus}</span></span>
          )}
          <span>Requests <span className="font-semibold text-zinc-700">{result.meta.requestsCount}</span></span>
          <span>Dauer <span className="font-semibold text-zinc-700">{(result.meta.scanDurationMs / 1000).toFixed(1)}s</span></span>
        </div>
      )}

      {/* ── Mehr zum Thema ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionHeader title="Mehr zum Thema" />
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/google-fonts-dsgvo',     label: 'Google Fonts & DSGVO' },
            { href: '/google-analytics-dsgvo', label: 'Google Analytics & DSGVO' },
            { href: '/facebook-pixel-dsgvo',   label: 'Facebook Pixel & DSGVO' },
            { href: '/tracking-cookies-dsgvo', label: 'Tracking-Cookies' },
            { href: '/dsgvo-website-check',    label: 'Website-Check erklärt' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white',
                'px-3.5 py-2 text-xs font-semibold text-zinc-600 shadow-card',
                'hover:border-zinc-400 hover:text-zinc-900 transition-all duration-150',
              )}
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>

      {/* ── Neuen Scan starten ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-900 px-6 py-8 text-center shadow-card-lg">
        <p className="text-base font-black text-white tracking-tight mb-1">
          Eigene Website prüfen?
        </p>
        <p className="text-sm text-white/55 mb-5">
          Kostenloser DSGVO-Scan in ~15 Sekunden — kein Konto nötig.
        </p>
        <a
          href="/scan"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold',
            'bg-white text-zinc-900 shadow-sm',
            'hover:bg-zinc-100 active:scale-[0.97] transition-all duration-150',
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Neuen Scan starten
        </a>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <p className="text-xs text-zinc-400 text-center flex items-center justify-center gap-1.5 pb-6">
        <Shield className="h-3 w-3 flex-shrink-0" />
        Technischer Check. Keine Rechtsberatung. Ergebnisse sind Hinweise, keine rechtliche Bewertung.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared section header (matches /scan/[id] style)
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em] whitespace-nowrap">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5 leading-none">
          {count}
        </span>
      )}
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  )
}
