import { cn } from '@/lib/utils'
import { KpiGrid } from './KpiGrid'
import type { ScanResult } from '@dsgvo/db'

type Signal = 'red' | 'yellow' | 'green'

const SIGNAL_CONFIG: Record<
  Signal,
  {
    label: string
    topCn: string
    borderCn: string
    labelCn: string
    statsCn: string
    dividerCn: string
    iconText: string
  }
> = {
  red: {
    label: 'Hohes Risiko',
    topCn: 'bg-red-50',
    borderCn: 'border-red-200',
    labelCn: 'text-red-900',
    statsCn: 'text-red-500',
    dividerCn: 'border-red-100',
    iconText: '🔴',
  },
  yellow: {
    label: 'Hinweise gefunden',
    topCn: 'bg-amber-50',
    borderCn: 'border-amber-200',
    labelCn: 'text-amber-900',
    statsCn: 'text-amber-600',
    dividerCn: 'border-amber-100',
    iconText: '🟡',
  },
  green: {
    label: 'Keine Auffälligkeiten',
    topCn: 'bg-emerald-50',
    borderCn: 'border-emerald-200',
    labelCn: 'text-emerald-900',
    statsCn: 'text-emerald-600',
    dividerCn: 'border-emerald-100',
    iconText: '🟢',
  },
}

export function computeSignal(r: {
  googleFontsUsed: boolean
  googleAnalyticsDetected: boolean
  facebookPixelDetected: boolean
  trackingCookiesSet: boolean
  externalDomains: string[]
}): Signal {
  if (
    r.googleFontsUsed ||
    r.googleAnalyticsDetected ||
    r.facebookPixelDetected ||
    r.trackingCookiesSet
  )
    return 'red'
  if (r.externalDomains.length > 0) return 'yellow'
  return 'green'
}

/** Returns the top 1–2 most critical finding names for the red/yellow state */
function getTopFindings(result: ScanResult): string[] {
  const findings: string[] = []
  if (result.googleAnalyticsDetected) findings.push('Google Analytics / GTM')
  if (result.facebookPixelDetected)   findings.push('Facebook / Meta Pixel')
  if (result.googleFontsUsed)         findings.push('Google Fonts (extern)')
  if (result.trackingCookiesSet)      findings.push('Tracking-Cookies')
  return findings.slice(0, 2)
}

function countTracking(r: ScanResult): number {
  return [
    r.googleFontsUsed,
    r.googleAnalyticsDetected,
    r.facebookPixelDetected,
    r.trackingCookiesSet,
  ].filter(Boolean).length
}

interface SummaryHeroProps {
  result: ScanResult
}

export function SummaryHero({ result }: SummaryHeroProps) {
  const signal      = computeSignal(result)
  const cfg         = SIGNAL_CONFIG[signal]
  const domains     = result.externalDomains ?? []
  const cookies     = result.cookies ?? []
  const tracking    = countTracking(result)
  const topFindings = getTopFindings(result)

  return (
    <div className={cn('rounded-2xl border overflow-hidden shadow-card-md', cfg.borderCn)}>

      {/* ── Signal zone ── */}
      <div className={cn('px-5 py-6 sm:px-6', cfg.topCn)}>
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none flex-shrink-0 drop-shadow-sm" aria-hidden="true">
            {cfg.iconText}
          </span>
          <div className="min-w-0">
            <h2 className={cn('text-2xl sm:text-3xl font-black tracking-tight leading-none mb-2', cfg.labelCn)}>
              {cfg.label}
            </h2>
            {/* Compact one-liner with real numbers */}
            <p className={cn('text-xs font-semibold leading-snug', cfg.statsCn)}>
              Erkannt:&nbsp;
              <span className="font-bold">{domains.length}</span> externe Dienste
              &nbsp;·&nbsp;
              <span className="font-bold">{cookies.length}</span> Cookies
              &nbsp;·&nbsp;
              <span className="font-bold">{tracking}</span> Tracking-Indikatoren
            </p>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className={cn('bg-white px-5 pt-5 sm:px-6 border-t', cfg.dividerCn)}>
        <KpiGrid
          externalDomains={domains.length}
          cookies={cookies.length}
          trackingCount={tracking}
          scanDurationMs={result.meta?.scanDurationMs}
        />
      </div>

      {/* ── Contextual bottom zone ── */}
      <div className="bg-white px-5 pb-5 sm:px-6 pt-4 border-t border-zinc-100">
        {signal === 'green' ? (
          /* Green: no findings, but nudge towards monitoring */
          <p className="text-sm text-zinc-500 leading-relaxed">
            Aktuell keine bekannten Tracking-Indikatoren erkannt.{' '}
            <span className="text-zinc-700 font-medium">
              Trotzdem können Änderungen durch Plugin-Updates jederzeit entstehen.
            </span>
          </p>
        ) : topFindings.length > 0 ? (
          /* Red / Yellow: show top findings inline */
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Die wichtigsten Ursachen
            </p>
            <ul className="space-y-1">
              {topFindings.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Yellow with no specific tracker but external domains */
          <p className="text-sm text-zinc-500 leading-relaxed">
            Externe Verbindungen gefunden. Prüfe die Details unten.
          </p>
        )}
      </div>
    </div>
  )
}
