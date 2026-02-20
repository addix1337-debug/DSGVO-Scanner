'use client'

import { useState } from 'react'
import { ChevronDown, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScanResult } from '@dsgvo/db'

interface FindingItem {
  id: string
  level: 'high' | 'warn'
  title: string
  seen: string
  why: string
  fixes: string[]
}

function buildFindings(result: ScanResult): FindingItem[] {
  const items: FindingItem[] = []

  if (result.googleAnalyticsDetected) {
    items.push({
      id: 'ga',
      level: 'high',
      title: 'Google Analytics / Tag Manager',
      seen: 'Anfragen an googletagmanager.com oder google-analytics.com erkannt.',
      why: 'Überträgt Besucherdaten (IP, Seiten, Verhalten) an Google-Server in den USA.',
      fixes: [
        'Consent-Management-Plattform (z.B. Cookiebot, consentmanager.net) einbinden – lädt GA erst nach Einwilligung.',
        'Alternative: Plausible Analytics oder Umami – cookielos, EU-gehostet.',
        'Server-Side Tagging als technische Zwischenlösung (reduziert, ersetzt nicht die Einwilligungspflicht).',
      ],
    })
  }

  if (result.facebookPixelDetected) {
    items.push({
      id: 'fb',
      level: 'high',
      title: 'Facebook / Meta Pixel',
      seen: 'Anfragen an connect.facebook.net oder fbevents.js erkannt.',
      why: 'Überträgt Besucherdaten an Meta zur Conversion-Messung und Retargeting.',
      fixes: [
        'Pixel nur nach expliziter Einwilligung laden – CMP erforderlich.',
        'Conversions API (serverseitig) als ergänzende oder alternative Lösung.',
        'Ohne CMP: Pixel vollständig entfernen, bis Rechtsgrundlage geklärt.',
      ],
    })
  }

  if (result.googleFontsUsed) {
    items.push({
      id: 'fonts',
      level: 'high',
      title: 'Google Fonts (extern geladen)',
      seen: 'Anfragen an fonts.googleapis.com oder fonts.gstatic.com erkannt.',
      why: 'Jede Anfrage überträgt die IP-Adresse des Besuchers an Google-Server.',
      fixes: [
        'Fonts lokal hosten: bei fonts.google.com herunterladen, in /public ablegen.',
        'CSS @font-face mit lokalem Pfad referenzieren – kein externer Request.',
        'Alternative: System-Font-Stack ohne Web Fonts (schneller, keine Abhängigkeit).',
      ],
    })
  }

  if (result.trackingCookiesSet) {
    items.push({
      id: 'cookies',
      level: 'high',
      title: 'Tracking-Cookies gesetzt',
      seen: 'Cookies mit Tracking-Präfixen (_ga, _gid, _fbp o.ä.) wurden gesetzt.',
      why: 'Tracking-Cookies identifizieren Besucher über Seitenaufrufe hinaus – einwilligungspflichtig.',
      fixes: [
        'CMP einbinden: Cookies erst nach Einwilligung setzen lassen.',
        'Cookie-Audit durchführen: welches Tool setzt welches Cookie?',
        'Tracking-Tools ohne Cookies prüfen (z.B. Plausible, Fathom).',
      ],
    })
  }

  if (!result.hasImprint) {
    items.push({
      id: 'imprint',
      level: 'warn',
      title: 'Kein Impressum gefunden',
      seen: 'Kein Link oder Text mit „Impressum" auf der Startseite erkannt.',
      why: 'In Deutschland, Österreich und der Schweiz für kommerzielle Seiten gesetzlich verpflichtend (TMG §5).',
      fixes: [
        'Impressum-Seite unter /impressum anlegen.',
        'Im Footer von jeder Seite verlinken.',
        'Pflichtangaben: Name, Adresse, E-Mail, ggf. Handelsregisternummer.',
      ],
    })
  }

  if (!result.hasPrivacyPolicy) {
    items.push({
      id: 'privacy',
      level: 'warn',
      title: 'Keine Datenschutzerklärung gefunden',
      seen: 'Kein Link oder Text mit „Datenschutz" auf der Startseite erkannt.',
      why: 'Nach DSGVO Art. 13/14 verpflichtend wenn personenbezogene Daten verarbeitet werden.',
      fixes: [
        'Datenschutzerklärung unter /datenschutz anlegen.',
        'Generator: datenschutz-generator.de oder opr.vc (kostenlos).',
        'Im Footer neben dem Impressum verlinken.',
      ],
    })
  }

  return items
}

function AccordionItem({ item, defaultOpen = false }: { item: FindingItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const isHigh = item.level === 'high'

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-zinc-50/80 transition-colors duration-100"
        aria-expanded={open}
      >
        <span className="flex-shrink-0 mt-px">
          {isHigh
            ? <AlertTriangle className="h-4 w-4 text-red-500" />
            : <AlertCircle className="h-4 w-4 text-amber-500" />}
        </span>

        <span className="flex-1 font-semibold text-sm text-zinc-800">{item.title}</span>

        <span className={cn(
          'flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold border mr-1',
          isHigh
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-amber-100 text-amber-700 border-amber-200'
        )}>
          {isHigh ? 'Hohes Risiko' : 'Hinweis'}
        </span>

        <ChevronDown className={cn(
          'h-4 w-4 text-zinc-400 transition-transform duration-200 flex-shrink-0',
          open && 'rotate-180'
        )} />
      </button>

      {/* Animated content */}
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        open ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-5 pb-5 space-y-3">
          {/* Was erkannt / Warum relevant */}
          <div className="grid sm:grid-cols-2 gap-2.5">
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-3.5">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Was erkannt
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed">{item.seen}</p>
            </div>
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-3.5">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Warum relevant
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed">{item.why}</p>
            </div>
          </div>

          {/* Fixes */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2.5">
              Fix in 5 Minuten
            </p>
            <ul className="space-y-2">
              {item.fixes.map((fix, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {fix}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FindingsAccordionProps {
  result: ScanResult
}

export function FindingsAccordion({ result }: FindingsAccordionProps) {
  const items = buildFindings(result)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 flex items-center gap-4">
        <div className="flex-shrink-0 h-11 w-11 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl leading-none">
          🎉
        </div>
        <div>
          <p className="font-bold text-emerald-800 text-sm">Keine Risiken erkannt</p>
          <p className="text-sm text-emerald-700 mt-0.5 leading-relaxed">
            Keine bekannten Tracking-Dienste oder fehlenden Pflichtseiten gefunden.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-card">
      {items.map((item, i) => (
        <AccordionItem
          key={item.id}
          item={item}
          defaultOpen={i === 0} /* First item open — shows value immediately */
        />
      ))}
    </div>
  )
}
