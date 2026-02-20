# Web App

Next.js 14 App Router Frontend + API Routes für den DSGVO Scanner.

**Port:** `3000`

---

## Seiten

| Route | Typ | Beschreibung |
|---|---|---|
| `/` | Server | Redirect zu `/scan` |
| `/scan` | Client | URL-Eingabe-Formular |
| `/scan/[id]` | Client | Ergebnis-Seite mit Polling + Ampel |

---

## API Routes

### `POST /api/scan`

Startet einen neuen Scan.

**Request:**
```json
{ "url": "https://example.com" }
```

**Ablauf:**
1. Rate-Limit prüfen (10 Req / 10 Min / IP + 10s Cooldown)
2. URL validieren (Protokoll, Port, Credentials, IP-Literals, private Hosts)
3. DNS-Rebind-Check (async, 5s Timeout)
4. Idempotency-Check: Gleiche URL + IP innerhalb 2 Minuten → bestehenden Scan zurückgeben
5. Neuen `scans`-Eintrag anlegen (`status=queued`)
6. Worker per `POST /run` triggern (fire-and-forget, 5s Connect-Timeout)

**Response `201`:**
```json
{ "scanId": "uuid" }
```

**Response `200` (reused):**
```json
{ "scanId": "uuid", "reused": true }
```

**Fehler:**
| Status | Ursache |
|---|---|
| `400` | URL fehlt, ungültig, oder geblockt (SSRF) |
| `429` | Rate Limit überschritten — `Retry-After`-Header gesetzt |
| `500` | Supabase-Fehler |

---

### `GET /api/scan/[id]`

Gibt den aktuellen Status eines Scans zurück. Wird vom Browser alle 2 Sekunden gepollt.

**Response `200`:**
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "status": "done",
  "result": { ... },
  "error_message": null,
  "created_at": "2025-..."
}
```

`status` kann sein: `queued | running | done | error`

Das Polling in `scan/[id]/page.tsx` stoppt automatisch sobald `status = done` oder `status = error`.

**Fehler:**
- `400` — UUID-Format ungültig
- `404` — Scan nicht gefunden
- `500` — Supabase-Fehler

---

## Polling-Verhalten

```
Browser → GET /api/scan/[id]  (sofort)
  └── status=queued  → erneut nach 2s
  └── status=running → erneut nach 2s
  └── status=done    → STOP, Ergebnis rendern
  └── status=error   → STOP, Fehlermeldung anzeigen
```

Bei Netzwerkfehlern wird die Fehlermeldung direkt angezeigt, kein Retry.

---

## ENV

Alle Variablen sind server-seitig (kein `NEXT_PUBLIC_`-Präfix).

```env
# apps/web/.env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WORKER_URL=http://localhost:3001

# Optional (nur lokal): erlaubt Ports 8080 und 8443 bei URL-Scans
ALLOW_DEV_PORTS=true
```

---

## Komponenten-Übersicht

| Datei | Beschreibung |
|---|---|
| `src/components/ScanResult.tsx` | Haupt-Ergebnis-Komponente (Ampel + Flags + Listen + Meta) |
| `src/components/TrafficLight.tsx` | Ampel-Widget + `computeSignal()` Logik |
| `src/components/FlagRow.tsx` | Flag-Zeile mit Icon, Beschreibung, Fix-Hinweis |
| `src/lib/validateUrl.ts` | Sync URL-Validierung (client + server) |
| `src/lib/ssrfGuard.ts` | Async DNS-Rebind-Check (server only) |
| `src/lib/rateLimit.ts` | In-Memory Rate Limiter |
| `src/lib/supabase.ts` | Server-only Supabase-Client Factory |

---

## Entwicklung

```bash
# Starten
pnpm dev:web

# TypeScript-Check
pnpm --filter web exec tsc --noEmit

# Build
pnpm --filter web build
```
