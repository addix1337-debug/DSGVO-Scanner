'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const TRACKING_PREFIXES = ['_ga', '_gid', '_fbp', '_fbc', '__utm']
const INITIAL_ROWS = 30

function isTracking(name: string): boolean {
  return TRACKING_PREFIXES.some((p) => name.startsWith(p))
}

type Cookie = { name: string; domain: string; value: string }

interface CookiesTableProps {
  cookies: Cookie[]
}

export function CookiesTable({ cookies }: CookiesTableProps) {
  const [showAll, setShowAll] = useState(false)

  if (cookies.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-5 text-center">
        <p className="text-sm text-zinc-400">Keine Cookies gesetzt.</p>
      </div>
    )
  }

  const sorted = [...cookies].sort((a, b) => {
    const aT = isTracking(a.name) ? 0 : 1
    const bT = isTracking(b.name) ? 0 : 1
    return aT - bT
  })
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_ROWS)
  const hidden = sorted.length - INITIAL_ROWS

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-card bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="text-left px-4 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                Name
              </th>
              <th className="text-left px-4 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] hidden sm:table-cell">
                Domain
              </th>
              <th className="text-left px-4 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">
                Typ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visible.map((c, i) => {
              const tracking = isTracking(c.name)
              return (
                <tr
                  key={`${c.name}-${i}`}
                  className={cn(
                    'transition-colors',
                    tracking
                      ? 'bg-red-50/60 hover:bg-red-50'
                      : 'bg-white hover:bg-zinc-50'
                  )}
                >
                  <td className="px-4 py-2.5 font-mono font-semibold text-zinc-800">
                    {c.name}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500 hidden sm:table-cell truncate max-w-[180px] font-mono text-[11px]">
                    {c.domain}
                  </td>
                  <td className="px-4 py-2.5">
                    {tracking ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                        Tracking
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-200">
                        Sonstige
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!showAll && hidden > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {hidden} weitere{hidden !== 1 ? ' Cookies' : ' Cookie'} anzeigen
        </button>
      )}
      {showAll && sorted.length > INITIAL_ROWS && (
        <button
          onClick={() => setShowAll(false)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          Weniger anzeigen
        </button>
      )}
    </div>
  )
}
