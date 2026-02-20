'use client'

import { useState } from 'react'
import { Bell, CheckCircle, Loader2, Zap, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonitorCardProps {
  scanId: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

/** Lightweight email format check — real validation happens server-side */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function MonitorCard({ scanId }: MonitorCardProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidEmail(email)) {
      setError('Bitte gültige E-Mail eingeben.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), scanId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error ?? 'Unbekannter Fehler')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setError('Netzwerkfehler — bitte erneut versuchen')
    }
  }

  /* ── Success state ─────────────────────────────────────────── */
  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-emerald-800 text-sm">
            Aktiv ✅
          </p>
          <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
            Wir melden uns, sobald neue externe Verbindungen erkannt werden.
          </p>
          <p className="text-xs text-emerald-500 mt-2">Kein Spam · Abmelden jederzeit</p>
        </div>
      </div>
    )
  }

  /* ── Default / error state ─────────────────────────────────── */
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900 shadow-card-lg">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            Monitoring
          </span>
        </div>

        {/* Headline — conversion copy */}
        <h3 className="font-bold text-white text-base leading-snug mb-2">
          Warnung, wenn sich etwas ändert
        </h3>

        {/* Value proposition — two tight sentences */}
        <p className="text-sm text-white/55 leading-relaxed">
          Plugins, Widgets und Marketing-Tools können jederzeit neue externe Verbindungen
          hinzufügen – oft ohne dass du es bemerkst.
        </p>
        <p className="text-sm text-white/55 leading-relaxed mt-1.5">
          Wir scannen regelmäßig und schicken dir eine E-Mail, wenn neue Tracker, Dienste
          oder Cookies auftauchen.
        </p>
      </div>

      {/* Form */}
      <div className="px-5 py-4 space-y-2.5">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            placeholder="name@firma.de"
            disabled={status === 'loading'}
            autoComplete="email"
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-150',
              'border-white/15 bg-white/8 text-white placeholder:text-white/30',
              'focus:border-white/35 focus:bg-white/12',
              'disabled:opacity-50'
            )}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !isValidEmail(email)}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150',
              'bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'shadow-sm'
            )}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aktiviere…
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Kostenlose Warnungen aktivieren
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <Shield className="h-3 w-3 text-white/25 flex-shrink-0" />
          <p className="text-[11px] text-white/30">
            Kein Spam · Abmelden jederzeit · Max. 20 Websites
          </p>
        </div>
      </div>
    </div>
  )
}
