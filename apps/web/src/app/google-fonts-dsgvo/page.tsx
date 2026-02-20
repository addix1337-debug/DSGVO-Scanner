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
  '/google-fonts-dsgvo',
  'Google Fonts & DSGVO – IP-Übertragung erkennen | Technischer Check',
  'Viele Websites laden Schriften direkt von Google-Servern und übertragen dabei IP-Adressen. Prüfe jetzt kostenlos, ob deine Website Google Fonts extern einbindet.',
)

export default function GoogleFontsDsgvoPage() {
  return (
    <main>
      <SEOHero
        badge="Technische Analyse · Google Fonts"
        headline="Google Fonts überträgt bei jedem Seitenaufruf IP-Adressen an Google"
        paragraphs={[
          'Viele Websites binden Schriften direkt über fonts.googleapis.com ein. Das ist bequem – aber jeder Seitenaufruf erzeugt eine Anfrage an Google-Server, bei der die IP-Adresse des Besuchers übertragen wird.',
          'Dieser technische Scan zeigt dir, ob deine Website Google Fonts extern lädt – und welche Alternativen eine Übertragung vermeiden.',
        ]}
        ctaText="Jetzt kostenlos prüfen"
      />

      <SEOWhy
        content={[
          'Wenn eine Website Google Fonts einbindet, fügt der Entwickler typischerweise einen HTML-Link-Tag ein: <link href="https://fonts.googleapis.com/...">. Beim Laden der Seite fragt der Browser des Besuchers Google direkt nach der Schriftdatei.',
          'Dabei übermittelt der Browser automatisch technische Informationen – darunter die IP-Adresse, den Browser-Typ und die Referrer-URL. Diese Übertragung findet bei jedem einzelnen Seitenaufruf statt.',
          'Das Problem: Google-Server befinden sich zum Teil außerhalb der EU. Die Übertragung von IP-Adressen an diese Server kann ohne entsprechende Rechtsgrundlage und technisch-organisatorische Maßnahmen kritisch gesehen werden.',
        ]}
      />

      <SEOHowTo
        items={[
          'Browser DevTools (F12) → Netzwerk-Tab öffnen → Seite neu laden → nach "fonts.googleapis.com" oder "fonts.gstatic.com" filtern.',
          'Im HTML-Quellcode der Website nach <link href="https://fonts.googleapis.com" suchen – oft im <head>-Bereich.',
          'Mit unserem kostenlosen Scanner: URL eingeben – erkannte Fonts-Verbindungen erscheinen im Bereich "Externe Dienste" mit dem Badge "Fonts".',
          'Netzwerk-Traffic-Analyse: Jede Anfrage an fonts.gstatic.com zeigt, dass Schriftdateien extern geladen werden.',
        ]}
      />

      <SEOCTABlock
        headline="Google Fonts auf deiner Website prüfen"
        subtext="Unser Scanner erkennt in ~15 Sekunden, ob externe Schriften geladen werden – kostenlos, ohne Registrierung."
      />

      <SEOFaq
        items={[
          {
            q: 'Was ist der Unterschied zu lokal gehosteten Google Fonts?',
            a: 'Lokal gehostete Fonts werden direkt von deinem eigenen Server ausgeliefert. Es gibt keine Verbindung zu Google-Servern – damit entfällt die IP-Übertragung vollständig. Die Schriften sehen für Besucher identisch aus.',
          },
          {
            q: 'Muss ich Google Fonts komplett entfernen?',
            a: 'Nicht unbedingt. Eine verbreitete Lösung ist das lokale Hosting: Schriftdateien bei fonts.google.com herunterladen, auf deinen Server hochladen und per CSS @font-face einbinden. So behältst du die gewünschten Schriften ohne externe Verbindung.',
          },
          {
            q: 'Wie lange dauert es, Google Fonts lokal zu hosten?',
            a: 'In der Regel unter 30 Minuten. Du lädst die Schriftdateien herunter, lädst sie in dein Webprojekt hoch und ersetzt die externen Links durch lokale @font-face-Definitionen im CSS. Tools wie "google-webfonts-helper" automatisieren diesen Prozess.',
          },
        ]}
      />

      <SEORelated
        links={[
          { href: '/google-analytics-dsgvo', label: 'Google Analytics' },
          { href: '/facebook-pixel-dsgvo',   label: 'Facebook Pixel' },
          { href: '/tracking-cookies-dsgvo', label: 'Tracking-Cookies' },
          { href: '/dsgvo-website-check',    label: 'Vollständiger Website-Check' },
        ]}
      />
    </main>
  )
}
