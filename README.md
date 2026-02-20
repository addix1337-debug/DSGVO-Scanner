## Live Demo

DSGVO Scan Beispiel:
https://dsgvo-scanner-web.vercel.app/report/welt.de

# DSGVO Scanner

Ein Micro-SaaS MVP, das eine Website-URL entgegennimmt, die Seite per Playwright lädt und technische DSGVO-relevante Merkmale erkennt: externe Tracker, Fonts, Cookies, Impressum und Datenschutzerklärung.

**Kein Login. Kein Sales. Einfach URL eingeben → Ergebnis sehen.**

---

## Features

- Ampel-Anzeige (🔴 / 🟡 / 🟢) basierend auf erkannten Trackern
- Erkennt: Google Fonts, Google Analytics / GTM, Facebook Pixel, Tracking-Cookies (`_ga`, `_gid`, `_fbp`)
- Prüft Impressum und Datenschutzerklärung (Link-Text-Suche)
- Listet alle externen Domains und gesetzten Cookies auf
- Konkrete Fix-Hinweise pro erkanntem Problem
- SSRF-Schutz: Private IPs, DNS-Rebind-Check, Port-Allowlist, Credential-Block
- Rate Limiting: 10 Scans / 10 Minuten / IP + 10s Cooldown
- Idempotency: gleiche URL + IP innerhalb von 2 Minuten → bestehenden Scan zurückgeben

---

## Architektur

```
Browser
  │
  ▼
┌─────────────────────────────────────────┐
│  Next.js 14  (apps/web, Port 3000)      │
│                                          │
│  GET  /scan          URL-Eingabe-Form   │
│  GET  /scan/[id]     Ergebnis + Polling │
│  POST /api/scan      Scan anlegen       │
│  GET  /api/scan/[id] Status abrufen     │
└──────────────┬──────────────────────────┘
               │ POST /run { scanId }
               ▼
┌─────────────────────────────────────────┐
│  Worker (apps/worker, Port 3001)        │
│                                          │
│  Fastify + Playwright Chromium          │
│  → lädt URL, sammelt Requests/Cookies   │
│  → schreibt Ergebnis in Supabase        │
└──────────────┬──────────────────────────┘
               │ reads / writes
               ▼
┌─────────────────────────────────────────┐
│  Supabase Postgres                       │
│  table: scans                            │
│  (id, url, status, result, error_msg)   │
└─────────────────────────────────────────┘
```

Web → API Route → Worker (fire-and-forget) → Supabase
Browser pollt `/api/scan/[id]` alle 2 Sekunden bis `status = done | error`

---

## Quickstart

