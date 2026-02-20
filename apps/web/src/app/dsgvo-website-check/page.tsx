import type { Metadata } from 'next'
import { seoMeta } from '@/lib/seoMeta'
import { ArrowRight } from 'lucide-react'
import {
  SEOHero,
  SEOWhy,
  SEOHowTo,
  SEOCTABlock,
  SEOFaq,
  SEORelated,
} from '@/components/seo/SEOSection'

export const metadata: Metadata = seoMeta(
  '/dsgvo-website-check',
  'DSGVO Website-Check – Welche externen Dienste lädt deine Website?',
  'Kostenloser technischer Check: Erkennt Google Fonts, Google Analytics, Facebook Pixel, Tracking-Cookies und alle externen Verbindungen deiner Website – in ~15 Sekunden.',
)

/* Topic chips shown between hero and why section */
const TOPICS = [
  {
    label: 'Google Analytics / GTM',
    sub: 'Überträgt Besucherdaten an Google',
    href: '/google-analytics-dsgvo',
    dotCn: 'bg-red-400',
    cardCn: 'border-red-200 hover:border-red-300',
  },
  {
    label: 'Facebook / Meta Pixel',
    sub: 'Meldet Seitenbesuche an Meta',
    href: '/facebook-pixel-dsgvo',
    dotCn: 'bg-red-400',
    cardCn: 'border-red-200 hover:border-red-300',
  },
  {
    label: 'Google Fonts (extern)',
    sub: 'Überträgt IP-Adressen an Google',
    href: '/google-fonts-dsgvo',
    dotCn: 'bg-amber-400',
    cardCn: 'border-amber-200 hover:border-amber-300',
  },
  {
    label: 'Tracking-Cookies',
    sub: 'Identifizieren Besucher sitzungsübergreifend',
    href: '/tracking-cookies-dsgvo',
    dotCn: 'bg-amber-400',
    cardCn: 'border-amber-200 hover:border-amber-300',
  },
  {
    label: 'Externe Domains',
    sub: 'Alle weiteren Drittanbieter-Verbindungen',
    href: '/scan',
    dotCn: 'bg-zinc-400',
    cardCn: 'border-zinc-200 hover:border-zinc-400',
  },
]

export default function DsgvoWebsiteCheckPage() {
  return (
    <main>
      <SEOHero
        badge="Kostenloser technischer Check"
        headline="DSGVO Website-Check: Welche externen Dienste lädt deine Website?"
        paragraphs={[
          'Viele Websites laden beim Seitenaufruf externe Dienste – Google Fonts, Analytics-Tools, Social-Media-Pixel oder CDNs. Diese Verbindungen können IP-Adressen und Nutzungsdaten an Dritte übertragen.',
          'Unser technischer Scanner prüft deine Website in ~15 Sekunden und zeigt alle erkannten externen Verbindungen, Cookies und Tracking-Indikatoren übersichtlich an.',
        ]}
        ctaText="Kostenlos prüfen"
      />

      {/* Topic grid – unique to this overview page */}
      <section className="px-4 py-10 bg-white border-b border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap">
              Was wird erkannt?
            </p>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOPICS.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className={`group flex items-start gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-card transition-all duration-150 ${t.cardCn}`}
              >
                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${t.dotCn}`} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-zinc-800 group-hover:text-zinc-900 leading-snug">
                    {t.label}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0 ml-auto mt-1.5 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <SEOWhy
        title="Warum wissen Website-Betreiber das oft nicht?"
        content={[
          'Plugins, Themes und Marketing-Tools fügen externe Verbindungen häufig automatisch hinzu – ohne dass Website-Betreiber aktiv eingreifen. Ein WordPress-Plugin aktualisiert sich und bindet plötzlich einen neuen Tracking-Dienst ein.',
          'Auch vermeintlich harmlose Elemente wie Schriftarten, Social-Media-Buttons oder eingebettete Karten stellen externe Verbindungen her und können dabei technische Daten übertragen.',
          'Ein technischer Scan gibt dir einen konkreten Überblick, welche Verbindungen beim Laden deiner Startseite tatsächlich aufgebaut werden – inklusive aller Cookies und erkannter Tracking-Tools.',
        ]}
      />

      <SEOHowTo
        title="So prüfst du deine Website"
        items={[
          'Kostenloser Scanner: URL eingeben – alle externen Verbindungen, Cookies und Tracking-Indikatoren werden in ~15 Sekunden angezeigt.',
          'Browser DevTools (F12) → Netzwerk-Tab → Seite neu laden → alle externen Domains im Request-Log einsehen.',
          'Quellcode-Analyse: Direkt nach bekannten Domains wie googleapis.com, google-analytics.com oder connect.facebook.net suchen.',
          'Regelmäßiges Monitoring: Externe Verbindungen können sich durch Plugin-Updates jederzeit ändern – unser Monitoring-Feature informiert automatisch per E-Mail.',
        ]}
      />

      <SEOCTABlock
        headline="Website jetzt kostenlos prüfen"
        subtext="Alle externen Dienste, Cookies und Tracking-Indikatoren in ~15 Sekunden – ohne Registrierung."
        ctaText="Kostenlos prüfen"
      />

      <SEOFaq
        items={[
          {
            q: 'Was genau prüft der technische Check?',
            a: 'Der Scanner lädt deine Website mit einem echten Browser und beobachtet 15 Sekunden lang alle ausgehenden Netzwerkverbindungen. Dabei werden externe Domains, gesetzte Cookies und bekannte Tracking-Indikatoren (Google Fonts, GA, Facebook Pixel) erkannt und kategorisiert.',
          },
          {
            q: 'Ist das Ergebnis eine Rechtsberatung?',
            a: 'Nein. Das ist ein rein technischer Check. Die Ergebnisse zeigen technische Indikatoren und externe Verbindungen. Eine rechtliche Bewertung, Einschätzung oder Beratung kann und soll dieses Tool nicht ersetzen.',
          },
          {
            q: 'Wie oft sollte ich meine Website prüfen?',
            a: 'Empfehlenswert ist ein Check nach größeren Updates, Plugin-Installationen oder Änderungen am Theme. Unser Monitoring-Feature scannt automatisch täglich und benachrichtigt dich per E-Mail, wenn sich neue externe Verbindungen ergeben.',
          },
        ]}
      />

      <SEORelated
        links={[
          { href: '/google-analytics-dsgvo', label: 'Google Analytics im Detail' },
          { href: '/facebook-pixel-dsgvo',   label: 'Facebook Pixel im Detail' },
          { href: '/google-fonts-dsgvo',     label: 'Google Fonts im Detail' },
          { href: '/tracking-cookies-dsgvo', label: 'Tracking-Cookies im Detail' },
        ]}
      />
    </main>
  )
}
