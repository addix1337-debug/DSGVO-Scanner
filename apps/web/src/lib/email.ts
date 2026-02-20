/**
 * Email alerts via Resend (https://resend.com).
 *
 * Setup:
 *   1. Account bei resend.com erstellen (kostenloser Tier: 3.000 Mails/Monat)
 *   2. API Key erstellen → RESEND_API_KEY in .env.local setzen
 *   3. Domain verifizieren → EMAIL_FROM setzen (z.B. alerts@deinedomain.de)
 *
 * Für lokale Tests ohne eigene Domain:
 *   EMAIL_FROM=onboarding@resend.dev
 *   → Resend erlaubt das Senden an die eigene Resend-Registrier-E-Mail (Sandbox)
 */

import { Resend } from 'resend'
import type { ScanDiff } from './diff'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY ist nicht gesetzt')
  return new Resend(key)
}

function getBaseUrl(): string {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

// ---------------------------------------------------------------------------
// Alert Email
// ---------------------------------------------------------------------------

export interface AlertEmailParams {
  to: string
  url: string
  scanId: string
  diff: ScanDiff
}

export async function sendAlertEmail({ to, url, scanId, diff }: AlertEmailParams): Promise<void> {
  const resend = getResend()
  const from = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
  const scanLink = `${getBaseUrl()}/scan/${scanId}`

  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    hostname = url
  }

  const flagItems = diff.newTrackingFlags
    .map((f) => `<li style="color:#c0392b">🔴 ${f}</li>`)
    .join('')

  const domainItems = diff.newExternalDomains
    .map((d) => `<li style="color:#555">🌐 Neue externe Domain: <code>${d}</code></li>`)
    .join('')

  const cookieItems = diff.newCookies
    .map((c) => `<li style="color:#555">🍪 Neues Cookie: <code>${c}</code></li>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:system-ui,sans-serif;background:#f5f5f5;margin:0;padding:2rem">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0">

    <div style="background:#1a1a1a;padding:1.25rem 1.5rem">
      <span style="color:#fff;font-weight:700;font-size:1rem">DSGVO Scanner</span>
      <span style="color:#888;font-size:0.85rem;margin-left:0.5rem">Monitoring Alert</span>
    </div>

    <div style="padding:1.5rem">
      <h2 style="margin:0 0 0.5rem;font-size:1.1rem;color:#1a1a1a">
        Neue Risiken auf <strong>${hostname}</strong> entdeckt
      </h2>
      <p style="color:#555;margin:0 0 1.5rem;font-size:0.9rem">
        Beim täglichen Re-Scan deiner Website wurden folgende Änderungen festgestellt:
      </p>

      <ul style="padding-left:1.25rem;margin:0 0 1.5rem;line-height:1.8;font-size:0.9rem">
        ${flagItems}${domainItems}${cookieItems}
      </ul>

      <a href="${scanLink}"
         style="display:inline-block;background:#1a1a1a;color:#fff;padding:0.6rem 1.25rem;
                border-radius:6px;text-decoration:none;font-size:0.9rem;font-weight:600">
        Vollständigen Scan ansehen →
      </a>

      <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0">

      <p style="color:#aaa;font-size:0.75rem;margin:0">
        Du erhältst diese E-Mail, weil <strong>${url}</strong> in deiner DSGVO-Überwachung ist.
        Antworte auf diese E-Mail um die Überwachung zu deaktivieren.
      </p>
    </div>
  </div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `⚠️ Neue Risiken auf ${hostname} entdeckt`,
    html,
  })

  if (error) {
    throw new Error(`Resend Fehler: ${error.message}`)
  }
}
