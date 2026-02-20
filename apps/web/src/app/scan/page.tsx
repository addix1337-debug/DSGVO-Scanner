'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateUrl } from '@/lib/validateUrl'
import { Check, Shield, Zap, FileText, Loader2, ArrowRight, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Steps ─────────────────────────────────────────────────── */
const STEPS = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'URL eingeben',
    desc: 'Einfach die Domain eintragen – kein Konto nötig.',
    num: '01',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Scan läuft (~15 s)',
    desc: 'Browser lädt die Seite, beobachtet alle Netzwerk-Verbindungen.',
    num: '02',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: 'Ergebnis + Fixes',
    desc: 'Ampel-Status, erkannte Dienste, konkrete Handlungsoptionen.',
    num: '03',
  },
]

/* ── Erkennungs-Chips ───────────────────────────────────────── */
const DETECTION_CHIPS = [
  { label: 'Google Analytics / GTM',  cn: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Facebook / Meta Pixel',   cn: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Google Fonts',            cn: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Externe Domains',         cn: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  { label: 'Tracking-Cookies',        cn: 'bg-red-100 text-red-700 border-red-200' },
]

/* ── Ratgeber-Links ──────────────────────────────────────────── */
const GUIDES = [
  {
    href: '/google-fonts-dsgvo',
    label: 'Google Fonts DSGVO: Risiko & Lösung',
    desc: 'IP-Übertragung erkennen und Fonts lokal hosten.',
  },
  {
    href: '/google-analytics-dsgvo',
    label: 'Google Analytics DSGVO: Setup & Alternativen',
    desc: 'Was übertragen wird und datenschutzfreundliche Alternativen.',
  },
  {
    href: '/facebook-pixel-dsgvo',
    label: 'Facebook/Meta Pixel DSGVO: prüfen & deaktivieren',
    desc: 'Pixel technisch erkennen und Consent korrekt einbinden.',
  },
  {
    href: '/tracking-cookies-dsgvo',
    label: 'Tracking Cookies DSGVO: Consent & Prüfung',
    desc: 'Welche Cookies gesetzt werden und was einwilligungspflichtig ist.',
  },
  {
    href: '/dsgvo-website-check',
    label: 'DSGVO Website Check: kompletter Leitfaden',
    desc: 'Überblick über alle externen Dienste und Tracking-Indikatoren.',
  },
]

/* ── Trust items ─────────────────────────────────────────────── */
const TRUST = [
  'Keine Installation',
  'Keine Registrierung',
  'Kein Tracking durch uns',
  'Technischer Hinweis',
]

export default function ScanPage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const clientCheck = validateUrl(url)
    if (!clientCheck.ok) {
      setError(clientCheck.error)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unbekannter Fehler')
        return
      }
      router.push(`/scan/${data.scanId}`)
    } catch {
      setError('Netzwerkfehler — bitte erneut versuchen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem-2px)]">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #c4c4cc 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.45,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F2F2F5] via-[#F2F2F5]/55 to-[#F2F2F5] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F2F2F5] via-transparent to-[#F2F2F5] pointer-events-none" />

        <div className="w-full max-w-2xl text-center space-y-8 relative">

          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm">
              <Lock className="h-3 w-3 text-zinc-400" />
              Technischer Check &middot; keine Rechtsberatung
            </span>
          </div>

          {/* Headline — Problem → Lösung */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 tracking-tighter leading-[1.03] text-balance">
              Welche externen Dienste lädt deine Website?
            </h1>
            <p className="text-lg sm:text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed">
              Wir erkennen externe Tracker, Fonts, Cookies und Drittanbieter-Verbindungen —{' '}
              <span className="text-zinc-800 font-semibold">in ~15 Sekunden.</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 max-w-xl mx-auto">
            <div
              className={cn(
                'flex gap-2 p-1.5 bg-white rounded-2xl border shadow-card-md transition-all duration-200',
                error
                  ? 'border-red-300'
                  : 'border-zinc-300 focus-within:border-zinc-500 focus-within:shadow-card-lg'
              )}
            >
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                placeholder="https://example.com"
                disabled={loading}
                autoFocus
                className="flex-1 min-w-0 bg-transparent px-3.5 py-3 text-base text-zinc-900 placeholder:text-zinc-400 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-150',
                  'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-[0.97]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'whitespace-nowrap shadow-sm'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starte…
                  </>
                ) : (
                  <>
                    Kostenlos prüfen
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {/* Helper line */}
            {!error && (
              <p className="text-xs text-zinc-400 text-center">
                Kein Konto. Keine Installation. Ergebnis sofort.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 text-left px-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </p>
            )}

            {/* Example report links */}
            <div className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 space-y-1.5 text-center shadow-card">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.18em]">
                Beispiel-DSGVO-Reports
              </p>
              <p className="text-xs text-zinc-500">
                Echte Prüfergebnisse von bekannten Websites:
              </p>
              <ul className="flex flex-col items-center gap-1 pt-0.5">
                {[
                  { href: '/report/welt.de',    label: 'DSGVO-Check für welt.de ansehen' },
                  { href: '/report/spiegel.de', label: 'DSGVO-Check für spiegel.de ansehen' },
                  { href: '/report/zeit.de',    label: 'DSGVO-Check für zeit.de ansehen' },
                ].map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700 transition-colors"
                    >
                      {r.label}
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </form>

          {/* Trust row */}
          <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
            {TRUST.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                {item}
              </span>
            ))}
          </div>

          {/* Mini indicators – no fake numbers */}
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Beta – kostenloser Check
            </span>
            <span className="text-zinc-200">·</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
              Ergebnisse in Sekunden
            </span>
          </div>
        </div>
      </section>

      {/* ── Was wird erkannt? ─────────────────────────────────── */}
      <section className="bg-white border-t border-zinc-200 px-4 py-10">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Was wird erkannt?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DETECTION_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  'inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold',
                  chip.cn
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Alle Erkennungen basieren auf technischer Netzwerkanalyse —
            keine rechtliche Bewertung.
          </p>
          <p className="text-xs text-zinc-400">
            Beispiel:{' '}
            <a
              href="/report/welt.de"
              className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-600 transition-colors"
            >
              welt.de Report ansehen
            </a>
          </p>
        </div>
      </section>

      {/* ── Ratgeber: DSGVO & Tracking ───────────────────────── */}
      <section className="bg-white border-t border-zinc-100 px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              Ratgeber: DSGVO &amp; Tracking
            </p>
            <p className="text-xs text-zinc-500">
              Anleitungen zu den häufigsten Tracking-Themen:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GUIDES.map((g) => (
              <a
                key={g.href}
                href={g.href}
                className={cn(
                  'group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3',
                  'shadow-card hover:border-zinc-300 hover:shadow-card-md transition-all duration-150',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 group-hover:text-zinc-900 leading-snug">
                    {g.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{g.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0 mt-0.5 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ─────────────────────────────────── */}
      <section className="bg-white border-t border-zinc-100 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-[0.2em] mb-10">
            So funktioniert&apos;s
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 items-start sm:flex-col sm:items-center sm:text-center group"
              >
                <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm group-hover:bg-zinc-700 transition-colors duration-150">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 sm:justify-center">
                    <span className="text-[10px] font-bold text-zinc-300 font-mono">{step.num}</span>
                    <h3 className="font-semibold text-zinc-900 text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-5 text-center border-t border-zinc-100">
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <Shield className="h-3 w-3" />
          Technischer Check. Keine Rechtsberatung. Ergebnisse sind Hinweise, keine rechtliche Bewertung.
        </p>
      </footer>
    </div>
  )
}
