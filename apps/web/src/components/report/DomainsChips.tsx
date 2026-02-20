'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { categorizeDomain, sortDomainsByRisk } from '@/lib/domainCategories'
import { ChevronDown } from 'lucide-react'

const INITIAL_SHOW = 25

interface DomainsChipsProps {
  domains: string[]
}

export function DomainsChips({ domains }: DomainsChipsProps) {
  const [showAll, setShowAll] = useState(false)
  const sorted = sortDomainsByRisk(domains)
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_SHOW)
  const hidden = sorted.length - INITIAL_SHOW

  if (domains.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center">
        <p className="text-sm text-zinc-400">Keine externen Domains erkannt.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visible.map((domain) => {
          const cat = categorizeDomain(domain)
          return (
            <div
              key={domain}
              className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs shadow-card hover:shadow-card-md transition-shadow duration-150"
            >
              <span className="font-mono text-zinc-700 leading-none tracking-tight">{domain}</span>
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none border',
                cat.badgeCn
              )}>
                {cat.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Show more / less */}
      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {hidden} weitere Domain{hidden !== 1 ? 's' : ''} anzeigen
        </button>
      )}
      {showAll && sorted.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          Weniger anzeigen
        </button>
      )}

      <p className="text-xs text-zinc-400">
        Jede externe Verbindung überträgt die IP-Adresse des Besuchers an den jeweiligen Anbieter.
      </p>
    </div>
  )
}
