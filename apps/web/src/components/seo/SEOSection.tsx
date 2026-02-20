/**
 * Reusable building blocks for SEO landing pages.
 * All components are server-safe (no 'use client') for maximum crawlability.
 */

import { ArrowRight, Check, ChevronDown, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────────
   SEOHero
   ───────────────────────────────────────────────────────────── */
interface SEOHeroProps {
  badge?: string
  headline: string
  paragraphs: string[]
  ctaText?: string
}

export function SEOHero({
  badge,
  headline,
  paragraphs,
  ctaText = 'Website kostenlos prüfen',
}: SEOHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200 bg-white px-4 py-16 sm:py-20">
      {/* Subtle dot grid – matches scan page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.25,
        }}
      />
      <div className="relative max-w-3xl mx-auto">
        {badge && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-xs font-semibold text-zinc-500 shadow-sm">
              <Shield className="h-3 w-3 text-zinc-400" />
              {badge}
            </span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-zinc-900 tracking-tighter leading-[1.07] text-balance mb-5">
          {headline}
        </h1>

        <div className="space-y-3 mb-8 max-w-2xl">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base sm:text-lg text-zinc-600 leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        <a
          href="/scan"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold',
            'bg-zinc-900 text-white shadow-sm',
            'hover:bg-zinc-700 active:scale-[0.97] transition-all duration-150'
          )}
        >
          {ctaText}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SEOWhy  ("Warum passiert das?")
   ───────────────────────────────────────────────────────────── */
interface SEOWhyProps {
  title?: string
  content: string[]
}

export function SEOWhy({ title = 'Warum passiert das?', content }: SEOWhyProps) {
  return (
    <section className="px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <SectionLabel>{title}</SectionLabel>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card space-y-3.5">
          {content.map((p, i) => (
            <p key={i} className="text-sm text-zinc-700 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SEOHowTo  ("So erkennst du es")
   ───────────────────────────────────────────────────────────── */
interface SEOHowToProps {
  title?: string
  items: string[]
}

export function SEOHowTo({ title = 'So erkennst du es', items }: SEOHowToProps) {
  return (
    <section className="px-4 pb-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <SectionLabel>{title}</SectionLabel>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card">
          <ul className="space-y-3.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 leading-relaxed">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SEOCTABlock  (dark conversion block)
   ───────────────────────────────────────────────────────────── */
interface SEOCTABlockProps {
  headline?: string
  subtext?: string
  ctaText?: string
  secondaryHref?: string
  secondaryText?: string
}

export function SEOCTABlock({
  headline = 'Website kostenlos prüfen',
  subtext = 'Erkennt externe Dienste, Tracking-Indikatoren und Cookies – in ~15 Sekunden.',
  ctaText = 'Kostenlos prüfen',
  secondaryHref,
  secondaryText = 'Beispielreport ansehen (welt.de)',
}: SEOCTABlockProps) {
  return (
    <section className="px-4 pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl bg-zinc-900 p-8 text-center shadow-card-lg">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
            {headline}
          </h2>
          <p className="text-sm text-white/55 mb-6 max-w-sm mx-auto leading-relaxed">
            {subtext}
          </p>
          <a
            href="/scan"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold',
              'bg-white text-zinc-900 shadow-sm',
              'hover:bg-zinc-100 active:scale-[0.97] transition-all duration-150'
            )}
          >
            {ctaText}
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-[11px] text-white/30 mt-4">
            Kein Konto · Keine Installation · Technischer Hinweis
          </p>
          {secondaryHref && (
            <a
              href={secondaryHref}
              className="inline-block mt-2 text-xs text-white/40 underline underline-offset-2 hover:text-white/70 transition-colors"
            >
              {secondaryText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SEOFaq  (native details/summary – zero JS, full crawlability)
   ───────────────────────────────────────────────────────────── */
interface FAQItem {
  q: string
  a: string
}

interface SEOFaqProps {
  items: FAQItem[]
}

export function SEOFaq({ items }: SEOFaqProps) {
  return (
    <section className="px-4 pb-10">
      <div className="max-w-3xl mx-auto space-y-4">
        <SectionLabel>Häufige Fragen</SectionLabel>
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-card divide-y divide-zinc-100">
          {items.map((item, i) => (
            <details key={i} className="group">
              <summary
                className={cn(
                  'flex items-center justify-between gap-4 px-5 py-4',
                  'cursor-pointer select-none list-none',
                  '[&::-webkit-details-marker]:hidden',
                  'hover:bg-zinc-50/80 transition-colors duration-100'
                )}
              >
                <span className="font-semibold text-sm text-zinc-800 leading-snug">
                  {item.q}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 pt-1">
                <p className="text-sm text-zinc-600 leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   SEORelated  (internal linking chips)
   ───────────────────────────────────────────────────────────── */
interface RelatedLink {
  href: string
  label: string
}

interface SEORelatedProps {
  links: RelatedLink[]
}

export function SEORelated({ links }: SEORelatedProps) {
  if (!links.length) return null
  return (
    <section className="px-4 pb-16">
      <div className="max-w-3xl mx-auto space-y-4">
        <SectionLabel>Weitere DSGVO-Prüfungen</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white',
                'px-3.5 py-2 text-xs font-semibold text-zinc-600 shadow-card',
                'hover:border-zinc-400 hover:text-zinc-900 transition-all duration-150'
              )}
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   Internal helper
   ───────────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  )
}
