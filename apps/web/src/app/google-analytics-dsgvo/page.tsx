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
  '/google-analytics-dsgvo',
  'Google Analytics & DSGVO – Was wird übertragen? | Technischer Check',
  'Google Analytics überträgt Besucherverhalten, IP-Adressen und Gerätedaten an Google. Erkenne kostenlos, ob deine Website Google Analytics oder GTM einbindet.',
)

export default function GoogleAnalyticsDsgvoPage() {
  return (
    <main>
      <SEOHero
        badge="Technische Analyse · Google Analytics / GTM"
        headline="Google Analytics überträgt Besucherdaten an Google – ist deine Website betroffen?"
        paragraphs={[
          'Google Analytics (GA4) und Google Tag Manager sind auf Millionen Websites aktiv. Sie sammeln Daten zu Seitenaufrufen, Klickpfaden und Geräteinformationen – und übertragen diese an Google-Server.',
          'Unser technischer Scan erkennt, ob deine Website Google Analytics oder den Tag Manager lädt – inklusive der dabei gesetzten Tracking-Cookies.',
        ]}
        ctaText="Jetzt kostenlos prüfen"
      />

      <SEOWhy
        content={[
          'Google Analytics wird über ein JavaScript-Snippet eingebunden: entweder direkt als gtag.js oder über den Google Tag Manager. Sobald ein Besucher die Seite lädt, wird das Script ausgeführt.',
          'Das Script setzt Cookies (_ga, _gid) und überträgt Daten wie die anonymisierte IP-Adresse, den Browser-Typ, die aufgerufene Seite und Verhaltensmetriken an Google-Server – typischerweise in die USA.',
          'Der Google Tag Manager fungiert als Container-System: Er kann neben GA auch andere Tags (Facebook Pixel, Conversion-Tracking usw.) nachladen. Auch der GTM selbst stellt eine externe Verbindung zu Google-Servern her.',
        ]}
      />

      <SEOHowTo
        items={[
          'Browser DevTools (F12) → Netzwerk-Tab → nach "google-analytics.com", "googletagmanager.com" oder "gtag" filtern.',
          'Browser-Cookies prüfen: Cookies mit den Präfixen _ga, _gid oder _gat deuten auf aktives Google Analytics hin.',
          'Im HTML-Quellcode nach dem String "gtag(" oder nach einer GTM-ID im Format "GTM-XXXXXXX" suchen.',
          'Mit unserem Scanner: Eine erkannte GA/GTM-Verbindung wird direkt unter "Risiken & Fixes" mit konkreten Handlungsoptionen angezeigt.',
        ]}
      />

      <SEOCTABlock
        headline="Google Analytics auf deiner Website erkennen"
        subtext="Der Scanner zeigt dir in ~15 Sekunden, welche Analytics-Tools aktiv sind – inklusive gesetzter Tracking-Cookies."
      />

      <SEOFaq
        items={[
          {
            q: 'Was genau überträgt Google Analytics an Google?',
            a: 'GA überträgt technische Daten wie die anonymisierte IP-Adresse, Gerätedaten, Browser-Typ, aufgerufene Seiten-URLs, Verweildauer und Klickpfade. Welche Daten genau gesammelt werden, hängt von der Konfiguration und den aktivierten Funktionen ab.',
          },
          {
            q: 'Reicht ein Cookie-Banner, damit Google Analytics eingesetzt werden kann?',
            a: 'Ein Cookie-Banner allein reicht technisch nicht aus. Google Analytics darf erst geladen werden, nachdem der Besucher aktiv eingewilligt hat – nicht nur nach Anzeige des Banners. Technisch muss das Laden des Scripts blockiert und erst nach Einwilligung freigegeben werden.',
          },
          {
            q: 'Gibt es datenschutzfreundlichere Alternativen zu Google Analytics?',
            a: 'Ja. Plausible Analytics und Umami sind EU-gehostete Alternativen ohne Cookies und ohne Datenweitergabe an Dritte. Matomo kann vollständig selbst gehostet werden, sodass keine Daten das eigene System verlassen.',
          },
        ]}
      />

      <SEORelated
        links={[
          { href: '/google-fonts-dsgvo',     label: 'Google Fonts' },
          { href: '/facebook-pixel-dsgvo',   label: 'Facebook Pixel' },
          { href: '/tracking-cookies-dsgvo', label: 'Tracking-Cookies' },
          { href: '/dsgvo-website-check',    label: 'Vollständiger Website-Check' },
        ]}
      />
    </main>
  )
}
