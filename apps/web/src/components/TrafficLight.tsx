type Signal = 'red' | 'yellow' | 'green'

const CONFIG: Record<Signal, { color: string; bg: string; label: string; summary: string }> = {
  red: {
    color: '#c0392b',
    bg: '#fdf0ef',
    label: 'Handlungsbedarf',
    summary:
      'Externe Tracking-Dienste oder Fonts ohne Consent erkannt. Technische Hinweise unten.',
  },
  yellow: {
    color: '#d68910',
    bg: '#fef9ec',
    label: 'Prüfen empfohlen',
    summary: 'Externe Domains gefunden. Kein offensichtliches Tracking, aber prüfen lohnt sich.',
  },
  green: {
    color: '#1e8449',
    bg: '#eafaf1',
    label: 'Keine Auffälligkeiten',
    summary: 'Keine externen Tracker oder Fonts erkannt. Impressum und Datenschutz vorhanden.',
  },
}

export function TrafficLight({ signal }: { signal: Signal }) {
  const cfg = CONFIG[signal]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        borderRadius: 10,
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
      }}
    >
      {/* Traffic light widget */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          background: '#1a1a1a',
          borderRadius: 8,
          padding: '8px 6px',
          flexShrink: 0,
        }}
      >
        {(['red', 'yellow', 'green'] as const).map((s) => (
          <div
            key={s}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: signal === s ? CONFIG[s].color : '#444',
              boxShadow: signal === s ? `0 0 8px ${CONFIG[s].color}` : 'none',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: cfg.color }}>{cfg.label}</div>
        <div style={{ color: '#444', fontSize: '0.9rem', marginTop: 3 }}>{cfg.summary}</div>
      </div>
    </div>
  )
}

export function computeSignal(r: {
  googleFontsUsed: boolean
  googleAnalyticsDetected: boolean
  facebookPixelDetected: boolean
  trackingCookiesSet: boolean
  externalDomains: string[]
}): Signal {
  if (
    r.googleFontsUsed ||
    r.googleAnalyticsDetected ||
    r.facebookPixelDetected ||
    r.trackingCookiesSet
  ) {
    return 'red'
  }
  if (r.externalDomains.length > 0) {
    return 'yellow'
  }
  return 'green'
}
