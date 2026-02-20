'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function MonitorSignup({ scanId }: { scanId: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

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

  return (
    <div
      style={{
        marginTop: '2.5rem',
        border: '1px solid #e0e0e0',
        borderRadius: 10,
        padding: '1.25rem 1.5rem',
        background: '#fafafa',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Icon */}
        <div
          style={{
            fontSize: '1.4rem',
            lineHeight: 1,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          🔔
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>
            Website überwachen
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#555' }}>
            Wir scannen deine Website täglich erneut und benachrichtigen dich per E-Mail,
            wenn neue Tracker, externe Domains oder Cookies auftauchen.
          </p>

          {status === 'success' ? (
            <div
              style={{
                background: '#eafaf1',
                border: '1px solid #a9dfbf',
                borderRadius: 6,
                padding: '0.6rem 0.875rem',
                color: '#1e6e40',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              ✅ Du wirst benachrichtigt, wenn sich etwas ändert.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                disabled={status === 'loading'}
                style={{
                  flex: '1 1 200px',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.9rem',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.9rem',
                  background: status === 'loading' ? '#888' : '#1a1a1a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {status === 'loading' ? 'Wird gespeichert…' : 'Überwachung aktivieren'}
              </button>
            </form>
          )}

          {status === 'error' && error && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.825rem', color: '#c00' }}>
              {error}
            </p>
          )}

          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#aaa' }}>
            Kein Account nötig. Kostenlos. Max. 20 URLs pro E-Mail-Adresse.
          </p>
        </div>
      </div>
    </div>
  )
}
