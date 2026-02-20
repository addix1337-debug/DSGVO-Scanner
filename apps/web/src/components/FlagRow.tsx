type FlagRowProps = {
  active: boolean       // true = Problem erkannt
  warn?: boolean        // true = Warnung (kein harter Fehler)
  label: string
  description: string   // was wurde erkannt / nicht erkannt
  fix?: string          // konkreter Fix-Hinweis (nur wenn active)
}

export function FlagRow({ active, warn, label, description, fix }: FlagRowProps) {
  const icon = active ? (warn ? '⚠️' : '❌') : '✅'
  const textColor = active ? (warn ? '#7d6608' : '#922b21') : '#1e6e40'
  const borderColor = active ? (warn ? '#f0c040' : '#f5b7b1') : '#a9dfbf'
  const bgColor = active ? (warn ? '#fef9e7' : '#fdf2f1') : '#f0faf5'

  return (
    <div
      style={{
        borderLeft: `3px solid ${borderColor}`,
        background: bgColor,
        borderRadius: '0 6px 6px 0',
        padding: '0.75rem 1rem',
        marginBottom: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <div>
          <span style={{ fontWeight: 600, color: textColor }}>{label}</span>
          <span style={{ color: '#555', fontSize: '0.875rem', marginLeft: '0.4rem' }}>
            {description}
          </span>
          {active && fix && (
            <div
              style={{
                marginTop: '0.35rem',
                fontSize: '0.85rem',
                color: '#444',
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 4,
                padding: '0.3rem 0.5rem',
              }}
            >
              <strong>💡 Fix:</strong> {fix}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