### Voraussetzungen

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation) (`npm install -g pnpm`)
- Ein [Supabase](https://supabase.com)-Konto (kostenloser Free-Tier reicht)

### 1. Repository klonen & Dependencies installieren

```bash
git clone <repo-url>
cd dsgvo-scanner

pnpm install
pnpm rebuild esbuild unrs-resolver   # Build-Scripts genehmigen (einmalig)
```

### 2. Playwright Chromium installieren

```bash
pnpm --filter worker exec playwright install chromium
```

> Lädt ~300 MB Chrome-Binary herunter. Einmalig nötig.

### 3. Supabase einrichten

Siehe [Supabase Setup](#supabase-setup) weiter unten.

### 4. ENV-Dateien anlegen

```bash
cp apps/web/.env.example   apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
```

Beide Dateien mit den Werten aus dem Supabase-Dashboard befüllen (siehe [ENV-Variablen](#env-variablen)).

### 5. Starten

**Option A — zwei separate Terminals (empfohlen für Logs):**

```bash
# Terminal 1
pnpm dev:worker

# Terminal 2
pnpm dev:web
```

**Option B — parallel in einem Terminal:**

```bash
pnpm dev
```

> Worker läuft auf http://localhost:3001
> Web läuft auf http://localhost:3000

### 6. Fertig

Öffne http://localhost:3000 → gibt zur `/scan`-Seite weiter → URL eingeben → Scan starten.

---

## Supabase Setup

### Projekt erstellen

1. Auf [supabase.com](https://supabase.com) einloggen
2. **New project** → Name vergeben, Region wählen, Passwort setzen
3. Warten bis das Projekt bereit ist (~1 Minute)

### Migrationen ausführen

Im Supabase-Dashboard: **SQL Editor** → **New query**

**Migration 001** – `scans`-Tabelle anlegen:

```sql
-- Inhalt von: supabase/migrations/001_create_scans.sql
create table if not exists public.scans (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null    default now(),
  url           text        not null,
  status        text        not null    check (status in ('queued', 'running', 'done', 'error')),
  result        jsonb,
  error_message text
);

alter table public.scans disable row level security;

create index if not exists scans_id_idx on public.scans (id);
create index if not exists scans_status_idx on public.scans (status);
```

→ **Run** klicken, dann:

**Migration 002** – `requester_ip`-Spalte für Idempotency:

```sql
-- Inhalt von: supabase/migrations/002_add_requester_ip.sql
alter table public.scans add column if not exists requester_ip text;

create index if not exists scans_ip_url_created_idx
  on public.scans (requester_ip, url, created_at desc);
```

→ **Run** klicken.

### API-Schlüssel finden

**Settings → API** im Supabase-Dashboard:

| Wert | Wo im Dashboard |
|---|---|
| `SUPABASE_URL` | „Project URL" |
| `SUPABASE_SERVICE_ROLE_KEY` | „service_role" (unter „Project API keys") |

> ⚠️ Den `anon`-Key **nicht** verwenden — nur den `service_role`-Key.

---

## ENV-Variablen

### `apps/web/.env.local`

| Variable | Pflicht | Beispiel | Beschreibung |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | `https://abc.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJh...` | Service-Role-Schlüssel (niemals ins Frontend!) |
| `WORKER_URL` | ✅ | `http://localhost:3001` | Base-URL des Worker-Services |
| `ALLOW_DEV_PORTS` | — | `true` | Erlaubt Ports 8080/8443 beim URL-Scan (nur lokal) |

### `apps/worker/.env`

| Variable | Pflicht | Beispiel | Beschreibung |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | `https://abc.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJh...` | Service-Role-Schlüssel |
| `PORT` | — | `3001` | Worker-Port (default: 3001) |

> ⚠️ **Niemals** `SUPABASE_SERVICE_ROLE_KEY` mit dem Präfix `NEXT_PUBLIC_` versehen.
> Er würde sonst im Browser-Bundle landen und öffentlich sichtbar werden.

---

## Lokal ausführen

```bash
# Worker starten (Terminal 1)
pnpm dev:worker
# → http://localhost:3001/health  {"status":"ok","service":"dsgvo-worker"}

# Web starten (Terminal 2)
pnpm dev:web
# → http://localhost:3000  (Redirect zu /scan)
```

### Relevante URLs

| URL | Beschreibung |
|---|---|
| http://localhost:3000/scan | URL-Eingabe-Formular |
| http://localhost:3000/scan/`<uuid>` | Scan-Ergebnis mit Polling |
| http://localhost:3001/health | Worker Health-Check |

---

## Smoke Tests

```bash
# 1. Sauber — keine Tracker
pnpm --filter worker scan:demo https://example.com

# 2. Mit Trackern (Google Fonts, Analytics erkennbar)
pnpm --filter worker scan:demo https://nytimes.com

# 3. SSRF geblockt — lokale Adresse
pnpm --filter worker scan:demo http://localhost
pnpm --filter worker scan:demo http://127.0.0.1
pnpm --filter worker scan:demo http://192.168.1.1
```

### Rate Limit testen (API)

```bash
# 11 schnelle POST-Requests → letzter sollte 429 zurückgeben
for i in {1..11}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/scan \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com"}'
done
```

---

## Troubleshooting

### Playwright: Browser nicht gefunden

```
Error: browserType.launch: Executable doesn't exist at ...
```

**Fix:**
```bash
pnpm --filter worker exec playwright install chromium
```

---

### `.env` wird nicht geladen (Windows)

Auf Windows erstellt der Explorer manchmal `.env.txt` statt `.env`.
Im Terminal prüfen:

```powershell
# PowerShell
Get-ChildItem -Force apps/worker/ | Where-Object Name -like "*.env*"
# Sollte ".env" zeigen, nicht ".env.txt"
```

Falls `.env.txt`: Datei umbenennen oder im Terminal anlegen:
```bash
cp apps/worker/.env.example apps/worker/.env
# Dann mit Editor öffnen und Werte eintragen
```

---

### Scan bleibt auf "queued" stecken

Der Worker ist nicht erreichbar. Prüfen:

1. Läuft der Worker? → `http://localhost:3001/health` im Browser aufrufen
2. Stimmt `WORKER_URL` in `apps/web/.env.local`? (kein Trailing-Slash!)
3. Worker-Terminal auf Fehler prüfen

---

### 429 Too Many Requests beim Testen

Rate Limit: **10 Scans pro 10 Minuten** + **10s Cooldown** pro IP.

Beim lokalen Testen: kurz warten oder eine andere URL verwenden.
Der `Retry-After`-Header gibt an, wie viele Sekunden zu warten sind.

---

### `blocked_url` — URL nicht erlaubt

Folgende URLs werden grundsätzlich geblockt:

- `http://localhost`, `http://127.0.0.1`, `http://10.x.x.x` → private/lokale Adressen
- `http://1.2.3.4` → direkte IP-Adressen (alle geblockt)
- `http://user:pass@example.com` → eingebettete Zugangsdaten
- Ports außer 80/443 (außer `ALLOW_DEV_PORTS=true` gesetzt)

---

### Supabase Fehler: `permission denied` oder `relation does not exist`

- Prüfen ob der `service_role`-Key (nicht `anon`!) in `.env` steht
- Prüfen ob beide Migrationen ausgeführt wurden (SQL Editor → Table Editor → `scans`-Tabelle sichtbar?)
- URL muss mit `https://` beginnen, kein Trailing-Slash

---

### Worker: `dns_failed` bei valider Domain

Das passiert wenn:
- Die Domain nicht existiert (Tipp-Fehler)
- DNS-Server lokal nicht erreichbar
- DNS-Timeout (5s) überschritten (seltenes Netzwerkproblem)

**Fix:** URL nochmals prüfen. Bei korrekter Domain: kurz warten und erneut scannen.

---

## Security Notes

### Service Role Key

Der `SUPABASE_SERVICE_ROLE_KEY` umgeht Supabase Row Level Security (RLS).
RLS ist für den MVP bewusst deaktiviert (alle Zugriffe laufen server-seitig).

**Vor einem öffentlichen Launch:**
1. RLS aktivieren: `ALTER TABLE scans ENABLE ROW LEVEL SECURITY;`
2. Policies definieren oder Service-Role-Zugriff auf dedizierte Backend-Funktion beschränken
3. Key niemals in Client-Code oder Git-History exponieren

### SSRF-Schutz (Server-Side Request Forgery)

Zwei Schutzschichten:

1. **Synchron (validateUrl):** Blockt private IPs, IP-Literals, Credentials, Non-Standard-Ports
2. **Asynchron (DNS-Rebind):** Löst den Hostnamen auf und prüft alle returned IPs gegen private Ranges — verhindert, dass `evil.com → 10.0.0.1` durchkommt

Beide Schichten laufen im Web (API Route) **und** im Worker (vor Playwright-Launch).

### Rate Limiting

In-Memory-Implementierung — funktioniert nur in Single-Process-Deployments.
Für Vercel/Serverless: durch [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit/overview) ersetzen.

### Playwright Sandbox

Chromium läuft mit `--no-sandbox` (Docker/CI-Kompatibilität). In Produktionsumgebungen:
- Worker in einem Container mit minimalen Rechten ausführen
- Netzwerk-Egress auf erlaubte Ports/IPs einschränken (Firewall-Regeln)
- Ressourcen-Limits setzen (CPU/RAM pro Scan)

---

## Skripte (Übersicht)

```bash
pnpm install               # Dependencies installieren
pnpm dev                   # Worker + Web parallel starten
pnpm dev:worker            # Nur Worker starten
pnpm dev:web               # Nur Web starten
pnpm build                 # Produktions-Build (Web + Worker)
pnpm typecheck             # TypeScript-Check (Worker + Web)
pnpm lint                  # ESLint (Web)

# Demo-Scan (kein Supabase nötig)
pnpm --filter worker scan:demo https://example.com

# Playwright-Browser installieren
pnpm --filter worker exec playwright install chromium
```

---

## Was als Nächstes

### Monitoring

- **Fehlertracking:** [Sentry](https://sentry.io) in Worker + Web einbinden (5 Minuten Setup)
- **Uptime:** Worker `/health` mit [UptimeRobot](https://uptimerobot.com) überwachen
- **Scan-Metriken:** `result.meta.scanDurationMs` in ein Dashboard schreiben (Grafana / Supabase Studio)

### Features

- **PDF-Report:** Scan-Ergebnis als druckbares PDF exportieren
- **Scheduled Scans:** Tägliche/wöchentliche Wiederholung per Cron + E-Mail-Diff
- **History:** Supabase Auth + RLS → Nutzer sehen ihre vergangenen Scans
- **API-Zugang:** API-Key-System für Entwickler (programmatischer Scan-Aufruf)
- **Batch-Scan:** Mehrere URLs gleichzeitig (Queue mit [BullMQ](https://bullmq.io))

### Monetarisierung

- **Freemium:** 5 Scans/Tag kostenlos, dann Stripe-Abo für unbegrenzte Scans
- **Pay-per-Scan:** Prepaid Credits (Stripe Billing)
- **B2B-Whitelabel:** Agentur-Plan mit eigenem Branding + PDF-Reports
- **API-as-a-Service:** Volumenbasierte Abrechnung für Devs

---

## Lizenz

MIT — siehe [LICENSE](LICENSE) (noch anzulegen)
