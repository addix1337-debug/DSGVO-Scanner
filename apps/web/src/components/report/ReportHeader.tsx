'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportHeaderProps {
  url: string
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; dotCn: string; pillCn: string }> = {
  done:    { label: 'Abgeschlossen', dotCn: 'bg-emerald-500',             pillCn: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  running: { label: 'Läuft …',       dotCn: 'bg-amber-400 animate-pulse', pillCn: 'bg-amber-50 text-amber-700 border-amber-200' },
  queued:  { label: 'Eingereiht',    dotCn: 'bg-zinc-400 animate-pulse',  pillCn: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  error:   { label: 'Fehler',        dotCn: 'bg-red-500',                 pillCn: 'bg-red-50 text-red-700 border-red-200' },
}

export function ReportHeader({ url, status }: ReportHeaderProps) {
  const [copied, setCopied] = useState(false)
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued

  let hostname = url
  try { hostname = new URL(url).hostname } catch { /* ok */ }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-zinc-200">
      {/* Left: back + URL */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <a
          href="/scan"
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 border border-transparent hover:border-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Neuer Scan
        </a>

        <span className="text-zinc-300 select-none">·</span>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 truncate transition-colors flex items-center gap-1.5 min-w-0"
          >
            <span className="truncate">{hostname}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-zinc-400" />
          </a>

          <button
            onClick={copyLink}
            title="Ergebnis-Link kopieren"
            className={cn(
              'flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border',
              copied
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-700'
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? 'Kopiert' : 'Link kopieren'}</span>
          </button>
        </div>
      </div>

      {/* Right: status pill */}
      <div className={cn(
        'flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
        cfg.pillCn
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dotCn)} />
        {cfg.label}
      </div>
    </div>
  )
}
