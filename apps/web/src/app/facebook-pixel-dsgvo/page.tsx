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
  '/facebook-pixel-dsgvo',
  'Facebook Pixel & DSGVO – Wann überträgt deine Website Daten an Meta?',
  'Der Facebook/Meta Pixel lädt JavaScript von Meta-Servern und überträgt Besucherdaten. Erkenne kostenlos mit unserem Scanner, ob deine Website den Pixel einbindet.',
)

export default function FacebookPixelDsgvoPage() {
  return (
    <main>
      <SEOHero
        badge="Technische Analyse · Facebook / Meta Pixel"
        headline="Der Facebook Pixel meldet Seitenbesuche an Meta zurück – ist deine Website betroffen?"
        paragraphs={[
          'Der Facebook bzw. Meta Pixel ist ein JavaScript-Code, der bei jedem Seitenaufruf eine Verbindung zu Meta-Servern herstellt und Informationen zum Besuch übermittelt.',
          'Unser technischer Scan zeigt dir, ob deine Website den Pixel aktiv lädt – und welche Anfragen dabei an Meta-Server gehen.',
        ]}
        ctaText="Jetzt kostenlos prüfen"
      />

      <SEOWhy
        content={[
          'Der Pixel wird als JavaScript-Snippet im HTML eingebunden. Er lädt die Datei fbevents.js von connect.facebook.net und sendet bei jedem Seitenaufruf ein sogenanntes "PageView"-Event an Meta-Server.',
          'Diese Verbindung überträgt u. a. die IP-Adresse des Besuchers, die aufgerufene URL, Browser-Informationen sowie – wenn aktiv – gehashte Nutzerdaten aus Formularen (z. B. E-Mail-Adressen beim Checkout).',
          'Zusätzlich setzt der Pixel Cookies (_fbp, _fbc), die Besucher über mehrere Seitenaufrufe hinweg identifizierbar machen und einen Abgleich mit Meta-Nutzerkonten ermöglichen.',
        ]}
      />

      <SEOHowTo
        items={[
          'Browser DevTools (F12) → Netzwerk-Tab → nach "connect.facebook.net" oder "facebook.com/tr" filtern.',
          'Browser-Cookies: Cookies mit den Präfixen _fbp oder _fbc sind typische Erkennungsmerkmale des Facebook Pixels.',
          'Im HTML-Quellcode nach "fbevents.js" oder nach "fbq(" suchen – das ist der Aufruf der Pixel-Funktion.',
          'Mit unserem Scanner: Wird der Pixel erkannt, erscheint er direkt unter "Risiken & Fixes" mit konkreten Maßnahmen.',
        ]}
      />

      <SEOCTABlock
        headline="Facebook Pixel auf deiner Website erkennen"
        subtext="Der Scanner zeigt dir in ~15 Sekunden, ob der Meta Pixel aktiv ist – inklusive der gesetzten Tracking-Cookies."
      />

      <SEOFaq
        items={[
          {
            q: 'Was genau überträgt der Facebook Pixel?',
            a: 'Standardmäßig überträgt der Pixel die Seiten-URL, IP-Adresse, Browser- und Geräteinformationen sowie einen Besucher-Identifier. Mit "Advanced Matching" können zusätzlich gehashte Nutzerdaten wie E-Mail-Adressen oder Telefonnummern übertragen werden.',
          },
          {
            q: 'Kann ich den Facebook Pixel behalten, wenn ich einen Cookie-Banner einsetze?',
            a: 'Technisch ja – wenn der Pixel erst nach einer aktiven Einwilligung des Nutzers geladen wird. Der Cookie-Banner muss so konfiguriert sein, dass der Pixel-Code vor der Einwilligung blockiert wird. Erst nach dem Klick auf "Akzeptieren" darf der Code ausgeführt werden.',
          },
          {
            q: 'Was ist der Unterschied zwischen dem Pixel und der Meta Conversions API?',
            a: 'Der Pixel läuft clientseitig im Browser des Besuchers. Die Conversions API (CAPI) sendet Conversion-Daten direkt vom Server – unabhängig vom Browser und von Ad-Blockern. Beide Methoden können kombiniert werden; die Einwilligungspflicht entfällt dadurch nicht.',
          },
        ]}
      />

      <SEORelated
        links={[
          { href: '/google-analytics-dsgvo', label: 'Google Analytics' },
          { href: '/google-fonts-dsgvo',     label: 'Google Fonts' },
          { href: '/tracking-cookies-dsgvo', label: 'Tracking-Cookies' },
          { href: '/dsgvo-website-check',    label: 'Vollständiger Website-Check' },
        ]}
      />
    </main>
  )
}
