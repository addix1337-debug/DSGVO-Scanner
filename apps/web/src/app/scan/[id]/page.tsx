'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { ScanRow } from '@dsgvo/db'
import { parseErrorCode } from '@dsgvo/db'
import { ArrowRight, Shield } from 'lucide-react'
import { ReportHeader } from '@/components/report/ReportHeader'
import { SummaryHero } from '@/components/report/SummaryHero'
import { MonitorCard } from '@/components/report/MonitorCard'
import { FindingsAccordion } from '@/components/report/FindingsAccordion'
import { DomainsChips } from '@/components/report/DomainsChips'
import { CookiesTable } from '@/components/report/CookiesTable'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import type { ScanResult } from '@dsgvo/db'
import { cn } from '@/lib/utils'

type PollData = Pick<ScanRow, 'id' | 'status' | 'result' | 'error_message' | 'url'>

const POLL_INTERVAL_MS = 2_000
const TERMINAL = new Set(['done', 'error'])

const ERROR_MESSAGES: Record<string, string> = {
  blocked_url: 'Diese URL kann aus Sicherheitsgründen nicht geprüft werden.',
  navigation_timeout: 'Die Website hat zu lange zum Laden gebraucht. Bitte prüfen ob die Seite erreichbar ist.',
  dns_failed: 'Die Domain konnte nicht aufgelöst werden. Bitte die URL prüfen.',
  playwright_failed: 'Beim Scan ist ein Browser-Fehler aufgetreten. Bitte erneut versuchen.',
  unknown: 'Der Scan ist fehlgeschlagen. Bitte erneut versuchen.',
}

/** Thin section heading with label + optional count */
function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">{title}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5 leading-none">
            {count}
          </span>
        )}
        <div className="flex-1 h-px bg-zinc-200" />
      </div>
      {children}
    </div>
  )
}

function ErrorCard({ errorMessage }: { errorMessage: string | null }) {
  const [showDetails, setShowDetails] = useState(false)
  const { code, technical } = parseErrorCode(errorMessage)
  const friendly = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden shadow-card">
      {/* Top bar */}
      <div className="bg-red-100 border-b border-red-200 px-5 py-3 flex items-center gap-2">
        <span className="text-base leading-none">⚠️</span>
        <p className="font-bold text-red-800 text-sm">Scan fehlgeschlagen</p>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-red-700 leading-relaxed">{friendly}</p>

        {technical && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-red-400 hover:text-red-700 underline underline-offset-2 transition-colors"
            >
              {showDetails ? 'Details verbergen' : 'Technische Details anzeigen'}
            </button>
            {showDetails && (
              <pre className="mt-2 text-[11px] text-zinc-600 bg-white/70 rounded-lg border border-red-200 p-3 whitespace-pre-wrap break-all font-mono">
                [{code}] {technical}
              </pre>
            )}
          </div>
        )}

        <a
          href="/scan"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
        >
          Erneut versuchen
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}

export default function ScanResultPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PollData | null>(null)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${id}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          if (active) setFetchError((json as { error?: string }).error ?? `HTTP ${res.status}`)
          return
        }
        const json: PollData = await res.json()
        if (!active) return
        setData(json)
        if (!TERMINAL.has(json.status)) setTimeout(poll, POLL_INTERVAL_MS)
      } catch {
        if (active) setFetchError('Netzwerkfehler beim Abfragen des Scan-Status')
      }
    }
    poll()
    return () => { active = false }
  }, [id])

  const result: ScanResult | null = data?.result
    ? {
        googleFontsUsed: data.result.googleFontsUsed ?? false,
        googleAnalyticsDetected: data.result.googleAnalyticsDetected ?? false,
        facebookPixelDetected: data.result.facebookPixelDetected ?? false,
        trackingCookiesSet: data.result.trackingCookiesSet ?? false,
        hasImprint: data.result.hasImprint ?? false,
        hasPrivacyPolicy: data.result.hasPrivacyPolicy ?? false,
        externalDomains: data.result.externalDomains ?? [],
        cookies: data.result.cookies ?? [],
        meta: data.result.meta ?? (null as unknown as ScanResult['meta']),
      }
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      {/* Network / fetch error */}
      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
          Fehler: {fetchError}
        </div>
      )}

      {/* Header (shown once URL is known) */}
      {data && <ReportHeader url={data.url} status={data.status} />}

      {/* Loading states */}
      {!data && !fetchError && <ReportSkeleton status="queued" />}
      {data?.status === 'queued' && <ReportSkeleton status="queued" url={data.url} />}
      {data?.status === 'running' && <ReportSkeleton status="running" url={data.url} />}

      {/* Error state */}
      {data?.status === 'error' && <ErrorCard errorMessage={data.error_message} />}

      {/* Done — full report */}
      {data?.status === 'done' && result && (
        <div className="space-y-8">
          {/* ── Desktop 2-column layout ── */}
          <div className="grid lg:grid-cols-5 gap-5 items-start">
            {/* Left col (2/5): Summary + primary CTA — sticky on desktop */}
            <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
              <SummaryHero result={result} />
              <MonitorCard scanId={data.id} />
            </div>

            {/* Right col (3/5): Findings */}
            <div className="lg:col-span-3">
              <Section title="Risiken & Fixes">
                <FindingsAccordion result={result} />
              </Section>
            </div>
          </div>

          {/* ── Full-width sections ── */}
          <Section title="Externe Dienste" count={result.externalDomains.length}>
            <DomainsChips domains={result.externalDomains} />
          </Section>

          <Section title="Cookies" count={result.cookies.length}>
            <CookiesTable cookies={result.cookies} />
          </Section>

          {/* Scan meta strip */}
          {result.meta && (
            <div className={cn(
              'rounded-xl border border-zinc-200 bg-white px-4 py-3',
              'flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-zinc-500 shadow-card'
            )}>
              {result.meta.finalUrl && result.meta.finalUrl !== data.url && (
                <span>
                  Finale URL:{' '}
                  <span className="font-mono text-zinc-700">{result.meta.finalUrl}</span>
                </span>
              )}
              {result.meta.httpStatus && (
                <span>
                  HTTP Status:{' '}
                  <span className="font-semibold text-zinc-700">{result.meta.httpStatus}</span>
                </span>
              )}
              <span>
                Requests:{' '}
                <span className="font-semibold text-zinc-700">{result.meta.requestsCount}</span>
              </span>
              <span>
                Scan-Dauer:{' '}
                <span className="font-semibold text-zinc-700">
                  {(result.meta.scanDurationMs / 1000).toFixed(1)}s
                </span>
              </span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-zinc-400 text-center flex items-center justify-center gap-1.5 pb-6">
            <Shield className="h-3 w-3 flex-shrink-0" />
            Technischer Check. Keine Rechtsberatung. Ergebnisse sind Hinweise, keine rechtliche Bewertung.
          </p>
        </div>
      )}
    </div>
  )
}
