# Worker Service

Fastify-Service, der Playwright-basierte DSGVO-Scans ausführt und Ergebnisse in Supabase speichert.

**Port:** `3001` (konfigurierbar via `PORT` in `.env`)

---

## Endpoints

### `GET /health`

Health-Check — gibt immer `200 OK` zurück wenn der Service läuft.

```json
{ "status": "ok", "service": "dsgvo-worker" }
```

### `POST /run`

Startet einen Scan für eine bestehende Scan-ID (fire-and-forget).

**Request:**
```json
{ "scanId": "uuid-string" }
```

**Response (sofort):**
```json
{ "ok": true, "scanId": "uuid-string" }
```

Der eigentliche Scan läuft asynchron im Hintergrund. Der Status wird in Supabase
in der `scans`-Tabelle aktualisiert (`queued → running → done | error`).

**Fehler:**
- `400` — `scanId` fehlt oder ist kein String
- Scan-Fehler landen als `status=error` + `error_message` in Supabase, nicht als HTTP-Fehler

---

## Demo-Scan (ohne Supabase)

```bash
# Von Root:
pnpm --filter worker scan:demo https://example.com

# Direkt im worker-Verzeichnis:
pnpm scan:demo https://example.com
pnpm scan:demo https://nytimes.com
```

Gibt das vollständige `ScanResult`-JSON in der Konsole aus. Kein Supabase nötig.

---

## Scan-Ablauf

1. URL normalisieren und auf SSRF prüfen (private IPs, IP-Literals, Credentials)
2. DNS-Rebind-Check: Hostname auflösen, alle IPs gegen private Ranges prüfen
3. Playwright Chromium headless starten
4. `page.on('request')` → alle Request-URLs sammeln
5. `page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45s })`
6. 15 Sekunden warten (lazy-loaded Tracker)
7. Cookies auslesen, HTML analysieren (Impressum/Datenschutz-Links)
8. Ergebnis + Meta (finalUrl, httpStatus, Dauer) in Supabase schreiben

**Gesamt-Timeout:** 70 Sekunden (via `Promise.race` im Job-Handler)

---

## Error Codes

Fehler werden als `"code: message"` in `scans.error_message` gespeichert:

| Code | Ursache |
|---|---|
| `blocked_url` | Private IP, IP-Literal, DNS-Rebind, Credentials in URL |
| `navigation_timeout` | Seite antwortet nicht innerhalb 45s / Gesamt-Timeout 70s |
| `dns_failed` | Domain nicht auflösbar oder DNS-Timeout (5s) |
| `playwright_failed` | Browser-Crash oder unerwarteter Navigation-Fehler |
| `unknown` | Sonstiger Fehler |

---

## Logging

Der Worker loggt strukturiert via Fastify's eingebautem `pino`-Logger (JSON in Prod, pretty in Dev).

**Pro Scan geloggt:**
- Start: `{ scanId, url }`
- Ende: `{ scanId, durationMs, googleFontsUsed, googleAnalyticsDetected, facebookPixelDetected, trackingCookiesSet, externalDomains, cookies }`
- Fehler: `{ scanId, code, message, durationMs }`

Logs in Terminal ansehen:
```bash
pnpm dev:worker 2>&1 | grep scanId
```

---

## ENV

Siehe `apps/worker/.env.example`:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
