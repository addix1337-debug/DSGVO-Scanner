import type { Metadata } from 'next'
import { seoMeta } from '@/lib/seoMeta'
import {
  SEOHero,
  SEOWhy,
  SEOHowTo,
  SEOCTABlock,
  SEOFaq,
  SEORelated,
} from '@/components/seo/SEOSection'

export const metadata: Metadata = seoMeta(
  '/tracking-cookies-dsgvo',
  'Tracking-Cookies erkennen – Welche Cookies setzt deine Website? | Check',
  'Cookies wie _ga, _gid oder _fbp identifizieren Besucher über Seitenaufrufe hinweg. Prüfe kostenlos, welche Tracking-Cookies deine Website setzt.',
)

export default function TrackingCookiesDsgvoPage() {
  return (
    <main>
      <SEOHero
        badge="Technische Analyse · Tracking-Cookies"
        headline="Welche Cookies setzt deine Website – und welche davon verfolgen Besucher?"
        paragraphs={[
          'Cookies sind kleine Datenpakete, die im Browser des Besuchers gespeichert werden. Nicht alle Cookies sind problematisch – aber Tracking-Cookies wie _ga, _gid oder _fbp identifizieren Besucher über mehrere Seitenaufrufe hinweg.',
          'Unser Scanner listet alle beim Seitenaufruf gesetzten Cookies auf und markiert bekannte Tracking-Präfixe automatisch.',
        ]}
        ctaText="Cookies jetzt prüfen"
      />

      <SEOWhy
        content={[
          'Tracking-Cookies werden in der Regel von eingebundenen Drittanbieter-Scripts gesetzt – z. B. von Google Analytics (_ga, _gid, _gat) oder dem Facebook Pixel (_fbp, _fbc). Das passiert automatisch, sobald diese Tools auf der Seite aktiv sind.',
          'Diese Cookies enthalten eine eindeutige ID, die den Browser des Besuchers identifiziert. Analytics-Dienste können damit nachvollziehen, welche Seiten jemand aufgerufen hat – auch über mehrere Sitzungen und Seitenaufrufe hinweg.',
          'Session-Cookies dagegen verfallen beim Schließen des Browsers und sind für technisch notwendige Funktionen gedacht (z. B. Warenkorb, Login). Der wesentliche Unterschied liegt in der Laufzeit und im Zweck des Cookies.',
        ]}
      />

      <SEOHowTo
        items={[
          'Browser DevTools (F12) → Reiter "Application" (Chrome) oder "Storage" (Firefox) → "Cookies" → alle gesetzten Cookies und deren Namen prüfen.',
          'Nach bekannten Tracking-Präfixen suchen: _ga, _gid, _gat (Google Analytics), _fbp, _fbc (Meta/Facebook), __utm (Universal Analytics, veraltet).',
          'Browser-Extensions wie "CookieEditor" oder "EditThisCookie" zeigen alle Cookies übersichtlich mit Name, Domain und Laufzeit.',
          'Mit unserem Scanner: Alle beim Seitenaufruf gesetzten Cookies werden tabellarisch aufgelistet – Tracking-Cookies sind farblich hervorgehoben.',
        ]}
      />

      <SEOCTABlock
        headline="Kostenlosen DSGVO-Check starten"
        subtext="Der Scanner zeigt alle Cookies, die beim Laden deiner Seite gesetzt werden – sortiert nach Typ und Risiko."
        ctaText="Jetzt Website scannen"
        secondaryHref="/report/welt.de"
      />

      <SEOFaq
        items={[
          {
            q: 'Was ist der Unterschied zwischen Session-Cookies und Tracking-Cookies?',
            a: 'Session-Cookies speichern temporäre Informationen (z. B. den Inhalt eines Warenkorbs oder den Login-Status) und verfallen beim Schließen des Browsers. Tracking-Cookies haben eine längere Laufzeit und dienen dazu, Besucher sitzungsübergreifend wiederzuerkennen.',
          },
          {
            q: 'Sind alle Drittanbieter-Cookies automatisch Tracking-Cookies?',
            a: 'Nein. Einige Drittanbieter-Cookies erfüllen technische Funktionen, z. B. bei CDN-Diensten oder Zahlungsdienstleistern. Tracking-Cookies zeichnen sich durch ihren Zweck aus: Sie werden explizit zur Benutzeridentifikation und Verhaltensanalyse eingesetzt.',
          },
          {
            q: 'Welche Cookies kann ich ohne Einwilligung setzen?',
            a: 'Technisch notwendige Cookies für den Betrieb der Website – z. B. Session-Cookies für den Login oder den Warenkorb – gelten i. d. R. als einwilligungsfrei. Für Tracking-, Marketing- und Analyse-Cookies ist in der Regel eine aktive Einwilligung des Nutzers erforderlich. Dies ist eine technische Einschätzung, keine Rechtsberatung.',
          },
        ]}
      />

      <SEORelated
        links={[
          { href: '/google-analytics-dsgvo', label: 'Google Analytics' },
          { href: '/facebook-pixel-dsgvo',   label: 'Facebook Pixel' },
          { href: '/google-fonts-dsgvo',     label: 'Google Fonts' },
          { href: '/dsgvo-website-check',    label: 'Vollständiger Website-Check' },
        ]}
      />
    </main>
  )
}
