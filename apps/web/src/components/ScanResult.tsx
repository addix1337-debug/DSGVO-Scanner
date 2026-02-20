import type { ScanResult } from '@dsgvo/db'
import { TrafficLight, computeSignal } from './TrafficLight'
import { FlagRow } from './FlagRow'

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#888',
          marginBottom: '0.75rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '0.35rem',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// External domains
// ---------------------------------------------------------------------------

function DomainList({ domains }: { domains: string[] }) {
  if (domains.length === 0) {
    return <p style={{ color: '#888', fontSize: '0.875rem' }}>Keine externen Domains erkannt.</p>
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
      }}
    >
      {domains.map((d) => (
        <span
          key={d}
          style={{
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: '0.2rem 0.5rem',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            color: '#333',
          }}
        >
          {d}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cookie table
// ---------------------------------------------------------------------------

function CookieTable({ cookies }: { cookies: ScanResult['cookies'] }) {
  if (cookies.length === 0) {
    return <p style={{ color: '#888', fontSize: '0.875rem' }}>Keine Cookies gesetzt.</p>
  }

  const TRACKING_PREFIXES = ['_ga', '_gid', '_fbp', '_fbc']
  const isTracking = (name: string) => TRACKING_PREFIXES.some((p) => name.startsWith(p))

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          fontSize: '0.8rem',
          borderCollapse: 'collapse',
          fontFamily: 'monospace',
        }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #ddd' }}>Domain</th>
            <th style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #ddd' }}>Typ</th>
            <th style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #ddd' }}>
              Wert (gekürzt)
            </th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => {
            const tracking = isTracking(c.name)
            return (
              <tr
                key={`${c.name}-${i}`}
                style={{ background: tracking ? '#fff8f8' : 'transparent' }}
              >
                <td
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderBottom: '1px solid #f0f0f0',
                    color: tracking ? '#c0392b' : '#1a1a1a',
                    fontWeight: tracking ? 600 : 400,
                  }}
                >
                  {c.name}
                </td>
                <td style={{ padding: '0.35rem 0.6rem', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                  {c.domain}
                </td>
                <td style={{ padding: '0.35rem 0.6rem', borderBottom: '1px solid #f0f0f0' }}>
                  {tracking ? (
                    <span style={{ color: '#c0392b', fontSize: '0.75rem' }}>Tracking</span>
                  ) : (
                    <span style={{ color: '#888', fontSize: '0.75rem' }}>Sonstige</span>
                  )}
                </td>
                <td
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderBottom: '1px solid #f0f0f0',
                    color: '#999',
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.value.slice(0, 40)}
                  {c.value.length > 40 ? '…' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ScanResult({ result: raw, url }: { result: ScanResult; url: string }) {
  // Defensive defaults — guards against older scan records stored before the
  // meta/externalDomains/cookies fields existed, or partial worker writes.
  const result: ScanResult = {
    googleFontsUsed: raw.googleFontsUsed ?? false,
    googleAnalyticsDetected: raw.googleAnalyticsDetected ?? false,
    facebookPixelDetected: raw.facebookPixelDetected ?? false,
    trackingCookiesSet: raw.trackingCookiesSet ?? false,
    hasImprint: raw.hasImprint ?? false,
    hasPrivacyPolicy: raw.hasPrivacyPolicy ?? false,
    externalDomains: raw.externalDomains ?? [],
    cookies: raw.cookies ?? [],
    meta: raw.meta ?? null as unknown as ScanResult['meta'],
  }

  const signal = computeSignal(result)

  return (
    <div>
      {/* Header */}
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem', wordBreak: 'break-all' }}>
        Gescannte URL:{' '}
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#555' }}>
          {url}
        </a>
      </p>

      {/* Traffic light */}
      <TrafficLight signal={signal} />

      {/* Flags */}
      <Section title="Prüfergebnisse">
        <FlagRow
          active={result.googleFontsUsed}
          label="Google Fonts"
          description={
            result.googleFontsUsed
              ? 'Externe Anfragen an fonts.googleapis.com / fonts.gstatic.com erkannt'
              : 'Nicht erkannt'
          }
          fix="Fonts lokal einbinden: bei fonts.google.com herunterladen, in /public ablegen und per @font-face referenzieren. Kein externer Request mehr nötig."
        />
        <FlagRow
          active={result.googleAnalyticsDetected}
          label="Google Analytics / Tag Manager"
          description={
            result.googleAnalyticsDetected
              ? 'Externe Anfragen an googletagmanager.com / google-analytics.com erkannt'
              : 'Nicht erkannt'
          }
          fix="Consent-Management-Plattform (CMP) einbinden, die GA erst nach aktiver Einwilligung lädt. Alternativ: cookielose Analytics wie Plausible oder Umami."
        />
        <FlagRow
          active={result.facebookPixelDetected}
          label="Facebook Pixel"
          description={
            result.facebookPixelDetected
              ? 'Externe Anfragen an connect.facebook.net / fbevents.js erkannt'
              : 'Nicht erkannt'
          }
          fix="Pixel nur nach aktiver Einwilligung laden. CMP einrichten (z.B. Cookiebot, consentmanager.net) oder Pixel auf Server-Side-API wechseln."
        />
        <FlagRow
          active={result.trackingCookiesSet}
          label="Tracking-Cookies"
          description={
            result.trackingCookiesSet
              ? 'Tracking-Cookies gesetzt (_ga, _gid, _fbp o.ä.) — ohne vorherige Einwilligung problematisch'
              : 'Keine Tracking-Cookies erkannt (_ga, _gid, _fbp)'
          }
          fix="Tracking-Cookies dürfen erst nach expliziter Einwilligung gesetzt werden. CMP einbinden, das Cookies erst nach Consent setzt."
        />
        <FlagRow
          active={!result.hasImprint}
          warn
          label="Impressum"
          description={
            result.hasImprint
              ? 'Link oder Text mit „Impressum" gefunden'
              : 'Kein Impressum-Link gefunden — in DE/AT/CH für kommerzielle Seiten verpflichtend'
          }
          fix="Impressum-Seite unter /impressum anlegen und im Footer verlinken. Pflichtangaben: Name, Adresse, E-Mail, ggf. Handelsregister."
        />
        <FlagRow
          active={!result.hasPrivacyPolicy}
          warn
          label="Datenschutzerklärung"
          description={
            result.hasPrivacyPolicy
              ? 'Link oder Text mit „Datenschutz" gefunden'
              : 'Keine Datenschutzerklärung gefunden — nach DSGVO Art. 13/14 verpflichtend'
          }
          fix="Datenschutzerklärung unter /datenschutz anlegen und im Footer verlinken. Generatoren: datenschutz-generator.de oder opr.vc."
        />
      </Section>

      {/* External domains */}
      <Section title={`Externe Domains (${result.externalDomains.length})`}>
        <DomainList domains={result.externalDomains} />
        {result.externalDomains.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: '#999', marginTop: '0.75rem' }}>
            Jeder externe Request überträgt die IP-Adresse des Besuchers an den Drittanbieter.
          </p>
        )}
      </Section>

      {/* Cookies */}
      <Section title={`Cookies (${result.cookies.length})`}>
        <CookieTable cookies={result.cookies} />
      </Section>

      {/* Scan Meta */}
      {result.meta && (
        <Section title="Scan-Details">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}
          >
            {[
              { label: 'Scan-Dauer', value: `${(result.meta.scanDurationMs / 1000).toFixed(1)}s` },
              { label: 'HTTP-Status', value: result.meta.httpStatus ?? '—' },
              { label: 'Requests gesamt', value: result.meta.requestsCount },
              { label: 'Externe Domains', value: result.meta.externalDomainsCount },
              { label: 'Cookies', value: result.meta.cookiesCount },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: '#f8f8f8',
                  border: '1px solid #eee',
                  borderRadius: 6,
                  padding: '0.5rem 0.75rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: 2 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          {result.meta.finalUrl && result.meta.finalUrl !== url && (
            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.75rem' }}>
              Finale URL nach Redirects:{' '}
              <code style={{ background: '#f0f0f0', padding: '0 4px', borderRadius: 3 }}>
                {result.meta.finalUrl}
              </code>
            </p>
          )}
        </Section>
      )}
    </div>
  )
}
